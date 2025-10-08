import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'

export class PolarisECS {
    constructor() {

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
            managedPolicyArns:[aws.iam.ManagedPolicy.AmazonECSTaskExecutionRolePolicy]
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
            managedPolicyArns:[aws.iam.ManagedPolicy.AmazonECSTaskExecutionRolePolicy]
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
                image: '429414942599.dkr.ecr.us-east-1.amazonaws.com/polaris:1.1.0-incubating',
                name: 'polaris',
                essential: true,
                portMappings: [{ containerPort: 8081, protocol: 'tcp' }],
                // secrets: [
                //     {
                //         name: 'QUARKUS_DATASOURCE_USERNAME',
                //         valueFrom: 'arn:aws:ssm:us-east-1:429414942599:parameter/polaris/AWS_ACCESS_KEY_ID'
                //     }
                // ]
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
    }
}