import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { DataSetEnrollmentProps, DataSetEnrollment } from './data-set-enrollment';
import { DataLakeEnrollmentProps, DataLakeEnrollment} from './datalake-stack';

	
export interface DataSetStackProps extends cdk.StackProps {
	dataLakeBucket: s3.Bucket;	
}	
	

export class DataSetStack extends cdk.Stack {
  
  public Enrollment: DataLakeEnrollment;
  
  constructor(scope: cdk.Construct, id: string, props: DataSetStackProps) {
    super(scope, id, props);
  }
  
  public grantRead(role: iam.Role){
      this.Enrollment.grantRead(role);
  }
}
