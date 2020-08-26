#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DataLakeStack } from '../lib/stacks/datalake-stack';
import iam = require('@aws-cdk/aws-iam');
import s3 = require('@aws-cdk/aws-s3');
import ec2 = require('@aws-cdk/aws-ec2');
import rds = require('@aws-cdk/aws-rds');
import { DataLakeEnrollment } from '../lib/constructs/data-lake-enrollment';
import { DataSetTemplateStack, CrawlerTemplateStack } from '../lib/stacks/dataset-stack';
import { ExampleS3DataSet } from '../lib/ExampleS3DataSet-stack';
import { ExamplePgRdsDataSet } from '../lib/ExamplePgRdsDataSet-stack';

const app = new cdk.App();

const coreDataLake = new DataLakeStack(app, 'CoreDataLake', {
    starterLakeFormationAdminPrincipalArn: app.node.tryGetContext("starterLakeFormationAdmin")
});


const exampleS3DataSet = new ExampleS3DataSet(app, 'exampleS3DataSet', {
    sourceBucket: s3.Bucket.fromBucketName(app, 'exampleS3DataSetSourceBucket', '--- YOUR EXISTING BUCKET NAME GOES HERE ---'),
    sourceBucketDataPrefix: '/prefixToParentFolderofTableFolders/',
    DataLake: coreDataLake
});


const examplePgRdsDataSet = new ExamplePgRdsDataSet(app, 'exampleS3DataSet', {
    
    database: rds.DatabaseInstance.fromDatabaseInstanceAttributes(app, 'exampleRdsDataSet', {
        instanceEndpointAddress: '--- RDS INSTANCE ENDPOINT ADDRESS GOES HERE ---',
        instanceIdentifier: '--- RDS INSTANCE IDENTIFIRE GOES HERE ---',
        port: 5432,
        securityGroups: []}) as rds.DatabaseInstance,
    databaseSecret: rds.DatabaseSecret.fromSecretArn(app, 'exampleRdsDataSetSecret', 
        '---SECRET ARN GOES HERE ---') as rds.DatabaseSecret,
    accessSecurityGroup: ec2.SecurityGroup.fromSecurityGroupId(app, 'exampleRdsAccessSecurityGroup',
        '---SECURITY GROUP ID THAT ALLOWS INBOUND ACCESS TO DATABASE GOES HERE ---') as ec2.SecurityGroup,
    DataLake: coreDataLake    
});





// chemblStack.grantIamRead(analyticsStack.NotebookRole);

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