#!/bin/sh
npm run build
currentPrincipalArn=$(aws sts get-caller-identity --query Arn --output text)
#Just in case you are using an IAM role, we will switch the identity from your STS arn to the underlying role ARN.
currentPrincipalArn=$(sed 's/\(sts\)\(.*\)\(assumed-role\)\(.*\)\(\/.*\)/iam\2role\4/' <<< $currentPrincipalArn)
jq '.context.starterLakeFormationAdmin = $currentPrincipalArn' --arg currentPrincipalArn $currentPrincipalArn cdk.json > tmp.$$.json && mv tmp.$$.json cdk.json
cdk deploy CoreDataLake --require-approval never
#cdk deploy ExampleS3DataSet --require-approval never
#cdk deploy ExamplePgRdsDataSet --require-approval never

