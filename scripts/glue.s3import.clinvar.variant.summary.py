
import sys
from awsglue.job import Job
from awsglue.transforms import *
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.utils import getResolvedOptions
from io import BytesIO
import boto3,gzip,time
## @params: [JOB_NAME]
args = getResolvedOptions(sys.argv, ['JOB_NAME','SRC_BUCKET', 'SRC_PREFIX','SRC_REGION', 'DEST_BUCKET','DEST_KEY', 'timeStampPrefix','AWS_REGION'])

srcBucket = args["SRC_BUCKET"];
srcPrefix = args["SRC_PREFIX"];
aws_region = args["SRC_REGION"];
destBucket = args["DEST_BUCKET"];
destKey = args["DEST_KEY"];
timeStamp = args["timeStampPrefix"]
AWSREGION = args["AWS_REGION"]
unzippedSrcKey = srcPrefix.replace(".gz","")


glueContext = GlueContext(SparkContext.getOrCreate())

job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Using csv file instead of compressed gz for better paritions 
print("Start decompression")
s3 = boto3.client('s3')
s3.upload_fileobj(
    Fileobj=gzip.GzipFile(
        None,
        'rb',
        fileobj=BytesIO(
            s3.get_object(Bucket=srcBucket, Key=srcPrefix)['Body'].read())),
    Bucket=srcBucket,
    Key=unzippedSrcKey)

print("End of decomporession" )

s3SrcPath = "s3://{}/{}".format(srcBucket,unzippedSrcKey)
connection_options = {"paths": [s3SrcPath]}
format_options={"withHeader": True,"separator": "\t"}
print("Creating DataFrame from {} {}\n".format(srcBucket,unzippedSrcKey))

df =glueContext.create_dynamic_frame_from_options(connection_type="s3",connection_options=connection_options,format="csv",format_options=format_options)
renamedDF = df.toDF().withColumnRenamed("#AlleleID","AlleleID")
df = df.fromDF(renamedDF,glueContext, "df")

s3DestPath = "s3://{}/{}/{}/{}".format(destBucket,destKey,timeStamp,"clinvar_variant_summary")
print("Setting Dest path to {}".format(s3DestPath))
# print("Empty S3 Bucket s3://{}/{}/{}/{} ".format(destBucket,destKey,timeStamp,"clinvar_variant_summary" ))
# s3BUcket = boto3.resource('s3')
# bucket = s3.Bucket(destBucket)
# bucket.object_versions.filter(Prefix="{}/{}/{}".format(destKey,timeStamp,"clinvar_variant_summary")).delete()

glueContext.write_dynamic_frame_from_options(
       frame = df,
       connection_type = "s3",
       connection_options = {"path": s3DestPath},
       format = "parquet")
       
job.commit()

# Remove Temporary unzipped dataset
s3.delete_object(Bucket=srcBucket, Key=unzippedSrcKey)

# Start Crawler
glue = boto3.client("glue",region_name=AWSREGION)
glue.start_crawler(
    Name="clinvar-summary-variants_dl_crawler"
    )
print("END OF Script")