import * as snow from "@pulumi/snowflake";
import * as pulumi from "@pulumi/pulumi";

export class SnowflakeDBTTrainingResources {
    public readonly role: snow.AccountRole;
    public readonly warehouse: snow.Warehouse;

    constructor() {
        // This class can be used to encapsulate any additional logic or properties related to dbt training.

        this.role = new snow.AccountRole("DBTRole", {
            comment: "Role for dbt operations",
            name: "TRANSFORM",
        });

        this.warehouse = new snow.Warehouse("DBT Warehouse", {
            name: "DBT_WH",
            comment: "Warehouse for dbt operations",
            warehouseSize: "X-SMALL",
            autoSuspend: 60,
            initiallySuspended: true,
            scalingPolicy: "ECONOMY",
            statementTimeoutInSeconds: 300,
        });


        new snow.GrantPrivilegesToAccountRole('DBTRoleWarehouseGrant', {
            accountRoleName: this.role.name,
            allPrivileges: true,
            onAccountObject: {
                objectType: "WAREHOUSE",
                objectName: this.warehouse.name,
            },
        });

        const user = new snow.User("DBTUser", {
            name: "dbt_user",
            loginName: "dbt_user",
            displayName: "dbt_user",
            rsaPublicKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuqVphTZCwESB/Q9SLhnf" +
                "bUyQrz7hn7M/dgXWFgHMg7VnIozMUMBnDyPlWAS+4/vokApLBmAWNMr1G8/MFQhP" +
                "4aZuTMwNIxJBQuypuvmBwhcieUO8t48/d7awMm1fR6eYmUaLmc9dpYPLNCjdXJ8U" +
                "fxXApoeIzgKgiPk1Qb+hrIuUuUTgNp7MsRoAW/xvmdBnNkS83iYt0BrCMSk6bp18" +
                "tdZcXUe3e8jEVyKpMdWx7L7nc+3dMgQCRa6eJYUDWqW8YyHm7ENNBLGAiYlg6dwE" +
                "TORMN9Dsb9JnMaUy/Pk880EhwNpjUcHb/ktaj2zlAZGsmS1s6D9/Qr4JAFYrYYZ5" +
                "dwIDAQAB",
            disableMfa: "true",
            mustChangePassword: "false",
            defaultWarehouse: this.warehouse.name,
            defaultRole: this.role.name,
            defaultNamespace: "AIRBNB.RAW",
            comment: "User for dbt operations",
        });

        new snow.GrantAccountRole("DBTUserRoleGrant", {
            roleName: this.role.name,
            userName: user.name
        });

        const database = new snow.Database('DBTTraingDB', {
            name: 'AIRBNB'
        });
        const schema = new snow.Schema('DBTTrainingSchema', {
            database: database.name,
            name: 'RAW'
        });

        new snow.GrantPrivilegesToAccountRole("DBTRoleDatabaseGrant", {
            accountRoleName: this.role.name,
            allPrivileges: true,
            onAccountObject: {
                objectType: 'DATABASE',
                objectName: database.name,
            },
        });

        new snow.GrantPrivilegesToAccountRole('SchemaGrant', {
            accountRoleName: this.role.name,
            allPrivileges: true,
            onSchema: {
                allSchemasInDatabase: database.name,
            }
        });

        new snow.GrantPrivilegesToAccountRole('TableGrant', {
            accountRoleName: this.role.name,
            allPrivileges: true,
            onSchemaObject: {
                all: {
                    objectTypePlural: "TABLES",
                    inSchema: pulumi.interpolate`${database.name}.${schema.name}`,
                }
            },
        });
    }
}
