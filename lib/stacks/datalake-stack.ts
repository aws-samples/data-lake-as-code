import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { DataSetEnrollmentProps, DataSetEnrollment } from '../constructs/data-set-enrollment';

export interface DatalakeStackProps extends cdk.StackProps {

}

export class DatalakeStack extends cdk.Stack {
  
  public readonly DataLakeBucket: s3.Bucket; 
  
  constructor(scope: cdk.Construct, id: string, props: DatalakeStackProps) {
    super(scope, id, props);

    const dataLakeBucket = new s3.Bucket(this, 'dataLakeBucket');

    this.DataLakeBucket = dataLakeBucket;
  }
}



