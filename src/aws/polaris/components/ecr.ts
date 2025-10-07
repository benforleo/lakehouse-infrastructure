import * as aws from "@pulumi/aws";


export class ECR {
    public readonly polarisRepo: aws.ecr.Repository;

    constructor() {
        this.polarisRepo = new aws.ecr.Repository("PolarisRepo", {
            name: "polaris",
            forceDelete: true,
            imageTagMutability: "MUTABLE",
            imageScanningConfiguration: {
                scanOnPush: false,
            }
        });

        new aws.ecr.LifecyclePolicy("PolarisRepoLifecyclePolicy", {
            repository: this.polarisRepo.name,
            policy: JSON.stringify({
                rules: [
                    {
                        rulePriority: 1,
                        description: "Expire untagged images",
                        selection: {
                            tagStatus: "untagged",
                            countType: "imageCountMoreThan",
                            countNumber: 1,
                        },
                        action: {
                            type: "expire"
                        }
                    }
                ]
            })
        });
    }
}
