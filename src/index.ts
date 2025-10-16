import * as pulumi from "@pulumi/pulumi";

import { Polaris } from './aws/polaris/polaris';

function main() {
    const config = new pulumi.Config();
    new Polaris(config)
    // new dbt.SnowflakeDBTTrainingResources();
}

main();