import boto3
import json
from botocore.exceptions import ClientError
import logging as log
import cfnresponse
glue = boto3.client('glue')


def main(event, context):

    physical_id = 'startTrigger'
    log.getLogger().setLevel(log.INFO)
    responseData = {}
     
    try:
        log.info('Input event: %s', event)

        if event['RequestType'] == 'Delete':
            responseData['Complete'] = 'True';
            resourceID = event['PhysicalResourceId']
            cfnresponse.send(event, context, cfnresponse.SUCCESS, responseData, resourceID)
        
        if event['RequestType'] == 'Create':
            
            triggerId = event['ResourceProperties']['triggerId']
            response = glue.start_trigger(Name=triggerId);
            cfnresponse.send(event, context, cfnresponse.SUCCESS, response, triggerId);
    except Exception as e:
        log.exception(e)
        cfnresponse.send(event, context, cfnresponse.FAILED, {}, physical_id)
