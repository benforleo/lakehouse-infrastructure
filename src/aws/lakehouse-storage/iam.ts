import * as aws from "@pulumi/aws"


const current = aws.getCallerIdentity({})
const policy = current.then(identity => JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
        Effect: "Allow",
        Principal: {
            AWS: [identity.accountId]
        },
        Action: "sts:AssumeRole",
    }]
}));


const snowflakeRole = new aws.iam.Role("SnowflakeRole", {
    name: "SnowflakeRole",
    assumeRolePolicy: policy,
})

// snowflakeRole.assumeRolePolicy.apply(policy => {});

export {snowflakeRole}