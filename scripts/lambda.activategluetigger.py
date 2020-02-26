import boto3
import json
from botocore.exceptions import ClientError
import logging as log
import cfnresponse
glue = boto3.client('glue')


def main(event, context):

    print(event)

    log.getLogger().setLevel(log.INFO)
    
    triggerId = event['ResourceProperties']['TriggerId']
    
    response = glue.start_trigger(Name=triggerId);

    cfnresponse.send(event, context, cfnresponse.SUCCESS, response, triggerId);

