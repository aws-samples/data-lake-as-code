aws glue get-tables --database-name yt8m_ods_dl > RODA_templates/yt8m_ods_get_tables.json
aws glue get-database --name yt8m_ods_dl > RODA_templates/yt8m_ods_get_database.json

npm run build

cdk synth SECFinancialStatementsAndNotesTemplate

jq 'del(.Parameters, .Rules)' cdk.out/SECFinancialStatementsAndNotesTemplate.template.json > tmp.$$.json && mv tmp.$$.json cdk.out/SECFinancialStatementsAndNotesTemplate.template.json

aws s3 cp cdk.out/SECFinancialStatementsAndNotesTemplate.template.json s3://aws-roda-fintech-datalake/SECFinancialStatementsAndNotes.RodaTemplate.json



#https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-fintech-datalake.s3.amazonaws.com%2FSECFinancialStatementsAndNotes.RodaTemplate.json&stackName=SEC-FinancialStatementsAndNotes-RODA

