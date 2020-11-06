
import sys
from awsglue.job import Job
from awsglue.transforms import *
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.utils import getResolvedOptions
from io import BytesIO
import boto3,gzip,time
## @params: [JOB_NAME]
args = getResolvedOptions(sys.argv, ['JOB_NAME','SRC_BUCKET', 'SRC_PREFIX','SRC_REGION', 'DL_BUCKET','DL_PREFIX'])

srcBucket = args["SRC_BUCKET"];
srcPrefix = args["SRC_PREFIX"];
aws_region = args["SRC_REGION"];
dataLakeBucket = args["DL_BUCKET"];
dataLakePrefix = args["DL_PREFIX"];



glueContext = GlueContext(SparkContext.getOrCreate())

job = Job(glueContext)
job.init(args['JOB_NAME'], args)


s3SrcPath = "s3://{}/{}/variant_summary.txt".format(srcBucket,srcPrefix)
connection_options = {"paths": [s3SrcPath]}
format_options={"withHeader": True,"separator": "\t"}
print("Creating DataFrame from {} {}\n".format(srcBucket,srcPrefix))

df =glueContext.create_dynamic_frame_from_options(connection_type="s3",connection_options=connection_options,format="csv",format_options=format_options)
renamedDF = df.toDF().withColumnRenamed("#AlleleID","AlleleID")
df = df.fromDF(renamedDF,glueContext, "df")

s3DestPath = "s3://{}/{}/clinvar_variant_summary/".format(dataLakeBucket,dataLakePrefix)
print("Setting Dest path to {}".format(s3DestPath))


glueContext.write_dynamic_frame_from_options(
       frame = df,
       connection_type = "s3",
       connection_options = {"path": s3DestPath},
       format = "parquet")
       
job.commit()


print("END OF Script")