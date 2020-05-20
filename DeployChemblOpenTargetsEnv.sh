#!/bin/sh
npm run build
cdk bootstrap
currentPrincipalArn=$(aws sts get-caller-identity --query Arn --output text)
jq '.context.starterLakeFormationAdmin = $currentPrincipalArn' --arg currentPrincipalArn $currentPrincipalArn cdk.json > tmp.$$.json && mv tmp.$$.json cdk.json
cdk deploy BaselineStack --require-approval never
cdk deploy CoreDataLake --require-approval never
cdk deploy ChemblStack --require-approval never
cdk deploy OpenTargetsStack --require-approval never
cdk deploy AnalyticsStack --require-approval never
