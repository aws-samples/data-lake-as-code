#!/usr/bin/env node
import 'source-map-support/register';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { App, Stack } from 'aws-cdk-lib';
import { DataLakeStack } from '../lib/stacks/datalake-stack';
import { DataLakeEnrollment } from '../lib/constructs/data-lake-enrollment';
import { DataSetTemplateStack, CrawlerTemplateStack } from '../lib/stacks/dataset-stack';
import { ExamplePgRdsDataSet } from '../lib/ExamplePgRdsDataSet-stack';
import { BaselineStack } from '../lib/Baseline-stack';
import { SECfinancialStatmentDataSet } from '../lib/SEC-financialstatments-DataSet-stack';
    

const app = new App();

const coreDataLake = new DataLakeStack(app, 'CoreDataLake', {
    description: "AWS Data Lake as Code core data lake template. (ib-87ce095eDf)"
});


const exisitingResourceImportStack = new Stack(app, 'resourceImportStack', {
    description: "Used to import existing resources created outside of this CDK application",
});



const baseline = new BaselineStack(app, "BaselineStack", {
  coreDataLakeProps: coreDataLake,
});


const SECfinancialStatementAndNotes = new SECfinancialStatmentDataSet(app, 'SECfinancialStatementAndNotes', {
    sourceBucket: baseline.SecFinancialStatementBucket,
    sourceBucketDataPrefix: '/',
    DataLake: coreDataLake
});


SECfinancialStatementAndNotes.grantIamRead(new iam.ArnPrincipal('arn:aws:iam::XXXXXXXXXX:role/service-role/AmazonSageMakerServiceCatalogProductsUseRole'));

const secFinancialStatement = new DataSetTemplateStack( app, "SECFinancialStatementsAndNotesTemplate",
  {
    description: "AWS Data Lake as Code Registry of Open Data Federated SEC Financial Statments and notes template. (ib-5d84vk7d1d)",
    DatabaseDescriptionPath:"../../RODA_templates/sec_financial_statements_get_database.json",
    DescribeTablesPath: "../../RODA_templates/sec_financial_statements_get_tables.json",
    DataSetName: SECfinancialStatementAndNotes.Enrollments[0].DataSetName,
  }
);
