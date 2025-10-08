import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import {config} from "@pulumi/aws";

export class PolarisECS {
    constructor() {

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

        // const taskDefinition = new aws.ecs.TaskDefinition("PolarisTask", {
        //     family: 'polaris-task',
        //     containerDefinitions: JSON.stringify({
        //
        //     }),
        // });

        // const taskDefinition = new awsx.ecs.FargateTaskDefinition("PolarisTask", {
        //     container: {
        //         image: '429414942599.dkr.ecr.us-east-1.amazonaws.com/polaris:1.1.0-incubating',
        //         name: 'polaris'
        //     },
        //     cpu: '1024',
        //     family: 'polaris-task',
        //     logGroup: {
        //         args: {}
        //     }
        //     memory: '2048',
        //
        //
        // });
    }
}