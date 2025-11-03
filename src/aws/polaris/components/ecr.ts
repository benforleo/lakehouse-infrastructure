import * as aws from "@pulumi/aws";
import * as command from "@pulumi/command";
import {Config} from "@pulumi/pulumi";

export class EcrResources {
    public readonly polarisRepo: aws.ecr.Repository;

    constructor(cfg: Config) {
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

        const version = cfg.get("polarisVersion") || "1.2.0-incubating"

        new command.local.Command("PushPolarisImage", {
            create: `zsh deploy/push-polaris.sh ${version}`,
            update: `zsh deploy/push-polaris.sh ${version}`,
        }, {dependsOn: [this.polarisRepo]});

    }
}
