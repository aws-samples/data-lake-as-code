#!/bin/sh
npm run build
cdk deploy CoreDataLake --require-approval never
cdk deploy yt8mDataSet --require-approval never
#cdk deploy ExamplePgRdsDataSet --require-approval never

