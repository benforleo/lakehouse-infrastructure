import * as dbt from './dbt-config/dbt-config';
import * as ecr from './polaris/ecr';
import { PolarisPostgresDB } from './polaris/postgres';

import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

new PolarisPostgresDB(config);
new ecr.ECR();
new dbt.SnowflakeDBTTrainingResources();




