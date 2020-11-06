import logging
import boto3
import os
from urllib.request import urlopen
import gzip
from io import BytesIO


from datetime import datetime

# Setup Global Values
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
    
    clinvarResponse = urlopen(FILEURL)
    
    unzippedSrcKey = fileName.replace(".gz","")
    
    s3.upload_fileobj(
        Fileobj=gzip.GzipFile(
            None,
            'rb',
            fileobj=BytesIO(clinvarResponse.read())
        ),
        Bucket=UPLOADBUCKET,
        Key=prefix+unzippedSrcKey
    )
    
    
    logger.info("COMPLETED UPLOAD TO S3")


    return "UPLOADED s3://{}/{}".format(UPLOADBUCKET,prefix+unzippedSrcKey)
 except Exception as e:
        logger.exception(e)
        logger.error('FAILED!')


    