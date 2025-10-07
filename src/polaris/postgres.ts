// import * as aws from "@pulumi/aws";
//
// // Security group for PostgreSQL
// const postgresSg = new aws.ec2.SecurityGroup("postgres-sg", {
//     description: "Allow PostgreSQL access",
//     ingress: [{
//         protocol: "tcp",
//         fromPort: 5432,
//         toPort: 5432,
//         cidrBlocks: ["0.0.0.0/0"], // Adjust for your needs
//     }],
//     egress: [{
//         protocol: "-1",
//         fromPort: 0,
//         toPort: 0,
//         cidrBlocks: ["0.0.0.0/0"],
//     }],
//     tags: {
//         Project: "MyProject",
//         Owner: "benforleo"
//     }
// });
//
// // Subnet group (replace subnet IDs with your own)
// const subnetGroup = new aws.rds.SubnetGroup("postgres-subnet-group", {
//     subnetIds: ["subnet-xxxxxxxx", "subnet-yyyyyyyy"], // Replace with your subnet IDs
//     tags: {
//         Project: "MyProject",
//         Owner: "benforleo"
//     }
// });
//
// // RDS PostgreSQL instance
// export const postgres = new aws.rds.Instance("postgres-db", {
//     engine: "postgres",
//     instanceClass: "db.t3.micro", // Smallest instance type
//     allocatedStorage: 20, // GB
//     dbSubnetGroupName: subnetGroup.name,
//     vpcSecurityGroupIds: [postgresSg.id],
//     name: "mydb",
//     username: "myuser",
//     password: "mypassword123", // Use Pulumi secrets in production
//     skipFinalSnapshot: true,
//     publiclyAccessible: true,
//     tags: {
//         Project: "MyProject",
//         Owner: "benforleo"
//     }
// });
//
// export const endpoint = postgres.endpoint;
// export const dbName = postgres.name;

