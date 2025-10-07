import * as pulumi from "@pulumi/pulumi";
import { PolarisECS } from './components/ecs'
import {PolarisPostgresDB} from "./components/postgres";
import * as ecr from "./components/ecr";


export class Polaris {
    constructor(config: pulumi.Config) {
        new ecr.ECR();
        new PolarisPostgresDB(config);
        new PolarisECS();
    }
}