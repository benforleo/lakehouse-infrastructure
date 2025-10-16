import * as aws from "@pulumi/aws";
import * as command from "@pulumi/command";

export class EcrResources {
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

        new command.local.Command("PushPolarisImage", {
            create: "zsh deploy/push-polaris.sh",
            update: "zsh deploy/push-polaris.sh",
        }, {dependsOn: [this.polarisRepo]});

    }
}
