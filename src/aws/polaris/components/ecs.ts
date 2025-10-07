import * as aws from '@pulumi/aws'

export class PolarisECS {
    constructor() {

        const cluster = new aws.ecs.Cluster("PolarisCluster", {
            name: "polaris-cluster",
            region: "us-east-1",
            settings: [{
                name: "containerInsights",
                value: "disabled"
            }]
        });


    }
}