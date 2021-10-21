import { Construct } from 'constructs';
import { App, Stack, StackProps, CustomResource } from 'aws-cdk-lib';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';


import { DataSetEnrollmentProps, DataSetEnrollment, FederatedDataSetTemplate, FederatedCrawlerTemplate, FederatedCrawlerTemplateProps } from '../constructs/data-set-enrollment';
import { DataLakeEnrollment } from '../constructs/data-lake-enrollment';
import { DataLakeStack } from './datalake-stack';




export interface DataSetTemplateStackProps extends StackProps {
	DatabaseDescriptionPath: string;
	DescribeTablesPath: string;
	DataSetName: string;
}

export class DataSetTemplateStack extends Stack {

  constructor(scope: Construct, id: string, props: DataSetTemplateStackProps) {
    super(scope, id, props);
    
    new FederatedDataSetTemplate(this, props.DataSetName, {
      databaseDescriptionPath: props.DatabaseDescriptionPath,
      tablesDescriptionPath: props.DescribeTablesPath
    });
  }
  
}

export interface CrawlerTemplateStackProps extends StackProps {
	databaseDescriptionPath: string;
	crawlerDescriptionPath: string
	DataSetName: string;
}

export class CrawlerTemplateStack extends Stack {

  constructor(scope: Construct, id: string, props: CrawlerTemplateStackProps) {
    super(scope, id, props);
    
    new FederatedCrawlerTemplate(this, props.DataSetName, {
      databaseDescriptionPath: props.databaseDescriptionPath,
      crawlerDescriptionPath: props.crawlerDescriptionPath,
      dataSetName: props.DataSetName
    });
  }
}






export interface DataSetStackProps extends StackProps {
	DataLake: DataLakeStack;
}

export class DataSetStack extends Stack {

  public Enrollments: Array<DataLakeEnrollment> = [];
  public DataLake: DataLakeStack;

  constructor(scope: Construct, id: string, props: DataSetStackProps) {
    super(scope, id, props);
    this.DataLake = props.DataLake;
  }

  
  public grantDatabasePermissions( principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.DatabasePermissionGrant){
    
    for(let enrollment of this.Enrollments){
      enrollment.grantDatabasePermission(principal, permissionGrant);
    }
  }

  public grantTablePermissions(principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.TablePermissionGrant){

    this.DataLake.grantAthenaResultsBucketPermission(principal);

    for(let enrollment of this.Enrollments){
      enrollment.grantTablePermissions(principal, permissionGrant);
    }
  }

  public grantTableWithColumnPermissions(principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.TableWithColumnPermissionGrant){

    this.DataLake.grantAthenaResultsBucketPermission(principal);
    
    for(let enrollment of this.Enrollments){
      enrollment.grantTableWithColumnPermissions(principal, permissionGrant);
    }
    
  }

  public grantIamRead(principal: iam.IPrincipal){
    this.DataLake.grantAthenaResultsBucketPermission(principal);
    for(let enrollment of this.Enrollments){
      enrollment.grantCoarseIamRead(principal);
    }
  }
}
