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



const exampleUser = iam.User.fromUserName(coreDataLake, 'exampleGrantee', 'paul0' );
var exampleGrant: DataLakeEnrollment.LakeFormationPermissionGrant = {
    tables: ["association_data", "evidence_data","target_list","disease_list"],
    DatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
    GrantableDatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
    TablePermissions: [DataLakeEnrollment.TablePermission.Select, DataLakeEnrollment.TablePermission.Insert, DataLakeEnrollment.TablePermission.Delete],
    GrantableTablePermissions: [DataLakeEnrollment.TablePermission.Select]
};

openTargetsStack.grantLakeFormationPermissions(exampleUser, exampleGrant);