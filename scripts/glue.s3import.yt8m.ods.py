import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from awsglue.dynamicframe import DynamicFrame
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

from pyspark.sql.types import *
from pyspark.sql.functions import col,lit
from pyspark.sql import functions as F

args = getResolvedOptions(sys.argv, ['JOB_NAME','DL_BUCKET', 'DL_PREFIX','DL_REGION', 'GLUE_SRC_DATABASE'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args["JOB_NAME"], args)



dataLakeBucket = args["DL_BUCKET"];
dataLakePrefix = args["DL_PREFIX"];
aws_region = args["DL_REGION"];
glue_database = args["GLUE_SRC_DATABASE"];

target_format = "parquet"


print("Starting VocabularyDF")

# Script generated for node S3 bucket
S3bucket_node1 = glueContext.create_dynamic_frame.from_options(
    format_options={"quoteChar": '"', "withHeader": True, "separator": ","},
    connection_type="s3",
    format="csv",
    connection_options={
        "paths": ["s3://aws-roda-ml-datalake/yt8m/vocabulary.csv"],
        "recurse": True,
    },
    transformation_ctx="S3bucket_node1",
)


# Script generated for node S3 bucket
S3bucket_node3 = glueContext.write_dynamic_frame.from_options(
    frame=S3bucket_node1,
    connection_type="s3",
    format="glueparquet",
    connection_options={
        "path": "s3://aws-roda-ml-datalake/yt8m_ods/vocabulary/",
        "partitionKeys": [],
    },
    format_options={"compression": "snappy"},
    transformation_ctx="S3bucket_node3",
)

print("Starting VideoDF")


videoDfTrain = spark.read.format("tfrecords").option("recordType", "Example").load("s3://aws-roda-ml-datalake/yt8m/2/video/train/*tfrecord")
videoDfTrain = videoDfTrain.withColumn("mlphase", lit('train')) 

videoDfTrain.show(5)
videoDfTrain.printSchema()



videoDfValidate = spark.read.format("tfrecords").option("recordType", "Example").load("s3://aws-roda-ml-datalake/yt8m/2/video/validate/*tfrecord")
videoDfValidate = videoDfValidate.withColumn("mlphase", lit('validate')) 

videoDfValidate.show(5)
videoDfValidate.printSchema()


videoDfTest = spark.read.format("tfrecords").option("recordType", "Example").load("s3://aws-roda-ml-datalake/yt8m/2/video/test/*tfrecord")
videoDfTest = videoDfTest.withColumn("mlphase", lit('test')) 
videoDfTest = videoDfTest.withColumn("labels", lit(None).cast("array<long>") )
videoDfTest = videoDfTest.select("mean_audio","labels","mean_rgb", "id", "mlphase")

videoDfTest.show(5)
videoDfTest.printSchema()

videoDF = videoDfTrain.union(videoDfValidate).union(videoDfTest);

glueContext.purge_s3_path("s3://"+dataLakeBucket + dataLakePrefix + "/video/", {"retentionPeriod": 0}, transformation_ctx="videopurge")    

glueContext.write_dynamic_frame.from_options(
    frame=DynamicFrame.fromDF(videoDF, glueContext, "video"),
    connection_type="s3",
    format="glueparquet",
    connection_options={
        "path": "s3://"+ dataLakeBucket + dataLakePrefix + "/video/",
        "partitionKeys": ['mlphase'],
    },
    format_options={"compression": "gzip"},
)


print("Starting FrameDF")

frameDfTrain = spark.read.format("tfrecords").option("recordType", "Example").load("s3://aws-roda-ml-datalake/yt8m/2/frame/train/*")
frameDfTrain = frameDfTrain.withColumn("mlphase", lit('train')) 

frameDfTrain.show(5)
frameDfTrain.printSchema()

frameDfValidate = spark.read.format("tfrecords").option("recordType", "Example").load("s3://aws-roda-ml-datalake/yt8m/2/frame/validate/*")
frameDfValidate = frameDfValidate.withColumn("mlphase", lit('validate')) 

frameDfValidate.show(5)
frameDfValidate.printSchema()

frameDfTest = spark.read.format("tfrecords").option("recordType", "Example").load("s3://aws-roda-ml-datalake/yt8m/2/frame/test/*")
frameDfTest = frameDfTest.withColumn("mlphase", lit('test')) 
frameDfTest = frameDfTest.withColumn("labels", lit(None).cast("array<long>") )
frameDfTest = frameDfTest.select("labels","id","mlphase")

frameDfTest.show(5)
frameDfTest.printSchema()

frameDF = frameDfTrain.union(frameDfValidate).union(frameDfTest);


glueContext.purge_s3_path("s3://"+dataLakeBucket + dataLakePrefix + "/frame/", {"retentionPeriod": 0}, transformation_ctx="framepurge")    

glueContext.write_dynamic_frame.from_options(
    frame=DynamicFrame.fromDF(frameDF, glueContext, "frame"),
    connection_type="s3",
    format="glueparquet",
    connection_options={
        "path": "s3://"+ dataLakeBucket + dataLakePrefix + "/frame/",
        "partitionKeys": ['mlphase'],
    },
    format_options={"compression": "gzip"},
)



print("Starting SegmentFrameDF")

segmentFrameDfValidate = spark.read.format("tfrecords").option("recordType", "Example").load("s3://aws-roda-ml-datalake/yt8m/3/frame/validate/*tfrecord")
segmentFrameDfValidate = segmentFrameDfValidate.withColumn("mlphase", lit('validate')) 

segmentFrameDfValidate.show(5)
segmentFrameDfValidate.printSchema()

segmentFrameDfTest = spark.read.format("tfrecords").option("recordType", "Example").load("s3://aws-roda-ml-datalake/yt8m/3/frame/test/*tfrecord")

segmentFrameDfTest = segmentFrameDfTest.withColumn("segment_start_times", lit(None).cast("array<long>") )
segmentFrameDfTest = segmentFrameDfTest.withColumn("labels", lit(None).cast("array<long>") )
segmentFrameDfTest = segmentFrameDfTest.withColumn("segment_end_times", lit(None).cast("array<long>") )
segmentFrameDfTest = segmentFrameDfTest.withColumn("segment_labels", lit(None).cast("array<long>") )
segmentFrameDfTest = segmentFrameDfTest.withColumn("segment_scores", lit(None).cast("array<float>") )
segmentFrameDfTest = segmentFrameDfTest.withColumn("mlphase", lit('test')) 
segmentFrameDfTest = segmentFrameDfTest.select("segment_start_times","labels","segment_end_times", "segment_labels", "segment_scores", "id", "mlphase")

segmentFrameDfTest.show(5)
segmentFrameDfTest.printSchema()

segmentFrameDf = segmentFrameDfValidate.union(segmentFrameDfTest);

glueContext.purge_s3_path("s3://"+dataLakeBucket + dataLakePrefix + "/segment/", {"retentionPeriod": 0}, transformation_ctx="segmentpurge")    

glueContext.write_dynamic_frame.from_options(
    frame=DynamicFrame.fromDF(segmentFrameDf, glueContext, "segment"),
    connection_type="s3",
    format="glueparquet",
    connection_options={
        "path": "s3://"+ dataLakeBucket + dataLakePrefix + "/segment/",
        "partitionKeys": ['mlphase'],
    },
    format_options={"compression": "gzip"},
)




job.commit()