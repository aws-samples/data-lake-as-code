import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import glue = require('@aws-cdk/aws-glue');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');
import cfn = require("@aws-cdk/aws-cloudformation");
import fs = require('fs');

export interface DataSetEnrollmentProps extends cdk.StackProps {
		dataLakeBucket: s3.Bucket;
}

export interface DataLakeEnrollmentWorkflowProps {
	workfowName: string;
	srcCrawler: glue.CfnCrawler,
	etlJob: glue.CfnJob,
	datalakeCrawler: glue.CfnCrawler
}


export class DataLakeEnrollmentWorkflow extends cdk.Construct {

	public readonly StartTrigger: glue.CfnTrigger;
    public readonly SrcCrawlerCompleteTrigger: glue.CfnTrigger;
    public readonly ETLCompleteTrigger: glue.CfnTrigger; 
    public readonly Workflow: glue.CfnWorkflow; 

	constructor(scope: cdk.Construct, id: string, props: DataLakeEnrollmentWorkflowProps) {
		super(scope, id);
		
		this.Workflow = new glue.CfnWorkflow(this, "etlWorkflow", {
			name: props.workfowName
		});
		
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
	            timeout: cdk.Duration.seconds(300),
	            runtime: lambda.Runtime.PYTHON_3_7,
	            memorySize: 1024
        });
		 
		
	    const srcCrawlerCompleteTrigger_triggerActivation = new cfn.CustomResource(this, 'srcCrawlerCompleteTrigger-triggerActivation',  {
        	provider: cfn.CustomResourceProvider.lambda(activateTriggerFunction),
        	properties: {
        		triggerId: this.SrcCrawlerCompleteTrigger.name
        	}
	    });
	    
	    const etlTrigger_triggerActivation = new cfn.CustomResource(this, 'etlTrigger-triggerActivation',  {
        	provider: cfn.CustomResourceProvider.lambda(activateTriggerFunction),
        	properties: {
        		triggerId: this.ETLCompleteTrigger.name
        	}
	    });
	    
	}
}
