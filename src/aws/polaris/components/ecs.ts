import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import * as pulumi from "@pulumi/pulumi";
import {PolarisDBResources} from "./postgres";
import {EcrResources} from "./ecr";


interface PolarisEcsProps {
    ecrResources: EcrResources;
    dbResources: PolarisDBResources;

}

export class PolarisECS {
    constructor(config: pulumi.Config, props: PolarisEcsProps) {

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
                                    "secretsmanager:*",
                                    // "secretsmanager:GetSecretValue",
                                    // "secretsmanager:DescribeSecret"
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
                image: pulumi.interpolate`${props.ecrResources.polarisRepo.repositoryUrl}:1.1.0-incubating`,
                name: 'polaris',
                essential: true,
                portMappings: [{containerPort: 8081, protocol: 'tcp'}],
                environment: [
                    {name: 'POLARIS_PERSISTENCE_TYPE', value: 'relational-jdbc'},
                    {name: 'QUARKUS_DATASOURCE_JDBC_URL', value: pulumi.interpolate`jdbc:postgresql://${props.dbResources.rdsInstance.address}:5432/polaris`},
                    {name: 'POLARIS_REALM_CONTEXT_REALMS', value: 'POLARIS'},
                    {name: 'POLARIS_REALM_CONTEXT_REQUIRE_HEADER', value: 'true'},
                ],
                secrets: [
                    {
                        name: 'QUARKUS_DATASOURCE_USERNAME',
                        valueFrom: currentIdentity.then(
                            identity =>
                                `arn:aws:secretsmanager:us-east-1:${identity.accountId}:secret:dev/polaris/postgres-2byvBJ:QUARKUS_DATASOURCE_USERNAME::`
                        )
                    },
                    {
                        name: 'QUARKUS_DATASOURCE_PASSWORD',
                        valueFrom: currentIdentity.then(
                            identity =>
                                `arn:aws:secretsmanager:us-east-1:${identity.accountId}:secret:dev/polaris/postgres-2byvBJ:QUARKUS_DATASOURCE_PASSWORD::`
                        )
                    }
                ]
            },
            runtimePlatform: {
                cpuArchitecture: "ARM64",
                operatingSystemFamily: "LINUX",
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

        const cert = new aws.acm.Certificate("PolarisCert", {
            domainName: "benjaminforleo.com",
            validationMethod: "DNS",
            region: "us-east-1",
        });

        const zone = aws.route53.getZone({ name: "benjaminforleo.com" });

        // Needed this to validate the certificate
        const certValidationRecord = new aws.route53.Record("PolarisCertValidation", {
            name: cert.domainValidationOptions[0].resourceRecordName,
            zoneId: zone.then(z => z.zoneId),
            type: cert.domainValidationOptions[0].resourceRecordType,
            records: [cert.domainValidationOptions[0].resourceRecordValue],
            ttl: 60,
        });

        const certValidation = new aws.acm.CertificateValidation("PolarisCertValidation", {
            certificateArn: cert.arn,
            validationRecordFqdns: [certValidationRecord.fqdn],
        });

        const albSecurityGroup = new aws.ec2.SecurityGroup("AlbSecurityGroup", {
            name: "polaris-alb-sg",
            description: "Security group for ALB",
            vpcId: defaultVpc.id
        });

        new aws.vpc.SecurityGroupIngressRule("PolarisHttpsIngress", {
            securityGroupId: albSecurityGroup.id,
            ipProtocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrIpv4: "0.0.0.0/0"
        })


        // const alb = new awsx.lb.ApplicationLoadBalancer("myAlb", {
        //     defaultTargetGroup: {
        //         port: 80,
        //     },
        //     securityGroups: [], // Add your security group IDs
        //     subnets: [], // Add your subnet IDs
        // });


        // const alb = new awsx.lb.ApplicationLoadBalancer('PolarisALB', {
        //     name: 'polaris-alb',
        //     internal: false,
        //     securityGroups: [albSecurityGroup.id],
        //
        // });


        new awsx.ecs.FargateService("PolarisService", {
            name: "polaris",
            platformVersion: "1.4.0",
            cluster: cluster.arn,
            forceNewDeployment: true,
            desiredCount: 1,
            forceDelete: true,
            deploymentCircuitBreaker: {enable: true, rollback: true},
            networkConfiguration: {
                subnets: subnets.ids,
                assignPublicIp: true,
                securityGroups: [ecsSecurityGroup.id]
            },
            taskDefinition: taskDefinition.taskDefinition.arn
        });

    }
}