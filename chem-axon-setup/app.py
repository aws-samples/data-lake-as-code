#!/usr/bin/env python3

from aws_cdk import core
import os
from data_lake_setup.datalake_batch_stack import DatalakeBatchStack
from data_lake_setup.datalake_batch_job_def_stack import DatalakeBatchJobStack
from data_lake_setup.datalake_secret_manager_stack import DatalakeSecretManagerStack
from data_lake_setup.datalake_lambda_stack import DatalakeLambdaStack
from data_lake_setup.datalake_glue_stack import DatalakeGlueStack

""" Define your account id to make import vpc work """
env_cn = core.Environment(account=os.environ.get("AccountId"), region=os.environ.get("AwsRegion"))

""" Initialising environment variables and creating a dictionary to pass"""
config_dict = {}
config_dict['env_var'] = os.environ.get("EnvironVarLower")
config_dict['vpc_id'] = os.environ.get("VpcId")
config_dict['SubnetIds'] = os.environ.get("SubnetIds")
config_dict['AvailabilityZones'] = os.environ.get("AvailabilityZones")
config_dict['workflow_ecr_repo'] = os.environ.get("WorkflowEcrRepository")
config_dict['datalake_bucket_name'] = "datalake-" + config_dict['env_var'].lower()
config_dict['datalake_db_name'] = "datalake_db"
config_dict['workflow_comp_reg_image_version'] = os.environ.get("WorkflowCompRegImage")
config_dict['comp_reg_secret_name'] = os.environ.get("CompRegSecretName")
config_dict['comp_reg_host_name'] = os.environ.get("CompRegHostName")
config_dict['comp_reg_port'] = os.environ.get("CompRegPort")
config_dict['comp_reg_db_name'] = os.environ.get("CompRegDBName")
config_dict['comp_reg_user_name'] = os.environ.get("CompRegUserName")
config_dict['comp_reg_password'] = os.environ.get("CompRegPassword")

""" Sample config_dict would look like below :
config_dict = {
	'env_var': 'prod',
	'vpc_id': 'vpc-01234567',
	'SubnetIds': 'subnet-01234567,subnet-0123456789',
	'AvailabilityZones': 'us-east-1a,us-east-1b',
	'workflow_ecr_repo': 'datalake-repo',
	'datalake_bucket_name': 'datalake-prod',
	'datalake_db_name': 'datalake_db',
	'workflow_comp_reg_image_version': 'comp-reg-1.0',
	'comp_reg_secret_name': 'CompRegConn',
	'comp_reg_host_name': 'db_endpoint_host_name',
	'comp_reg_port': 'db_port',
	'comp_reg_db_name': 'db_name',
	'comp_reg_user_name': 'db_user',
	'comp_reg_password': 'db_pass'
}
"""

""" Start execution of deployment """
app = core.App()
DatalakeBatchStack(app, "datalake-batch-stack", config_dict, env=env_cn)
DatalakeBatchJobStack(app, "datalake-batch-job-stack", config_dict, env=env_cn)
DatalakeSecretManagerStack(app, "datalake-secret-manager-stack", config_dict, env=env_cn)
DatalakeLambdaStack(app, "datalake-lambda-stack", config_dict, env=env_cn)
DatalakeGlueStack(app, "datalake-glue-stack", config_dict, env=env_cn)

app.synth()
