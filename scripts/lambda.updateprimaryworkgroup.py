import json
import logging
import cfnresponse
import boto3

client = boto3.client('athena')
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def main(event, context):
    
    responseData = {}
    
    try:
        logger.info('got event {}'.format(event))
        
        if event['RequestType'] == 'Delete':
            responseData['Complete'] = "True"
            physicalResource = event['PhysicalResourceId']
            cfnresponse.send(event, context, cfnresponse.SUCCESS, responseData, physicalResource)
            return
        
        if event["RequestType"] == "Create" or event["RequestType"] == "Update":
            workGroupName=event['ResourceProperties']['WorkGroupName']
            TargetOutputLocationS3Url=event['ResourceProperties']['TargetOutputLocationS3Url']
            response = client.update_work_group(
        		WorkGroup=workGroupName,
        		Description='Primary workgroup',
        		ConfigurationUpdates={
        			'ResultConfigurationUpdates': {
    					'OutputLocation': TargetOutputLocationS3Url
    				}
    			}
        	)
        	
            responseData={}
            responseData['response']=response
            responseData['statusMessage'] = 'workgroup updated'			 
            logger.info('Workgroup updated')
            cfnresponse.send(event, context, cfnresponse.SUCCESS, responseData)
            return
        
        
    except Exception as e:
        logger.exception(e)
        logger.info('FAILED!')
    	#cfnresponse.send(event,context,cfnresponse.FAILED,{"statusMessage": "Exception during processing"})