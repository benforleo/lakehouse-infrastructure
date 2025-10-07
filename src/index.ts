import * as dbt from './dbt-config/dbt-config';
import * as ecr from './polaris/ecr';

new ecr.ECR();
new dbt.SnowflakeDBTTrainingResources();




