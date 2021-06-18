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
    

const app = new App();

const coreDataLake = new DataLakeStack(app, 'CoreDataLake', {
    description: "AWS Data Lake as Code core data lake template. (ib-87ce095eDf)"
});


const exisitingResourceImportStack = new Stack(app, 'resourceImportStack', {
    description: "Used to import existing resources created outside of this CDK application",
});


// const exampleS3DataSet = new ExampleS3DataSet(app, 'ExampleS3DataSet', {
//     sourceBucket: s3.Bucket.fromBucketName(exisitingResourceImportStack, 'exampleS3DataSetSourceBucket', 'dlacregressiontest0'),
//     sourceBucketDataPrefix: '/',
//     DataLake: coreDataLake
// });

// console.log("Setting up ChEMBL enrollment stack.");

// const chemblStack = new ChemblStack(app, "ChemblStack", {
//   ChemblDb25: baseline.ChemblDb25,
//   ChemblDb27: baseline.ChemblDb27,
//   accessSecurityGroup: baseline.ChemblDBChemblDbAccessSg,
//   databaseSecret: baseline.ChemblDBSecret,
//   DataLake: coreDataLake,
// });


// const examplePgRdsDataSet = new ExamplePgRdsDataSet(app, 'ExamplePgRdsDataSet', {
    
//     database: rds.DatabaseInstance.fromDatabaseInstanceAttributes(exisitingResourceImportStack, 'sourceDatabase', {
//         instanceEndpointAddress: '--- RDS INSTANCE ENDPOINT ADDRESS GOES HERE ---',
//         instanceIdentifier: '--- RDS INSTANCE IDENTIFIRE GOES HERE ---',
//         port: 5432,
//         securityGroups: []}) as rds.DatabaseInstance,
//     databaseSecret: rds.DatabaseSecret.fromSecretArn(exisitingResourceImportStack, 'databaseSecret', 
//         '---SECRET ARN GOES HERE ---') as rds.DatabaseSecret,
//     accessSubnet: ec2.Subnet.fromSubnetAttributes(exisitingResourceImportStack, 'accessSubnet', {
//         subnetId: '--- PRIVATE SUBNET ID THAT CAN ROUTE TO SOURCE DATABASE - SUBNET MUST HAVE ROUTE TO NAT GATEWAY S3 ENDPOINT  ---',
//         availabilityZone: '--- AVAILABILITY ZONE ASSOCIATED WITH THIS SUBNET ---'}) as ec2.Subnet,
//     accessSecurityGroup: ec2.SecurityGroup.fromSecurityGroupId(exisitingResourceImportStack, 'accessSecurityGroup',
//         '---SECURITY GROUP ID THAT ALLOWS INBOUND ACCESS TO DATABASE GOES HERE ---') as ec2.SecurityGroup,
//     DataLake: coreDataLake    
// });




// Grant permissions:

// const exampleExistingIamUser = new iam.ArnPrincipal('arn:aws:iam::XXXXXXXXXX:user/XXXXXX')
// const exampleExistingIamRole = new iam.ArnPrincipal('arn:aws:iam::XXXXXXXXXX:role/XXXXXXX')

// exampleS3DataSet.grantIamRead(exampleExistingIamUser);
// exampleS3DataSet.grantIamRead(exampleExistingIamRole);


// chemblStack.grantIamRead(analyticsStack.NotebookRole);
// openTargetsStack.grantIamRead(analyticsStack.NotebookRole);
// bindingDBStack.grantIamRead(analyticsStack.NotebookRole);


// const exampleUser = iam.User.fromUserName(coreDataLake, 'exampleGrantee', 'paul1' );


// var exampleGrant: DataLakeEnrollment.TablePermissionGrant = {
//     tables: ["association_data", "evidence_data","target_list","disease_list"],
//     DatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
//     GrantableDatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
//     TablePermissions: [DataLakeEnrollment.TablePermission.Select, DataLakeEnrollment.TablePermission.Insert, DataLakeEnrollment.TablePermission.Delete],
//     GrantableTablePermissions: [DataLakeEnrollment.TablePermission.Select]
// };

// examplePgRdsDataSet.grantTablePermissions(exampleExistingIamUser, exampleGrant);
// examplePgRdsDataSet.grantTablePermissions(exampleExistingIamRole, exampleGrant);
