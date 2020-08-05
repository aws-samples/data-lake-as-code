aws glue get-tables --database-name opentargets_1911_dl > RODA_templates/open_targets_1911_get_tables.json
aws glue get-database --name opentargets_1911_dl > RODA_templates/open_targets_1911_get_database.json
npm run build && cdk synth OpenTargetsRodaTemplate
aws s3 cp cdk.out/OpenTargetsRodaTemplate.template.json s3://aws-roda-hcls-datalake/OpenTargetsRodaTemplate.json


aws glue get-tables --database-name chembl_25_dl > RODA_templates/chembl_25_get_tables.json
aws glue get-database --name chembl_25_dl > RODA_templates/chembl_25_get_database.json
npm run build && cdk synth ChemblRodaTemplate
aws s3 cp cdk.out/ChemblRodaTemplate.template.json s3://aws-roda-hcls-datalake/ChemblRodaTemplate.json

aws glue get-tables --database-name binding_db_dl > RODA_templates/binding_db_get_tables.json
aws glue get-database --name binding_db_dl > RODA_templates/binding_db_get_database.json
npm run build && cdk synth BindingDbRodaTemplate
aws s3 cp cdk.out/BindingDbRodaTemplate.template.json s3://aws-roda-hcls-datalake/BindingDbRodaTemplate.json

#https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FChemblRodaTemplate.json&stackName=Chembl25-RODA
#https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FOpenTargetsRodaTemplate.json&stackName=OpenTargets-1911-RODA
#https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%BindingDbRodaTemplate.json&stackName=BindingDB-RODA