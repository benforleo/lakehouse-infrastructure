import * as aws from '@pulumi/aws';

const callerIdentity = aws.getCallerIdentity({})
const bucketName = callerIdentity.then(identity => `data-lake-raw-${identity.accountId}-us-east-1`);


const rawBucket = new aws.s3.BucketV2("DataLakeRaw", {
    bucket: bucketName,
    tags: {
        Name: "Pulumi",
        Environment: "development"
    },
    forceDestroy: true,
});


new aws.s3.BucketPublicAccessBlock("RawBucketPublicAccessBlock", {
    bucket: rawBucket.bucket,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
})

new aws.s3.BucketServerSideEncryptionConfigurationV2("RawBucketEncryption", {
    bucket: rawBucket.bucket,
    rules: [{
        applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
        },
    }],
});

export { rawBucket}



