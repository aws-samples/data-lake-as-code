<h1 id='HPG9CA7YL2o'>Chembl and Open Targets in an AWS Data Lake</h1>

Companion code for upcoming AWS blogpost on enrolling chembl and opentargets into a data lake on AWS<br/>

<br/>

To install this in your own AWS account:<br/>

<br/>

<div style="" data-section-style='6' class=""><ul id='HPG9CAdvuXu'><li id='HPG9CAsuX2r' class='' value='1'>Clone this repo

<br/></li></ul></div><pre id='HPG9CAKfUT3'>git clone <a href="https://github.com/paulu-aws/chembl-opentargets-data-lake-example.git">https://github.com/paulu-aws/chembl-opentargets-data-lake-example.git</a></pre>

<div style="" data-section-style='6' class="list-numbering-continue"><ul id='HPG9CAPCYqe'><li id='HPG9CASYAsv' class='' value='1'>Install the CDK dependencies

<br/></li></ul></div><pre id='HPG9CAwKcSI'>./InstallCdkDependencies.sh</pre>

<div style="" data-section-style='6' class="list-numbering-continue"><ul id='HPG9CAHILzl'><li id='HPG9CAK6MvP' class='' value='1'>Deploy the CDK Stacks

<br/></li></ul></div><pre id='HPG9CAeahes'>./DeployChemblOpenTargetsEnv.sh</pre>

<div class="list-numbering-restart-at" data-section-style='6' style="--indent0: 4"><ul id='HPG9CAS1C4M'><li id='HPG9CA0az5T' class='parent' value='1'>Wait for Chembl and OpenTargets to be ‘staged’ into the baseline stack.

<br/></li><ul><li id='HPG9CAimAzR' class=''>The ‘baseline stack’ in the CDK application spins up a VPC with an S3 bucket (for OpenTargets) and an RDS Postgres instance (for Chembl). It also spins up a little helper EC2 instance that stages those assets in their ‘raw’ form<a href="http://OpenTargets.org"> OpenTargets.org</a> and EMBL-EBI into your account.

<br/></li><li id='HPG9CA9PXT3' class=''>Go to Systems Manager in the AWS console, and then the ‘Run Command’ section. You will see the currently running command documents. 

<br/></li><li id='HPG9CA9WNsB' class=''><span data-section-style='11' style='max-width:168%'><img src='https://quip-amazon.com/blob/HPG9AAwumxR/x4lfduQeC3Ww-DyK8loIAg?a=6aMBuWAgnWaZ5pQaJndaM06ob734VpmiCI5xfguyPaca' id='HPG9CA9WNsB' alt='' width='1276' height='612'></img></span></li><li id='HPG9CAQFK7w' class=''>It takes about an hour for Chembl to build. If you get impatient and want to see the progress in real time, go to ‘Session Manager’ in the Systems Manager console, click the ‘Start session’ button, choose the ‘ChembDbImportInstance’ radio button, and click the ‘Start Session’ button.

<br/></li><li id='HPG9CADqhgF' class=''><span data-section-style='11' style='max-width:155%'><img src='https://quip-amazon.com/blob/HPG9AAwumxR/Fj7sA3VuIuvdPOHl017Xcg?a=EYFlHaKY8weEGFezDR4ld3sEhBMWl88afFdDjJQ15H8a' id='HPG9CADqhgF' alt='' width='1242' height='666'></img></span></li><li id='HPG9CAByHqU' class=''>That will open a SSM session window run the following command

<br/></li></ul></ul></div><pre id='HPG9CAuziva'> <code>tail -f progressLog</code></pre>

<div style="" data-section-style='6' class=""><ul id='HPG9CAaYWQI'><li id='HPG9CAgo8Yy' class='' value='1'><span data-section-style='11' class='tall' style='max-width:147%'><img src='https://quip-amazon.com/blob/HPG9AAwumxR/rMcRhjzUcIGQVYeBFxup4Q?a=2NRscRrktD9kLK7rDqqD9bO3aXtTYttCeaEWLwDXVgIa' id='HPG9CAgo8Yy' alt='' width='1115' height='1030'></img></span></li></ul></div><br/>

<div style="" data-section-style='6' class="list-numbering-continue"><ul id='HPG9CA8jP0B'><li id='HPG9CA6hIcf' class='' value='1'>Once the database has finished importing, go to Glue in the AWS console, and then the “Workflows” section

<br/></li><li id='HPG9CADnepH' class=''><span data-section-style='11' style='max-width:147%'><img src='https://quip-amazon.com/blob/HPG9AAwumxR/K0liqaLzOGNHdODU_fN_MA?a=GQQahtSxVQNvaU6AkEjATwCE0WJglr630LH3bZcngB0a' id='HPG9CADnepH' alt='' width='1177' height='631'></img></span></li><li id='HPG9CApeYdR' class=''>Select the openTargetsDataLakeEnrollment workflow, and click ‘Actions’, then 'Run'

<br/></li><li id='HPG9CAgkuAH' class=''><span data-section-style='11' style='max-width:147%'><img src='https://quip-amazon.com/blob/HPG9AAwumxR/UV0-ZlwmK_KF9L9MfaUgfA?a=97k7vof4qlurzy3zSsmPVhomgCpRUJfREq8UCNZSzt4a' id='HPG9CAgkuAH' alt='' width='1177' height='631'></img></span></li><li id='HPG9CA1tRSd' class=''>Do the same for the chemblDataLakeEnrollmentWorkflow

<br/></li><li id='HPG9CA4pCXY' class=''>Wait for the workflows to finish.

<br/></li></ul></div><br/>

You can now query opentargets and chembl data through Athena!<br/>

<br/>