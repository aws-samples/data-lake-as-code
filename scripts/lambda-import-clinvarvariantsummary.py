import logging
import boto3
import os
import urllib3
from datetime import datetime

# Setup Global Values
http = urllib3.PoolManager()
logger = logging.getLogger()
# logger.setLevel(logging.DEBUG)
UPLOADBUCKET = os.getenv('SRC_BUCKET', '')
FILEMD5URL = os.getenv('ImportGZMD5', '')
FILEURL = os.getenv('ImportGZ', '')
GLUEDESTBUCKET = os.getenv('DEST_BUCKET','')
TIMESTAMP = datetime.today().strftime('%Y/%m/%d/')
GLUEJOBTAG = "ClinvarVariantSummaryLambdaImport"
GLUEJOBKEY = "TRUE"

glue = boto3.client('glue')

def getGlueJobName():
    try:
        listJobs = glue.list_jobs(Tags={
           GLUEJOBTAG : GLUEJOBKEY
        })
        lengthlistJobs = len(listJobs['JobNames'])
        if lengthlistJobs == 1:
            return listJobs['JobNames'][0]
        elif lengthlistJobs > 1:
            logger.warning("FOUND MUTIPLE JOBS UNDER TAG {} : {} SELECTING {}".format(GLUEJOBTAG,GLUEJOBKEY,listJobs['JobNames'][0]))
            return listJobs['JobNames'][0] 
        else:
            logger.error("UNABLE TO FIND GLUEJOB BASED ON TAG {} : {}".format(GLUEJOBTAG,GLUEJOBKEY))
            logger.error("OUTPUT OF GLUE: {}".format(str(listJobs)))
            return ""
        
    except Exception as e:
        logger.exception(e)
        logger.error("UNABLE TO GET GLUE JOB DETAILS")

def getMD5(url):
    try:
        return http.request('GET', FILEMD5URL)
    except Exception as e:
        logger.exception(e)
        logger.error("FAILED TO GET url")


def handler(event, context):

 try:
    #  Unable to verify MD5 on upload due to it being Multi Upload
    # fileHash = getMD5(FILEMD5URL)
    # fileHash = fileHash.data.decode('UTF-8').split(" ")[0].strip()
    # logger.info("Retrieved File Hash {}".format(fileHash))
    logger.info("Attempt to Stream File to S3")
    
    prefix = "variant_summary/source/" + TIMESTAMP + "clinvar_variant_summary/"
    fileName = FILEURL.split("/")[-1]
    s3=boto3.client('s3')
    
    s3.upload_fileobj(http.request('GET', FILEURL, preload_content=False), UPLOADBUCKET, prefix+fileName)
    logger.info("COMPLETED UPLOAD TO S3")
    glueJobName = os.getenv('GLUEJOBNAME',getGlueJobName())
    logger.info("Attempt to RunJob Glue")
    logger.info("Retrieved GlueJob {}".format(glueJobName))
    glue.start_job_run(
        JobName=glueJobName,
        Timeout=10,
        WorkerType='Standard',
        NumberOfWorkers=1,
        Arguments={
            "--DEST_BUCKET": GLUEDESTBUCKET,
            "--DEST_KEY": "variant_summary/transform/parquet/",
            "--SRC_BUCKET": UPLOADBUCKET,
            "--SRC_PREFIX": prefix+fileName,
            "--timeStampPrefix": TIMESTAMP,
            "--enable-continuous-cloudwatch-log" : "TRUE",
            "--AWS_REGION": os.environ['AWS_REGION'],
        },
        )
    return "UPLOADED s3://{}/{}".format(UPLOADBUCKET,prefix+fileName)
 except Exception as e:
        logger.exception(e)
        logger.error('FAILED!')


    