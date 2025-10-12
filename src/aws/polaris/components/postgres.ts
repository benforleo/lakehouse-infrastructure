import * as aws from "@pulumi/aws";
import {Config} from "@pulumi/pulumi";


export class PolarisDBResources {
    public readonly rdsInstance: aws.rds.Instance;
    constructor(cfg: Config) {

        const defaultVpc = aws.ec2.getVpcOutput({
            default: true
        });

        // Can't replace this when RDS is still in use.
        const rdsSecurityGroup = new aws.ec2.SecurityGroup("RdsSecurityGroup", {
            name: "polaris-rds-sg",
            description: "Security group for RDS instance",
            vpcId: defaultVpc.id
        });

        new aws.vpc.SecurityGroupIngressRule("AllowPostgresIngress", {
            securityGroupId: rdsSecurityGroup.id,
            ipProtocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            cidrIpv4: "0.0.0.0/0",
        });

        this.rdsInstance = new aws.rds.Instance("PolarisPostgresDB", {
            identifier: "polaris-postgres-db",
            instanceClass: aws.rds.InstanceType.T4G_Micro,
            allowMajorVersionUpgrade: false,
            allocatedStorage: 20,
            storageType: "gp3",
            dbName: "polaris",
            engine: "postgres",
            engineVersion: "16",
            iamDatabaseAuthenticationEnabled: true,
            region: "us-east-1",
            username: cfg.requireSecret("polarisUser"),
            password: cfg.requireSecret("polarisPwd"),
            vpcSecurityGroupIds: [rdsSecurityGroup.id],
            publiclyAccessible: true,
            skipFinalSnapshot: true
        });
    }
}

