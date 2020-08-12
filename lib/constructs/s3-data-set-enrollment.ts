import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { DataSetEnrollmentProps, DataSetEnrollment } from './data-set-enrollment';
import { DataLakeEnrollment } from './data-lake-enrollment';


export interface S3dataSetEnrollmentProps extends DataLakeEnrollment.DataLakeEnrollmentProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefixes: string[];
    MaxDPUs: number;
}



export class S3dataSetEnrollment extends DataLakeEnrollment{



    grantGlueRoleLakeFormationPermissions(DataSetGlueRole: iam.Role, DataSetName: string) {

        this.grantDataLocationPermissions(this.DataEnrollment.DataSetGlueRole, {
            Grantable: true,
            GrantResourcePrefix: `${DataSetName}locationGrant`
        });
        this.grantDatabasePermission(this.DataEnrollment.DataSetGlueRole,  {		     
		     DatabasePermissions: [DataLakeEnrollment.DatabasePermission.All],
             GrantableDatabasePermissions: [DataLakeEnrollment.DatabasePermission.All],
             GrantResourcePrefix: `${DataSetName}RoleGrant`
		}, true);
    }

	constructor(scope: cdk.Construct, id: string, props: S3dataSetEnrollmentProps) {
		super(scope, id, props);
	
		const dataSetName = props.DataSetName;
		
		const s3AccessPolicy = new iam.Policy(this, 'dataSourceAccessPolicy');
		
		let s3TargetPaths = new Array<glue.CfnCrawler.S3TargetProperty>();
		let s3DataLakePaths = new Array<glue.CfnCrawler.S3TargetProperty>();
		
		
        const bucketListPolicy = new iam.PolicyStatement({
            actions: ["s3:ListBucket"],
            effect: iam.Effect.ALLOW,
            resources: [`arn:aws:s3:::${props.sourceBucket.bucketName}`]
        });   
		s3AccessPolicy.addStatements(bucketListPolicy);
		
		
        const prefixAccessPolicy = new iam.PolicyStatement({
            actions: ["s3:GetObject"],
            effect: iam.Effect.ALLOW,
            resources: [`arn:aws:s3:::${props.sourceBucket.bucketName}/*`]
        });    
        
        s3AccessPolicy.addStatements(prefixAccessPolicy);
		
        for(let bucketPrefix of props.sourceBucketDataPrefixes){
            s3TargetPaths.push({
                path: `s3://${props.sourceBucket.bucketName}${bucketPrefix}`
            });
            
            
            var prefixFolders = bucketPrefix.split('/')
            var tableFolderName = prefixFolders[prefixFolders.length-2]
            var tableFolderName = tableFolderName.toLowerCase().replace(/\./g,"_").replace(/-/g,"_");
            
            s3DataLakePaths.push({
                path: `s3://${props.dataLakeBucket.bucketName}/${dataSetName}/${tableFolderName}/`
            });
        }
        
        
		
		this.DataEnrollment = new DataSetEnrollment(this, `${props.DataSetName}-s3Enrollment`, {
		    dataLakeBucket: props.dataLakeBucket,
			dataSetName: dataSetName,
			SourceAccessPolicy: s3AccessPolicy,
			SourceTargets: {
                s3Targets: s3TargetPaths, 
            },
            MaxDPUs: props.MaxDPUs,
			GlueScriptPath: props.GlueScriptPath,
			DataLakeTargets: {
			    s3Targets: s3DataLakePaths
			},
			GlueScriptArguments: props.GlueScriptArguments
		});
	
       
        this.createCoarseIamPolicy();
        this.grantGlueRoleLakeFormationPermissions(this.DataEnrollment.DataSetGlueRole, props.DataSetName); 
        
        


	}
}