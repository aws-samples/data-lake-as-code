npm run build
cdk bootstrap
cdk deploy BaselineStack --require-approval never
cdk deploy CoreDataLake --require-approval never
cdk deploy ChemblStack --require-approval never
cdk deploy OpenTargetsStack --require-approval never
cdk deploy AnalyticsStack --require-approval never
