
import { Construct } from 'constructs';
import { App, Stack} from 'aws-cdk-lib';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lakeformation from 'aws-cdk-lib/aws-lakeformation';
import { DataSetEnrollmentProps, DataSetEnrollment } from './data-set-enrollment';
import { DataLakeEnrollment } from './data-lake-enrollment';


export interface S3dataSetEnrollmentProps extends DataLakeEnrollment.DataLakeEnrollmentProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefixes: string[];
    MaxDPUs: number;
    ExistingLakeFormationResource?: lakeformation.CfnResource;
    LocalJarsForGlueJob?: string[];
}



export class S3dataSetEnrollment extends DataLakeEnrollment{
    
    private readonly sourceBucket: s3.IBucket;
    public LakeFormationResource: lakeformation.CfnResource;
    
    setupGlueRoleLakeFormationPermissions(DataSetGlueRole: iam.Role, DataSetName: string, sourceDataBucket: s3.IBucket, locationDescription: string, ExistingLakeFormationResource?: lakeformation.CfnResource) {

        if(ExistingLakeFormationResource == null) {
            this.LakeFormationResource = new lakeformation.CfnResource(
              this,
              "sourceLakeFormationLocation",
              {
                resourceArn: sourceDataBucket.bucketArn,
                roleArn: this.DataEnrollment.DataSetGlueRole.roleArn,
                useServiceLinkedRole: true,
              }
            );
            
        } else {
            this.LakeFormationResource = ExistingLakeFormationResource;
        }
        

        super.grantGlueRoleLakeFormationPermissions(DataSetGlueRole, DataSetName, `${DataSetName}glueRolePermissions`, this.LakeFormationResource );

        this.grantDataLocationPermissions(this.DataEnrollment.DataSetGlueRole, {
            Grantable: true,
            GrantResourcePrefix: `${DataSetName}SourcelocationGrant`,
            Location: sourceDataBucket.bucketName,
            LocationPrefix: "/"
        }, this.LakeFormationResource);

    }

	constructor(scope: Construct, id: string, props: S3dataSetEnrollmentProps) {
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
            
            if(props.sourceBucketDataPrefixes.length > 1){
                s3DataLakePaths.push({
                    path: `s3://${props.dataLakeBucket.bucketName}/${dataSetName}/${tableFolderName}/`
                });                
            }else{
                s3DataLakePaths.push({
                    path: `s3://${props.dataLakeBucket.bucketName}/${dataSetName}/`
                });
            }
            

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
			GlueScriptArguments: props.GlueScriptArguments,
			WorkflowCronScheduleExpression: props.WorkflowCronScheduleExpression,
			LocalJarsForGlueJob: props.LocalJarsForGlueJob
		});
	
       
        this.createCoarseIamPolicy();
        
        this.setupGlueRoleLakeFormationPermissions(this.DataEnrollment.DataSetGlueRole, props.DataSetName, props.sourceBucket, "src", props.ExistingLakeFormationResource ); 
        
        super.grantGlueRoleLakeFormationPermissions(this.DataEnrollment.DataSetGlueRole, props.DataSetName, 'src', this.SourceCfnResource);
        super.grantGlueRoleLakeFormationPermissions(this.DataEnrollment.DataSetGlueRole, props.DataSetName, 'dl', this.DatalakeCfnResource);
        
        this.grantCoarseIamRead(this.DataEnrollment.DataSetGlueRole);
        
        
	}
}
