import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { DataSetEnrollmentProps, DataSetEnrollment } from '../constructs/data-set-enrollment';
import { DataLakeEnrollment } from '../constructs/data-lake-enrollment';
import { DataLakeStack } from './datalake-stack';

export interface DataSetStackProps extends cdk.StackProps {
	DataLake: DataLakeStack;
}


export class DataSetStack extends cdk.Stack {

  public Enrollment: DataLakeEnrollment;
  public DataLake: DataLakeStack;

  constructor(scope: cdk.Construct, id: string, props: DataSetStackProps) {
    super(scope, id, props);
    this.DataLake = props.DataLake;
  }

  
  public grantDatabasePermissions( principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.DatabasePermissionGrant){
    this.Enrollment.grantDatabasePermission(principal, permissionGrant);
  }

  public grantTablePermissions(principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.TablePermissionGrant){

    this.DataLake.grantAthenaResultsBucketPermission(principal);
    this.Enrollment.grantTablePermissions(principal, permissionGrant);
  }

  public grantTableWithColumnPermissions(principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.TableWithColumnPermissionGrant){

    this.DataLake.grantAthenaResultsBucketPermission(principal);
    this.Enrollment.grantTableWithColumnPermissions(principal, permissionGrant);
  }


  public grantIamRead(principal: iam.IPrincipal){
    this.DataLake.grantAthenaResultsBucketPermission(principal);
    this.Enrollment.grantCoarseIamRead(principal);
  }
}
