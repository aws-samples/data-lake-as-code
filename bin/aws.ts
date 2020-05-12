#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BaselineStack } from '../lib/baseline-stack';
import { DataLakeStack } from '../lib/stacks/datalake-stack';
import { OpenTargetsStack } from '../lib/opentargets-stack';
import { ChemblStack } from '../lib/chembl-25-stack';
import { AnalyticsStack } from '../lib/analytics-stack.js';
import iam = require('@aws-cdk/aws-iam');
import s3 = require('@aws-cdk/aws-s3');
import { DataLakeEnrollment } from '../lib/constructs/data-lake-enrollment';

const app = new cdk.App();
const baseline = new BaselineStack(app, 'BaselineStack');


const coreDataLake = new DataLakeStack(app, 'CoreDataLake', {

});

const chemblStack = new ChemblStack(app, 'ChemblStack', {
    database: baseline.ChemblDb,
    accessSecurityGroup: baseline.chemblDBChemblDbAccessSg,
    databaseSecret: baseline.chemblDBSecret,
    DataLake: coreDataLake
});

const openTargetsStack = new OpenTargetsStack(app, 'OpenTargetsStack', {
    sourceBucket: baseline.OpenTargetsSourceBucket,
    sourceBucketDataPrefix: '/opentargets/sourceExports/19.11/output/',
    DataLake: coreDataLake
});

const analyticsStack = new AnalyticsStack(app, 'AnalyticsStack', {
    targetVpc: baseline.Vpc,
});


chemblStack.grantIamRead(analyticsStack.NotebookRole);
openTargetsStack.grantIamRead(analyticsStack.NotebookRole);








const exampleUser = iam.User.fromUserName(coreDataLake, 'exampleGrantee', 'paul1' );

var exampleGrant: DataLakeEnrollment.TablePermissionGrant = {
    tables: ["association_data", "evidence_data","target_list","disease_list"],
    DatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
    GrantableDatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
    TablePermissions: [DataLakeEnrollment.TablePermission.Select, DataLakeEnrollment.TablePermission.Insert, DataLakeEnrollment.TablePermission.Delete],
    GrantableTablePermissions: [DataLakeEnrollment.TablePermission.Select]
};

openTargetsStack.grantTablePermissions(exampleUser, exampleGrant);




// In the example below, we are using the compound_structures table from ChEMBL. It has the following table definition:
// ['molregno', 'molfile', 'standard_inchi', 'standard_inchi_key', 'canonical_smiles']
// Lets say we want to give a principal ONLY select permissions to everything in the compound_structures table BUT the 'canonical_smiles' column.

var exampleTableWithColumnsGrant: DataLakeEnrollment.TableWithColumnPermissionGrant = {
    table: "chembl_25_public_compound_structures",
    // Note that we are NOT including 'canonical_smiles'. That effectivley prevents this user from querying that column.
    columns: ['molregno', 'molfile', 'standard_inchi', 'standard_inchi_key'],
    DatabasePermissions: [],
    GrantableDatabasePermissions: [],
    TableColumnPermissions: [DataLakeEnrollment.TablePermission.Select],
    GrantableTableColumnPermissions: []
};

var exampleTableWithColumnsGrant_WithWildCard: DataLakeEnrollment.TableWithColumnPermissionGrant = {
    table: "chembl_25_public_compound_structures",
    wildCardFilter: DataLakeEnrollment.TableWithColumnFilter.Exclude,
    columns: ['canonical_smiles'],
    DatabasePermissions: [],
    GrantableDatabasePermissions: [],
    TableColumnPermissions: [DataLakeEnrollment.TablePermission.Select],
    GrantableTableColumnPermissions: []
};

// Note that exampleTableWithColumnsGrant exampleTableWithColumnsGrant_WithWildCard grants the same effecitve permissions. One just uses a the wildcard.
chemblStack.grantTableWithColumnPermissions(exampleUser, exampleTableWithColumnsGrant);