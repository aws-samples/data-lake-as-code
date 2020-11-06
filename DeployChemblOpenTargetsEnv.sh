#!/bin/sh
npm run build
cdk bootstrap
currentPrincipalArn=$(aws sts get-caller-identity --query Arn --output text)
#Just in case you are using an IAM role, we will switch the identity from your STS arn to the underlying role ARN.
currentPrincipalArn=$(sed 's/\(sts\)\(.*\)\(assumed-role\)\(.*\)\(\/.*\)/iam\2role\4/' <<< $currentPrincipalArn)
jq '.context.starterLakeFormationAdmin = $currentPrincipalArn' --arg currentPrincipalArn $currentPrincipalArn cdk.json > tmp.$$.json && mv tmp.$$.json cdk.json
cdk deploy BaselineStack --require-approval never
cdk deploy CoreDataLake --require-approval never
cdk deploy ChemblStack --require-approval never
cdk deploy OpenTargetsStack --require-approval never
cdk deploy GTExStack --require-approval never
cdk deploy BindingDbStack --require-approval never
cdk deploy ClinvarSummaryVariantStack --require-approval never
cdk deploy AnalyticsStack --require-approval never
