#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BaselineStack } from '../lib/baseline-stack';
import { DatalakeStack } from '../lib/datalake-stack';
import { OpenTargetsStack } from '../lib/opentargets-stack';
import { ChemblStack } from '../lib/chembl-25-stack';
import { AnalyticsStack } from '../lib/analytics-stack.js';
import s3 = require('@aws-cdk/aws-s3');


const app = new cdk.App();
const baseline = new BaselineStack(app, 'BaselineStack');


const coreDataLake = new DatalakeStack(app, 'CoreDataLake', {

});



const chemblStack = new ChemblStack(app, 'ChemblStack', {
    database: baseline.ChemblDb,
    accessSecurityGroup: baseline.chemblDBChemblDbAccessSg,
    databaseSecret: baseline.chemblDBSecret,
    dataLakeBucket: coreDataLake.DataLakeBucket
});

const openTargetsStack = new OpenTargetsStack(app, 'OpenTargetsStack', {
    sourceBucket: baseline.OpenTargetsSourceBucket,
    sourceBucketDataPrefix: '/opentargets/sourceExports/19.11/output/',
    dataLakeBucket: coreDataLake.DataLakeBucket
});

const analyticsStack = new AnalyticsStack(app, 'AnalyticsStack', {
    targetVpc: baseline.Vpc,
});


chemblStack.grantRead(analyticsStack.NotebookRole);
openTargetsStack.grantRead(analyticsStack.NotebookRole);
