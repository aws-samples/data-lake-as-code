import { Construct,  } from 'constructs';
import { Aws, App, Stack, Resource, StackProps, CustomResource,  Duration } from 'aws-cdk-lib';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import * as lakeformation from 'aws-cdk-lib/aws-lakeformation';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as fs from "fs";


import { URL } from "url";


export interface FederatedCrawlerTemplateProps extends StackProps {
	databaseDescriptionPath: string;
	crawlerDescriptionPath: string;
	dataSetName: string;
}

export class FederatedCrawlerTemplate extends Construct{

	public readonly glueDatabase: glue.CfnDatabase;
	public readonly glueCrawler: glue.CfnCrawler;
	public readonly glueRole: iam.Role;

	constructor(scope: Construct, id: string, props: FederatedCrawlerTemplateProps) {
		super(scope, id);
		
		const databaseObj = require(props.databaseDescriptionPath);
		const crawlerObj = require(props.crawlerDescriptionPath);
		
		// import databaseObj from props.databaseDescriptionPath;
		// import tablesObj from props.tablesDescriptionPath;
		
		
		const databaseName = `${databaseObj['Database']['Name']}`
		
		this.glueDatabase = new glue.CfnDatabase(this, 'GlueDatabase', {
			catalogId: Aws.ACCOUNT_ID,
			databaseInput: {
				locationUri: `${databaseObj['Database']['LocationUri']}`,
				name: databaseName,
			}
		});	 
		
		
		this.glueRole = new iam.Role(this, `GlueCrawlerRole`, {
			assumedBy: new iam.ServicePrincipal('glue.amazonaws.com')
		});
		
		this.glueRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));
		this.glueRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));
		
		var protocolPathTuple = databaseObj['Database']['LocationUri'].split("//");
		var pathArray = protocolPathTuple[1].split("/");
		
		let s3DataLakePaths = new Array<glue.CfnCrawler.S3TargetProperty>();
		
		this.glueRole.addToPolicy(new iam.PolicyStatement({
		  actions: ["s3:*"],
		  resources: [`arn:aws:s3:::${pathArray[0]}`, `arn:aws:s3:::${pathArray[0]}/${pathArray[1]}/*`]
		}));
		
		for (let s3Target of crawlerObj['Crawler']['Targets']['S3Targets']) {
            s3DataLakePaths.push({
                path: s3Target['Path']
                //TODO: add exclusions
            });
		}
		
		this.glueCrawler = new glue.CfnCrawler(this,  `awsroda-crawler`,{
			name: `${props.dataSetName}_awsroda_crawler`, 
			targets: {
				s3Targets: s3DataLakePaths	
			},
			role: this.glueRole.roleName,
			databaseName: databaseName, 
			schemaChangePolicy: {
				deleteBehavior: "DEPRECATE_IN_DATABASE", 
				updateBehavior: "UPDATE_IN_DATABASE",
			}, 
			tablePrefix: "", 
			classifiers: []
		});
	}
}


export interface FederatedDataSetProps extends StackProps {
	databaseDescriptionPath: string
	tablesDescriptionPath: string
}


export class FederatedDataSetTemplate extends Construct{

	public readonly glueDatabase: glue.CfnDatabase;
	
	constructor(scope: Construct, id: string, props: FederatedDataSetProps) {
		super(scope, id);
		
		const databaseObj = require(props.databaseDescriptionPath);
		const tablesObj = require(props.tablesDescriptionPath);
		
		// import databaseObj from props.databaseDescriptionPath;
		// import tablesObj from props.tablesDescriptionPath;
		
		const databaseName = `${databaseObj['Database']['Name']}`
		
		this.glueDatabase = new glue.CfnDatabase(this, databaseObj['Database']['Name'], {
			catalogId: Aws.ACCOUNT_ID,
			databaseInput: {
				locationUri: `${databaseObj['Database']['LocationUri']}`,
				name: databaseName,
			}
		});	 	
		

		for (let table of tablesObj['TableList']) {
			
			var columnList = [];
			
			for(let column of table['StorageDescriptor']['Columns']){
				
				columnList.push({
					name: column['Name'],
					type: column['Type']
				});
			}
			
			new glue.CfnTable(this, table["Name"], {
				catalogId: Aws.ACCOUNT_ID,
				databaseName: databaseName,
				tableInput: {
					name: table["Name"],
					parameters: table['Parameters'],
					storageDescriptor: {
						columns: columnList,
						inputFormat: table['StorageDescriptor']['InputFormat'],
						outputFormat: table['StorageDescriptor']['OutputFormat'],
						location:  table['StorageDescriptor']['Location'],
						parameters: table['StorageDescriptor']['Parameters'],
						serdeInfo: {
							parameters: table['StorageDescriptor']['SerdeInfo']['Parameters'],
							serializationLibrary: table['StorageDescriptor']['SerdeInfo']['SerializationLibrary']
						}
					}
					
				}
			})
			
			
		}
		
	}
}


