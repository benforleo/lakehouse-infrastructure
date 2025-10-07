import * as dbt from './snowflake/dbt-config/dbt-config';
import * as ecr from './aws/polaris/components/ecr';
import {PolarisPostgresDB} from './aws/polaris/components/postgres';

import * as pulumi from "@pulumi/pulumi";


function main() {

    const config = new pulumi.Config();
    new PolarisPostgresDB(config);
    new ecr.ECR();
    new dbt.SnowflakeDBTTrainingResources();
}

main();