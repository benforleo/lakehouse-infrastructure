import * as dbt from './snowflake/dbt-config/dbt-config';
import * as ecr from './aws/polaris/components/ecr';
import { Polaris } from './aws/polaris/polaris';

import * as pulumi from "@pulumi/pulumi";



function main() {
    const config = new pulumi.Config();

    new Polaris(config)
    new dbt.SnowflakeDBTTrainingResources();
}

main();