export interface DataSetEnrollmentProps extends StackProps {
		dataLakeBucket: s3.Bucket;
		dataSetName: string;
		SourceConnectionInput?: glue.CfnConnection.ConnectionInputProperty;
		SourceTargets: glue.CfnCrawler.TargetsProperty;
		DataLakeTargets: glue.CfnCrawler.TargetsProperty;
		GlueScriptPath: string;
		GlueScriptArguments: any;
		SourceAccessPolicy?: iam.Policy;
		MaxDPUs: number;
		WorkflowCronScheduleExpression?: string;
}


export class DataSetEnrollment extends Construct {
		
	public readonly Workflow: DataLakeEnrollmentWorkflow;
    public readonly SrcCrawlerCompleteTrigger: glue.CfnTrigger;
    public readonly ETLCompleteTrigger: glue.CfnTrigger; 
    public readonly SourceConnection?: glue.CfnConnection;
    public readonly DataLakeConnection: glue.CfnConnection;
    public readonly DataSetName: string;
    public readonly DataSetGlueRole: iam.Role;
    public readonly Dataset_Source: glue.CfnDatabase;
    public readonly Dataset_Datalake: glue.CfnDatabase;
    
    public readonly DataLakeBucketName: string;
    public readonly DataLakePrefix: string;
	public readonly DataLakeTargets: glue.CfnCrawler.TargetsProperty;


	private setupCrawler(targetGlueDatabase: glue.CfnDatabase, targets: glue.CfnCrawler.TargetsProperty, isSourceCrawler: boolean){
		
		var sourceCrawler = isSourceCrawler ? "src" : "dl";
		
		return new glue.CfnCrawler(this,  `${this.DataSetName}-${sourceCrawler}-crawler`,{
			name: `${this.DataSetName}_${sourceCrawler}_crawler`, 
			targets: targets, 
			role: this.DataSetGlueRole.roleName,
			databaseName: targetGlueDatabase.getAtt('DatabaseInput.Name').toString(), 
			schemaChangePolicy: {
				deleteBehavior: "DEPRECATE_IN_DATABASE", 
				updateBehavior: "UPDATE_IN_DATABASE",
			}, 
			tablePrefix: "", 
			classifiers: []
		});
		
	}

