import * as pulumi from "@pulumi/pulumi";
import { PolarisECS } from './components/ecs'
import {PolarisDBResources} from "./components/postgres";
import * as ecr from "./components/ecr";


export class Polaris {
    constructor(config: pulumi.Config) {

        const ecrResources = new ecr.EcrResources();
        const dbResources = new PolarisDBResources(config);
        new PolarisECS(config, {
            ecrResources: ecrResources,
            dbResources: dbResources
        });
    }
}