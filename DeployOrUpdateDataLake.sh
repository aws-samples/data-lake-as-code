#!/bin/sh
npm run build
cdk deploy CoreDataLake --require-approval never
#cdk deploy ExampleS3DataSet --require-approval never
#cdk deploy ExamplePgRdsDataSet --require-approval never