	constructor(scope: Construct, id: string, props: DataSetEnrollmentProps) {
		super(scope, id);	
		
		this.DataLakeTargets = props.DataLakeTargets;
		this.DataLakeBucketName	= props.GlueScriptArguments['--DL_BUCKET'];
		this.DataLakePrefix = props.GlueScriptArguments['--DL_PREFIX'];
		
		this.DataSetName = props.dataSetName;
		
		this.Dataset_Source = new glue.CfnDatabase(this, `${props.dataSetName}_src`, {
			catalogId: Aws.ACCOUNT_ID,
			databaseInput: {
				name: `${props.dataSetName}_src`,
				locationUri: `s3://${props.dataLakeBucket.bucketName}/${props.dataSetName}/`
			}
		});
		this.Dataset_Datalake = new glue.CfnDatabase(this, `${props.dataSetName}_dl`, {
			catalogId: Aws.ACCOUNT_ID,
			databaseInput: {
				name:  `${props.dataSetName}_dl`,
				locationUri: `s3://${props.dataLakeBucket.bucketName}/${props.dataSetName}/`
			}
		});
		

		let connectionArray = [];
		
		
		if(props.SourceConnectionInput){
			this.SourceConnection = new glue.CfnConnection(this, `${props.dataSetName}-src-connection`, {
				catalogId: this.Dataset_Source.catalogId, 
				connectionInput: props.SourceConnectionInput
			});
			if(props.SourceConnectionInput.name){
				connectionArray.push(props.SourceConnectionInput.name);	
			}
		}

		
		this.DataSetGlueRole = new iam.Role(this, `${props.dataSetName}-GlueRole`, {
			assumedBy: new iam.ServicePrincipal('glue.amazonaws.com')
		});
		
		this.DataSetGlueRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));
		this.DataSetGlueRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));
		props.dataLakeBucket.grantReadWrite(this.DataSetGlueRole);
		
		
		if(typeof props.SourceAccessPolicy !== 'undefined'){
			props.SourceAccessPolicy.attachToRole(this.DataSetGlueRole);	
		}
		 
		 
		const sourceCrawler = this.setupCrawler(this.Dataset_Source, props.SourceTargets, true);
		
		
		
		const glueScript = new s3assets.Asset(this, `${props.dataSetName}-GlueScript`, {
			path: props.GlueScriptPath
		});
		glueScript.grantRead(this.DataSetGlueRole);
		
		
		
		/// The spread operator below (...) makes the connections property conditional. Its only used for JDBC sources at the moment.
		const jobParams = {
			executionProperty: {
				maxConcurrentRuns: 1
			}, 
			name: `${props.dataSetName}_src_to_dl_etl`, 
			timeout: 2880, 
			glueVersion: "2.0", 
			maxCapacity: props.MaxDPUs,
			command: {
				scriptLocation: `s3://${glueScript.s3BucketName}/${glueScript.s3ObjectKey}`, 
				name: "glueetl", 
				pythonVersion: "3"
			}, 
			role: this.DataSetGlueRole.roleArn,
			maxRetries: 0, 
			defaultArguments: props.GlueScriptArguments,
			...(typeof props.SourceConnectionInput !== "undefined" && {
					connections: {
						connections: connectionArray
					}
			})
		}
		const etl_job = new glue.CfnJob(this, `${props.dataSetName}-EtlJob`, jobParams );
		
		
		const datalake_crawler = this.setupCrawler(this.Dataset_Datalake, this.DataLakeTargets, false);
		
		// const datalake_crawler = this.setupCrawler(this.Dataset_Datalake, {
		// 		s3Targets: [
		// 			{
		// 				path: `s3://${props.dataLakeBucket.bucketName}/${props.dataSetName}/`
		// 			}
		// 		]
		// }, false);

		
		const datalakeEnrollmentWorkflow = new DataLakeEnrollmentWorkflow(this,`${props.dataSetName}DataLakeWorkflow`,{
			workfowName: `${props.dataSetName}_DataLakeEnrollmentWorkflow`,
			srcCrawler: sourceCrawler,
			etlJob: etl_job,
			datalakeCrawler: datalake_crawler,
			WorkflowCronScheduleExpression: props.WorkflowCronScheduleExpression
		});
		
	} 
	

	
}


export interface DataLakeEnrollmentWorkflowProps {
	workfowName: string;
	srcCrawler: glue.CfnCrawler,
	etlJob: glue.CfnJob,
	datalakeCrawler: glue.CfnCrawler
	WorkflowCronScheduleExpression?: string;
}

export class DataLakeEnrollmentWorkflow extends Construct {

	public StartTrigger: glue.CfnTrigger;
    public readonly SrcCrawlerCompleteTrigger: glue.CfnTrigger;
    public readonly ETLCompleteTrigger: glue.CfnTrigger; 
    public readonly Workflow: glue.CfnWorkflow; 
    private readonly sourceCrawler: glue.CfnCrawler;

