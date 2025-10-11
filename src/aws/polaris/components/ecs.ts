import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import * as pulumi from "@pulumi/pulumi";

export class PolarisECS {
    constructor(config: pulumi.Config, polarisDb: aws.rds.Instance) {

        const currentIdentity = aws.getCallerIdentity({});

        const executionRole = new aws.iam.Role("PolarisExecutionRole", {
            name: 'polaris-execution-role',
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "ecs-tasks.amazonaws.com",
                        },
                        Effect: "Allow",
                    },
                ],
            }),
            managedPolicyArns: [aws.iam.ManagedPolicy.AmazonECSTaskExecutionRolePolicy],
            inlinePolicies: [
                {
                    name: "AWSSecretsManagerReadOnly",
                    policy: JSON.stringify({
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Effect: "Allow",
                                Action: [
                                    "secretsmanager:GetSecretValue",
                                    "secretsmanager:DescribeSecret"
                                ],
                                Resource: "*"
                            }
                        ]
                    })
                }
            ]
        });

        const taskRole = new aws.iam.Role("PolarisTaskRole", {
            name: 'polaris-task-role',
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "ecs-tasks.amazonaws.com",
                        },
                        Effect: "Allow",
                    },
                ],
            }),
            managedPolicyArns: [aws.iam.ManagedPolicy.AmazonECSTaskExecutionRolePolicy]
        });

        const logGroup = new aws.cloudwatch.LogGroup("PolarisLogGroup", {
            name: "/aws-ecs/polaris",
            retentionInDays: 7,
            skipDestroy: false,
            region: "us-east-1",
        });

        const cluster = new aws.ecs.Cluster("PolarisCluster", {
            name: "polaris-cluster",
            region: "us-east-1",
            settings: [{
                name: "containerInsights",
                value: "disabled"
            }]
        });


        const taskDefinition = new awsx.ecs.FargateTaskDefinition("PolarisTask", {
            container: {
                image: currentIdentity.then(identity => `${identity.accountId}.dkr.ecr.us-east-1.amazonaws.com/polaris:1.1.0-incubating`),
                name: 'polaris',
                essential: true,
                portMappings: [{containerPort: 8081, protocol: 'tcp'}],
                environment: [
                    {name: 'POLARIS_PERSISTENCE_TYPE', value: 'relational-jdbc'},
                    {name: 'QUARKUS_DATASOURCE_JDBC_URL', value: pulumi.interpolate`${polarisDb.address}:5432/polaris`},
                    {name: 'POLARIS_REALM_CONTEXT_REALMS', value: 'POLARIS'},
                    {name: 'POLARIS_REALM_CONTEXT_REQUIRE_HEADER', value: 'true'},
                ],
                secrets: [
                    {
                        name: 'QUARKUS_DATASOURCE_USERNAME',
                        valueFrom: currentIdentity.then(
                            identity =>
                                `arn:aws:secretsmanager:us-east-1:${identity.accountId}:secret:dev/polaris/postgres-2byvBJ`
                        )
                    },
                    {
                        name: 'QUARKUS_DATASOURCE_PASSWORD',
                        valueFrom: currentIdentity.then(
                            identity =>
                                `arn:aws:secretsmanager:us-east-1:${identity.accountId}:secret:dev/polaris/postgres-2byvBJ`
                        )
                    }
                ]
            },
            cpu: '1024',
            executionRole: {
                roleArn: executionRole.arn,
            },
            family: 'polaris-task',
            logGroup: {
                existing: {
                    arn: logGroup.arn
                }
            },
            memory: '2048',
            taskRole: {
                roleArn: taskRole.arn,
            },
            skipDestroy: false,
        });

        const defaultVpc = aws.ec2.getVpcOutput({
            default: true
        });

        const subnets = aws.ec2.getSubnetsOutput({
            filters: [
                {
                    name: "vpc-id",
                    values: [defaultVpc.id],
                },
            ],
        });

        const ecsSecurityGroup = new aws.ec2.SecurityGroup("EcsSecurityGroup", {
            name: "polaris-ecs-sg",
            description: "Security group for RDS instance",
            vpcId: defaultVpc.id
        });

        new aws.vpc.SecurityGroupEgressRule("AllowAllEgress", {
            securityGroupId: ecsSecurityGroup.id,
            ipProtocol: "-1",
            cidrIpv4: "0.0.0.0/0"
        });


        // new awsx.ecs.FargateService("PolarisService", {
        //     name: "polaris",
        //     cluster: cluster.arn,
        //     forceNewDeployment: true,
        //     desiredCount: 1,
        //     forceDelete: true,
        //     deploymentCircuitBreaker: {enable: true, rollback: true},
        //     networkConfiguration: {
        //         subnets: subnets.ids,
        //         assignPublicIp: true,
        //         securityGroups: [ecsSecurityGroup.id]
        //     },
        //     taskDefinition: taskDefinition.taskDefinition.arn
        // });

        // arn:aws:secretsmanager:us-east-1:429414942599:secret:dev/polaris/postgres-2byvBJ:QUARKUS_DATASOURCE_USERNAME::
    }
}