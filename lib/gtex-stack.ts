import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { S3dataSetEnrollmentProps, S3dataSetEnrollment } from './constructs/s3-data-set-enrollment';
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';


export interface GTExEnrollmentProps extends DataSetStackProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefix: string;
}


export class GTExStack extends DataSetStack{
    
	constructor(scope: cdk.Construct, id: string, props: GTExEnrollmentProps) {
	    super(scope, id, props);
	    


	    this.Enrollments.push(new S3dataSetEnrollment(this, 'gtex-8-enrollment', {
	        DataSetName: "gtex_8",
	        MaxDPUs: 25.0,
	        sourceBucket: props.sourceBucket,
            sourceBucketDataPrefixes: [
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Adipose_Subcutaneous.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Adipose_Subcutaneous.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Adipose_Visceral_Omentum.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Adipose_Visceral_Omentum.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Adrenal_Gland.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Adrenal_Gland.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Annotations_SampleAttributesDS/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Annotations_SubjectPhenotypesDS/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Artery_Aorta.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Artery_Aorta.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Artery_Coronary.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Artery_Coronary.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Artery_Tibial.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Artery_Tibial.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Amygdala.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Amygdala.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Anterior_cingulate_cortex_BA24.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Anterior_cingulate_cortex_BA24.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Caudate_basal_ganglia.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Caudate_basal_ganglia.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Cerebellar_Hemisphere.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Cerebellar_Hemisphere.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Cerebellum.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Cerebellum.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Cortex.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Cortex.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Frontal_Cortex_BA9.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Frontal_Cortex_BA9.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Hippocampus.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Hippocampus.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Hypothalamus.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Hypothalamus.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Nucleus_accumbens_basal_ganglia.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Nucleus_accumbens_basal_ganglia.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Putamen_basal_ganglia.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Putamen_basal_ganglia.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Spinal_cord_cervical_c-1.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Spinal_cord_cervical_c-1.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Substantia_nigra.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Brain_Substantia_nigra.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Breast_Mammary_Tissue.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Breast_Mammary_Tissue.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Cells_Cultured_fibroblasts.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Cells_Cultured_fibroblasts.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Cells_EBV-transformed_lymphocytes.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Cells_EBV-transformed_lymphocytes.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Colon_Sigmoid.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Colon_Sigmoid.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Colon_Transverse.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Colon_Transverse.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Esophagus_Gastroesophageal_Junction.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Esophagus_Gastroesophageal_Junction.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Esophagus_Mucosa.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Esophagus_Mucosa.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Esophagus_Muscularis.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Esophagus_Muscularis.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Heart_Atrial_Appendage.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Heart_Atrial_Appendage.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Heart_Left_Ventricle.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Heart_Left_Ventricle.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Kidney_Cortex.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Kidney_Cortex.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Liver.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Liver.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Lung.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Lung.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Minor_Salivary_Gland.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Minor_Salivary_Gland.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Muscle_Skeletal.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Muscle_Skeletal.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Nerve_Tibial.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Nerve_Tibial.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Ovary.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Ovary.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Pancreas.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Pancreas.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Pituitary.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Pituitary.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Prostate.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Prostate.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Skin_Not_Sun_Exposed_Suprapubic.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Skin_Not_Sun_Exposed_Suprapubic.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Skin_Sun_Exposed_Lower_leg.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Skin_Sun_Exposed_Lower_leg.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Small_Intestine_Terminal_Ileum.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Small_Intestine_Terminal_Ileum.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Spleen.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Spleen.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Stomach.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Stomach.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Testis.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Testis.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Thyroid.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Thyroid.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Uterus.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Uterus.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Vagina.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Vagina.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Whole_Blood.v8.egenes/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/Whole_Blood.v8.signif_variant_gene_pairs/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/RNASeQCv1.1.9_gene_reads/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/RNASeQCv1.1.9_gene_tpm/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/RNASeQCv1.1.9_gene_median_tpm/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/STARv2.5.3a_junctions/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/RSEMv1.3.0_transcript_expected_count/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/RSEMv1.3.0_transcript_tpm/`,
                `${props.sourceBucketDataPrefix}gtex-data-releases/8/output/exon_reads/`
                
            ],
	        dataLakeBucket: props.DataLake.DataLakeBucket,
	        GlueScriptPath: "scripts/glue.s3import.gtex.8.py",
	        GlueScriptArguments: {
                "--job-language": "python", 
                "--job-bookmark-option": "job-bookmark-disable",
                "--enable-metrics": "",
                "--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName,
                "--DL_PREFIX": "/gtex_8/",
                "--DL_REGION": cdk.Stack.of(this).region,
                "--GLUE_SRC_DATABASE": "gtex_8_src"
            }
	    }));



	    
	}
}