	constructor(scope: Construct, id: string, props: DataLakeEnrollmentWorkflowProps) {
		super(scope, id);
		
		this.Workflow = new glue.CfnWorkflow(this, "etlWorkflow", {
			name: props.workfowName
		});

		this.sourceCrawler = props.srcCrawler;
		
		if(props.WorkflowCronScheduleExpression == null){
			this.StartTrigger = new glue.CfnTrigger(this,"startTrigger",{
	            actions: [
	                {
	                    crawlerName: props.srcCrawler.name
	                }
	            ], 
	            type: "ON_DEMAND", 
	            name: `startWorkflow-${this.Workflow.name}`, 
	            workflowName: this.Workflow.name
	        });
			
		}else{
			
			this.StartTrigger = new glue.CfnTrigger(this,"startTrigger",{
	            actions: [
	                {
	                    crawlerName: this.sourceCrawler.name
	                }
	            ], 
	            type: "SCHEDULED", 
	            schedule: props.WorkflowCronScheduleExpression,
	            name: `startWorkflow-${this.Workflow.name}`, 
	            workflowName: this.Workflow.name
	        });
		}
		
		

        
		this.SrcCrawlerCompleteTrigger = new glue.CfnTrigger(this,"srcCrawlerCompleteTrigger",{
	        predicate: {
	            conditions: [
	                {
	                    crawlerName: props.srcCrawler.name, 
	                    crawlState: "SUCCEEDED", 
	                    logicalOperator: "EQUALS"
	                }
	            ], 
	            logical: "ANY"
	        }, 
	        name: `sourceDataCrawled-${this.Workflow.name}`, 
	        actions: [
	            {
	                jobName: props.etlJob.name
	            }
	        ], 
	        workflowName: this.Workflow.name, 
	        type: "CONDITIONAL",
	        startOnCreation: true
	        
	    });
	    
	    this.ETLCompleteTrigger = new glue.CfnTrigger(this,"etlCompleteTrigger",{
            predicate: {
                conditions: [
                    {
                        state: "SUCCEEDED", 
                        logicalOperator: "EQUALS", 
                        jobName: props.etlJob.name
                    }
                ], 
                logical: "ANY"
            }, 
            name: `EtlComplete-${this.Workflow.name}`, 
            actions: [
                {
                    crawlerName: props.datalakeCrawler.name
                }
            ], 
            workflowName: this.Workflow.name, 
            type: "CONDITIONAL"
        });
		
		this.StartTrigger.node.addDependency(this.Workflow);
		this.SrcCrawlerCompleteTrigger.node.addDependency(this.Workflow);
		this.ETLCompleteTrigger.node.addDependency(this.Workflow);

	
	    const activateTriggerRole = new iam.Role(this, 'activateTriggerRole', {
        	assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    	});
    	
    	activateTriggerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    	
    	activateTriggerRole.addToPolicy(new iam.PolicyStatement({
			effect: iam.Effect.ALLOW,
			resources: ['*'],
			actions: ['glue:StartTrigger']
		}));
    	

		const activateTriggerFunction = new lambda.SingletonFunction(this, 'activateTriggerSingleton', {
	            role: activateTriggerRole, 
	            uuid: "ActivateGlueTriggerFunction",
	            code: new lambda.InlineCode(fs.readFileSync('./scripts/lambda.activategluetigger.py', { encoding: 'utf-8' })),
	            handler: 'index.main',
	            timeout: Duration.seconds(300),
	            runtime: lambda.Runtime.PYTHON_3_7,
	            memorySize: 1024
        });
        
        
	        
		 
		if(props.WorkflowCronScheduleExpression != null){		 
			
			const CronTrigger_triggerActivationProvider = new cr.Provider(this, 'CronTrigger_triggerActivationProvider', {
				onEventHandler: activateTriggerFunction,
		    });
			
		    const CronTrigger_triggerActivation = new CustomResource(this, 'CronTrigger-triggerActivation',  {
				serviceToken: CronTrigger_triggerActivationProvider.serviceToken,
	        	properties: {
	        		triggerId: this.StartTrigger.name
	        	}
		    });			
		}
		
		const srcCrawlerCompleteTrigger_triggerActivationProvider = new cr.Provider(this, 'srcCrawlerCompleteTrigger_triggerActivationProvider', {
			onEventHandler: activateTriggerFunction,
	    });
		
		
	    const srcCrawlerCompleteTrigger_triggerActivation = new CustomResource(this, 'srcCrawlerCompleteTrigger_triggerActivation',  {
        	serviceToken: srcCrawlerCompleteTrigger_triggerActivationProvider.serviceToken,
        	properties: {
        		triggerId: this.SrcCrawlerCompleteTrigger.name
        	}
	    });
	    
	    
		const etlTrigger_triggerActivationProvider = new cr.Provider(this, 'etlTrigger_triggerActivationProvider', {
			onEventHandler: activateTriggerFunction,
	    });
	    
	    const etlTrigger_triggerActivation = new CustomResource(this, 'etlTrigger-triggerActivation',  {
        	serviceToken: etlTrigger_triggerActivationProvider.serviceToken,
        	properties: {
        		triggerId: this.ETLCompleteTrigger.name
        	}
	    });
	    
	}
}
