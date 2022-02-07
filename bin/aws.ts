#!/usr/bin/env node
import 'source-map-support/register';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { App, Stack } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { DataLakeStack } from '../lib/stacks/datalake-stack';
import { DataLakeEnrollment } from '../lib/constructs/data-lake-enrollment';
import { DataSetTemplateStack, CrawlerTemplateStack } from '../lib/stacks/dataset-stack';
import { YT8MDataSetStack } from '../lib/YT8M-ODS';


const app = new App();

const coreDataLake = new DataLakeStack(app, 'CoreDataLake', {
    description: "AWS Data Lake as Code core data lake template. (ib-87ce095eDf)"
});


const exisitingResourceImportStack = new Stack(app, 'resourceImportStack', {
    description: "Used to import existing resources created outside of this CDK application",
});


const yt8m = new YT8MDataSetStack(app, 'yt8mDataSet', {
    sourceBucket: s3.Bucket.fromBucketName(exisitingResourceImportStack, 'aws-roda-ml-datalake', 'aws-roda-ml-datalake'),
    sourceBucketDataPrefix: 'yt8m/',
    DataLake: coreDataLake
});

const YT8MRodaTemplate = new DataSetTemplateStack(
  app,
  "YT8MRodaTemplate",
  {
    description:
      "Lake House Ready YouTube 8 Million Dataset in the AWS Registry of Open Data. (ib-mv94mx8812e)",
    DatabaseDescriptionPath:
      "../../RODA_templates/yt8m_ods_get_database.json",
    DescribeTablesPath:
      "../../RODA_templates/yt8m_ods_get_tables.json",
    DataSetName: yt8m.Enrollments[0].DataSetName,
  }
);



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
