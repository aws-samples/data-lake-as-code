import boto3
import os
import logging

"""
Create a logging function and initiate it.
"""
format_string = "%(asctime)s %(name)s [%(levelname)s] %(message)s"
logger = logging.getLogger('comp-reg-data-load-pipeline-lambda')
handler = logging.StreamHandler()
logger.setLevel(logging.DEBUG)
formatter = logging.Formatter(format_string)
handler.setFormatter(formatter)
logger.addHandler(handler)


def lambda_handler(event, context):

    # Initialise the environment variables required to trigger the AWS Batch Job
    awsregion = os.environ.get('AWS_REGION')

    # Execute the batch job
    batch_client = boto3.client('batch', region_name=awsregion)
    execute_cmd = ['python', 'comp_reg_data_load.py', awsregion]
    batch_job_id = batch_client.submit_job(jobDefinition='comp-reg-etl-job',
                                           jobQueue='datalake-job-queue',
                                           jobName=f'comp-reg-etl-job',
                                           containerOverrides={'command': execute_cmd})['jobId']

    # Log the batch job id triggered
    logger.info("The command executed by Lambda function is : " + str(execute_cmd))
    logger.info("The AWS Batch Job ID : " + str(batch_job_id))
