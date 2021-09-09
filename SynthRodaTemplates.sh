aws glue get-tables --database-name opentargets_1911_dl > RODA_templates/open_targets_1911_get_tables.json
aws glue get-database --name opentargets_1911_dl > RODA_templates/open_targets_1911_get_database.json

aws glue get-tables --database-name opentargets_20_06_dl > RODA_templates/opentargets_20_06_get_tables.json
aws glue get-database --name opentargets_20_06_dl > RODA_templates/opentargets_20_06_get_database.json

aws glue get-tables --database-name chembl_25_dl > RODA_templates/chembl_25_get_tables.json
aws glue get-database --name chembl_25_dl > RODA_templates/chembl_25_get_database.json

aws glue get-tables --database-name chembl_27_dl > RODA_templates/chembl_27_get_tables.json
aws glue get-database --name chembl_27_dl > RODA_templates/chembl_27_get_database.json

aws glue get-tables --database-name binding_db_dl > RODA_templates/binding_db_get_tables.json
aws glue get-database --name binding_db_dl > RODA_templates/binding_db_get_database.json

aws glue get-crawler --name gtex_8_dl_crawler > RODA_templates/gtex_8_get_crawler.json
aws glue get-database --name gtex_8_dl > RODA_templates/gtex_8_get_database.json

aws glue get-tables --database-name clinvar_summary_variants_dl > RODA_templates/clinvar_variant_summary_get_tables.json
aws glue get-database --name clinvar_summary_variants_dl > RODA_templates/clinvar_variant_summary_get_database.json

aws glue get-tables --database-name thousandgenomes_dragen_dl > RODA_templates/thousand_genomes_dragen_get_tables.json
aws glue get-database --name thousandgenomes_dragen_dl > RODA_templates/thousand_genomes_dragen_get_database.json

aws glue get-tables --database-name thousandgenomes_dragen_dl > RODA_templates/thousand_genomes_dragen_get_tables.json
aws glue get-database --name thousandgenomes_dragen_dl > RODA_templates/thousand_genomes_dragen_get_database.json

npm run build



cdk synth OpenTargets1911RodaTemplate
cdk synth OpenTargets2006RodaTemplate
cdk synth Chembl25RodaTemplate
cdk synth Chembl27RodaTemplate
cdk synth BindingDbRodaTemplate
cdk synth GTExRodaTemplate8
cdk synth ClinvarSummaryVariantTemplate
cdk synth ThousandGenomesDragenTemplate

aws s3 cp cdk.out/OpenTargets1911RodaTemplate.template.json s3://aws-roda-hcls-datalake/OpenTargets.19.11.RodaTemplate.json
aws s3 cp cdk.out/OpenTargets2006RodaTemplate.template.json s3://aws-roda-hcls-datalake/OpenTargets.20.06.RodaTemplate.json
aws s3 cp cdk.out/Chembl25RodaTemplate.template.json s3://aws-roda-hcls-datalake/Chembl.25.RodaTemplate.json
aws s3 cp cdk.out/Chembl27RodaTemplate.template.json s3://aws-roda-hcls-datalake/Chembl.27.RodaTemplate.json
aws s3 cp cdk.out/BindingDbRodaTemplate.template.json s3://aws-roda-hcls-datalake/BindingDbRodaTemplate.json
aws s3 cp cdk.out/GTExRodaTemplate8.template.json s3://aws-roda-hcls-datalake/GTEx.8.RodaTemplate.json
aws s3 cp cdk.out/ClinvarSummaryVariantTemplate.template.json s3://aws-roda-hcls-datalake/ClinvarSummaryVariantTemplate.template.json
aws s3 cp cdk.out/ThousandGenomesDragenTemplate.template.json s3://aws-roda-hcls-datalake/ThousandGenomesDragenTemplate.template.json

#https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FOpenTargets.20.06.RodaTemplate.json&stackName=OpenTargets-20-06-RODA
#https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FOpenTargets.19.11.RodaTemplate.json&stackName=OpenTargets-19-11-RODA

#https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FChembl.27.RodaTemplate.json&stackName=Chembl27-RODA
#https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FChembl.25.RodaTemplate.json&stackName=Chembl25-RODA

#https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FBindingDbRodaTemplate.json&stackName=BindingDB-RODA

#https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FGTEx.8.RodaTemplate.json&stackName=GTEx-8-RODA

#https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FThousandGenomesDragenTemplate.template.json&stackName=Thousand-Genomes-DRAGEN