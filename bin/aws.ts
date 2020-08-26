#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BaselineStack } from '../lib/baseline-stack';
import { DataLakeStack } from '../lib/stacks/datalake-stack';
import { OpenTargetsStack } from '../lib/opentargets-stack';
import { ChemblStack } from '../lib/chembl-25-stack';
import { GTExStack } from '../lib/gtex-stack';
import { BindingDBStack } from '../lib/bindingdb-stack';
import { AnalyticsStack } from '../lib/analytics-stack';
import iam = require('@aws-cdk/aws-iam');
import s3 = require('@aws-cdk/aws-s3');
import { DataLakeEnrollment } from '../lib/constructs/data-lake-enrollment';
import { DataSetTemplateStack, CrawlerTemplateStack } from '../lib/stacks/dataset-stack';


const app = new cdk.App();

//console.log("Setting up dataset baselines.");

const baseline = new BaselineStack(app, 'BaselineStack');

//console.log("Setting up core data lake.");

const coreDataLake = new DataLakeStack(app, 'CoreDataLake', {
    starterLakeFormationAdminPrincipalArn: app.node.tryGetContext("starterLakeFormationAdmin")
});

//console.log("Setting up ChEMBL enrollment stack.");

const chemblStack = new ChemblStack(app, 'ChemblStack', {
    ChemblDb25: baseline.ChemblDb25,
    ChemblDb27: baseline.ChemblDb27,
    accessSecurityGroup: baseline.ChemblDBChemblDbAccessSg,
    databaseSecret: baseline.ChemblDBSecret,
    DataLake: coreDataLake
});

//console.log("Setting up OpenTargets enrollment stack.");

const openTargetsStack = new OpenTargetsStack(app, 'OpenTargetsStack', {
    sourceBucket: baseline.OpenTargetsSourceBucket,
    sourceBucketDataPrefix: '/opentargets/sourceExports/',
    DataLake: coreDataLake
});

//console.log("Setting up BindingDB enrollment stack.");

const bindingDBStack = new BindingDBStack(app, 'BindingDbStack', {
    database: baseline.BindingDb,
    accessSecurityGroup: baseline.BindingDBAccessSg,
    databaseSecret: baseline.BindingDBSecret,
    DataLake: coreDataLake
});


//console.log("Setting up GTEx enrollment stack.");

const gtexStack = new GTExStack(app, 'GTExStack', {
    sourceBucket: baseline.GTExSourceBucket,
    sourceBucketDataPrefix: '/gtex/sourceExports/',
    DataLake: coreDataLake
});


const analyticsStack = new AnalyticsStack(app, 'AnalyticsStack', {
    targetVpc: baseline.Vpc,
});


// chemblStack.grantIamRead(analyticsStack.NotebookRole);
// openTargetsStack.grantIamRead(analyticsStack.NotebookRole);
// bindingDBStack.grantIamRead(analyticsStack.NotebookRole);




const OpenTargetsRodaTemplate = new DataSetTemplateStack(app, 'OpenTargets1911RodaTemplate', {
    DatabaseDescriptionPath: "../../RODA_templates/open_targets_1911_get_database.json",
    DescribeTablesPath: "../../RODA_templates/open_targets_1911_get_tables.json",
    DataSetName: openTargetsStack.Enrollments[0].DataSetName
});

const OpenTargets2006RodaTemplate = new DataSetTemplateStack(app, 'OpenTargets2006RodaTemplate', {
    DatabaseDescriptionPath: "../../RODA_templates/opentargets_20_06_get_database.json",
    DescribeTablesPath: "../../RODA_templates/opentargets_20_06_get_tables.json",
    DataSetName: openTargetsStack.Enrollments[1].DataSetName
});


const Chembl25RodaTemplate = new DataSetTemplateStack(app, 'Chembl25RodaTemplate', {
    DatabaseDescriptionPath: "../../RODA_templates/chembl_25_get_database.json",
    DescribeTablesPath: "../../RODA_templates/chembl_25_get_tables.json",
    DataSetName: chemblStack.Enrollments[0].DataSetName
});

const Chembl27RodaTemplate = new DataSetTemplateStack(app, 'Chembl27RodaTemplate', {
    DatabaseDescriptionPath: "../../RODA_templates/chembl_27_get_database.json",
    DescribeTablesPath: "../../RODA_templates/chembl_27_get_tables.json",
    DataSetName: chemblStack.Enrollments[1].DataSetName
});


const BindinbDbRodaTemplate = new DataSetTemplateStack(app, 'BindingDbRodaTemplate', {
    DatabaseDescriptionPath: "../../RODA_templates/binding_db_get_database.json",
    DescribeTablesPath: "../../RODA_templates/binding_db_get_tables.json",
    DataSetName: bindingDBStack.Enrollments[0].DataSetName
});


const GTExRodaTemplate8 = new CrawlerTemplateStack(app, 'GTExRodaTemplate8', {
    databaseDescriptionPath: "../../RODA_templates/gtex_8_get_database.json",
    crawlerDescriptionPath: "../../RODA_templates/gtex_8_get_crawler.json",
    DataSetName: gtexStack.Enrollments[0].DataSetName
});



// const exampleUser = iam.User.fromUserName(coreDataLake, 'exampleGrantee', 'paul1' );

// var exampleGrant: DataLakeEnrollment.TablePermissionGrant = {
//     tables: ["association_data", "evidence_data","target_list","disease_list"],
//     DatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
//     GrantableDatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
//     TablePermissions: [DataLakeEnrollment.TablePermission.Select, DataLakeEnrollment.TablePermission.Insert, DataLakeEnrollment.TablePermission.Delete],
//     GrantableTablePermissions: [DataLakeEnrollment.TablePermission.Select]
// };

// openTargetsStack.grantTablePermissions(exampleUser, exampleGrant);




// // In the example below, we are using the compound_structures table from ChEMBL. It has the following table definition:
// // ['molregno', 'molfile', 'standard_inchi', 'standard_inchi_key', 'canonical_smiles']
// // Lets say we want to give a principal ONLY select permissions to everything in the compound_structures table BUT the 'canonical_smiles' column.

// var exampleTableWithColumnsGrant: DataLakeEnrollment.TableWithColumnPermissionGrant = {
//     table: "chembl_25_public_compound_structures",
//     // Note that we are NOT including 'canonical_smiles'. That effectivley prevents this user from querying that column.
//     columns: ['molregno', 'molfile', 'standard_inchi', 'standard_inchi_key'],
//     DatabasePermissions: [],
//     GrantableDatabasePermissions: [],
//     TableColumnPermissions: [DataLakeEnrollment.TablePermission.Select],
//     GrantableTableColumnPermissions: []
// };

// var exampleTableWithColumnsGrant_WithWildCard: DataLakeEnrollment.TableWithColumnPermissionGrant = {
//     table: "chembl_25_public_compound_structures",
//     wildCardFilter: DataLakeEnrollment.TableWithColumnFilter.Exclude,
//     columns: ['canonical_smiles'],
//     DatabasePermissions: [],
//     GrantableDatabasePermissions: [],
//     TableColumnPermissions: [DataLakeEnrollment.TablePermission.Select],
//     GrantableTableColumnPermissions: []
// };

// // Note that exampleTableWithColumnsGrant exampleTableWithColumnsGrant_WithWildCard grants the same effecitve permissions. One just uses a the wildcard.
// chemblStack.grantTableWithColumnPermissions(exampleUser, exampleTableWithColumnsGrant);