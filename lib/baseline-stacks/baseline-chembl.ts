import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import ssm = require('@aws-cdk/aws-ssm');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import fs = require('fs');




export interface ChemblBaselineProps extends cdk.StackProps {
  TargetVPC: ec2.Vpc;
  ImportInstance: ec2.Instance;
}


export class ChemblBaseline extends cdk.Construct {

    public readonly DbAccessSg: ec2.SecurityGroup; 
    public readonly DbSecret: rds.DatabaseSecret;
    public readonly Chembl25DatabaseInstance: rds.DatabaseInstance;
    public readonly Chembl27DatabaseInstance: rds.DatabaseInstance;
    	
	constructor(scope: cdk.Construct, id: string, props: ChemblBaselineProps) {
		super(scope, id);
    
        
        this.DbAccessSg = new ec2.SecurityGroup(this, 'SecGroupChemblAccess', {
            vpc: props.TargetVPC,
            allowAllOutbound: true,
            description: "Grants access to the chembl rds instances",
            securityGroupName: "ChemblAccessSG"
        });
        
        
        const chemblDbSG = new ec2.SecurityGroup(this, 'SecGroupChemblDbSecGroup', {
            vpc: props.TargetVPC,
            allowAllOutbound: true,
            description: "Security group for chembl dbs",
            securityGroupName: "ChemblDbSG"
        });
        
        const dmzSubnetSelection = { subnetType: ec2.SubnetType.PUBLIC };
        const appSubnetSelection = { subnetType: ec2.SubnetType.PRIVATE };
        const dbSubnetSelection = { subnetType: ec2.SubnetType.ISOLATED };
        
        this.DbAccessSg.addIngressRule( this.DbAccessSg , ec2.Port.allTraffic(),  "Recursive SG rule for Glue" );
        chemblDbSG.addIngressRule( this.DbAccessSg , ec2.Port.tcp(5432),  "Gives chembl access security group access to postgres port" );
        
        props.ImportInstance.addSecurityGroup(this.DbAccessSg);
        
        
        const appSubnets = props.TargetVPC.selectSubnets(appSubnetSelection);
        
        const chemblDBSecret = new rds.DatabaseSecret(this, 'chembldbSecret', {
            username: 'master',
        });
        this.DbSecret = chemblDBSecret;
        
        this.DbSecret.grantRead(props.ImportInstance.role);
        
        
        this.Chembl25DatabaseInstance = new rds.DatabaseInstance(this, 'chembl25', {
            engine: rds.DatabaseInstanceEngine.POSTGRES,
            masterUsername: 'master',
            vpc: props.TargetVPC,
            vpcPlacement: appSubnetSelection, 
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
            instanceIdentifier: 'chembl-25',
            masterUserPassword: chemblDBSecret.secretValueFromJson('password'),
            securityGroups: [chemblDbSG],
            deletionProtection: false
        });
        
        
        this.Chembl27DatabaseInstance = new rds.DatabaseInstance(this, 'chembl27', {
            engine: rds.DatabaseInstanceEngine.POSTGRES,
            masterUsername: 'master',
            vpc: props.TargetVPC,
            vpcPlacement: appSubnetSelection, 
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
            instanceIdentifier: 'chembl-27',
            masterUserPassword: chemblDBSecret.secretValueFromJson('password'),
            securityGroups: [chemblDbSG],
            deletionProtection: false
        });
        
        
        this.createAndApplyImportCommand("scripts/ssmdoc.importchembl25.json",props.ImportInstance, this.Chembl25DatabaseInstance, this.DbSecret, "25");
        this.createAndApplyImportCommand("scripts/ssmdoc.importchembl27.json",props.ImportInstance, this.Chembl27DatabaseInstance, this.DbSecret, "27");
        
        
    }
    
    createAndApplyImportCommand(commandDoc: string, instance: ec2.Instance, database: rds.DatabaseInstance, secret: rds.DatabaseSecret, resourceSuffix: string) {
        
        const loadChemblDoc = new ssm.CfnDocument(this, 'loadChemblDoc'+ resourceSuffix, {
            content: JSON.parse(fs.readFileSync(commandDoc, { encoding: 'utf-8' })),
            documentType: "Command"
        });
        
        const loadChemblAssociation = new ssm.CfnAssociation(this, 'loadChemblAssociation' + resourceSuffix,{
            name: loadChemblDoc.ref,
            targets: [
                { key: "InstanceIds", values: [instance.instanceId] }
            ]
        });
        
        loadChemblAssociation.addPropertyOverride('Parameters',{
            databaseSecretArn: [secret.secretArn],
            databaseHostName: [database.dbInstanceEndpointAddress],
            executionTimeout: ['10800']
        });

        
    }
}