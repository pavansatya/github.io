/**
 * Work history. Dates and titles follow the current résumé exactly —
 * the résumé page and the About timeline both render from this list.
 */

export interface Role {
  id: string;
  title: string;
  org: string;
  place: string;
  period: string;
  /** ISO dates drive JSON-LD and ordering. `end: null` means current. */
  start: string;
  end: string | null;
  /** One-line framing used on the About timeline. */
  note: string;
  /** Résumé bullets. */
  bullets: string[];
}

export const roles: Role[] = [
  {
    id: 'la-county-dhs',
    title: 'Data Analytics Engineer',
    org: 'Los Angeles County Department of Health Services',
    place: 'Los Angeles, CA',
    period: 'Nov 2025 — present',
    start: '2025-11-01',
    end: null,
    note:
      'Architecting the Azure platform behind the migration off Oracle Millennium HealtheIntent, and ' +
      'the CI/CD and validation frameworks that make its releases trustworthy.',
    bullets: [
      'Architected and managed enterprise Azure data platform components supporting the migration of clinical and operational data from Oracle Millennium HealtheIntent to Azure.',
      'Designed, developed and maintained automated CI/CD pipelines using YAML and Azure DevOps to deploy Synapse notebooks, SQL scripts and data platform assets across development, staging and production.',
      'Administered Azure Synapse workspaces, Apache Spark pools, ADLS Gen2 storage containers, access permissions, Key Vault linked services and Azure DevOps service connections to support secure and reliable deployments.',
      'Managed deployment configurations, environment-specific parameters and infrastructure dependencies to streamline release management and keep environments consistent.',
      'Automated data ingestion, transformation and processing workflows using Python, PySpark, T-SQL and PL/SQL within Azure Synapse.',
      'Implemented structured logging, execution tracking, error handling and auditing frameworks within Spark and Python pipelines to improve operational visibility and production reliability.',
      'Optimized Delta Lake workloads through liquid clustering and Z-order indexing, improving query performance and resource utilization.',
      'Established automated validation and UAT frameworks to verify deployment outputs, schema consistency, transformation accuracy and data integrity across environments.',
    ],
  },
  {
    id: 'i-net',
    title: 'Data Engineer Intern',
    org: 'I Net Software Technologies',
    place: 'Texas, USA',
    period: 'Jun 2025 — Oct 2025',
    start: '2025-06-01',
    end: '2025-10-31',
    note:
      'Built a governed Databricks lakehouse — Unity Catalog for access and lineage, ADF and Databricks ' +
      'Jobs for orchestration, Azure DevOps for deployment.',
    bullets: [
      'Designed and maintained automated CI/CD workflows using Azure DevOps to deploy and orchestrate Azure Databricks notebooks, data pipelines and related platform assets.',
      'Developed and optimized PySpark and Python workflows within Azure Databricks, supporting scalable data processing and automated ETL/ELT execution.',
      'Implemented an Azure Databricks Lakehouse using Medallion architecture and Delta Lake, establishing standardized data processing and deployment workflows.',
      'Configured Unity Catalog for centralized data governance, access management, permission control and data lineage across Databricks environments.',
      'Automated recurring data engineering tasks using Azure Data Factory, Databricks Jobs and Azure DevOps pipelines, improving scheduling consistency and operational reliability.',
      'Implemented data validation, exception handling and structured logging to identify pipeline failures, monitor execution status and improve troubleshooting.',
    ],
  },
  {
    id: 'rutgers',
    title: 'Data Science Analyst',
    org: 'Rutgers University',
    place: 'New Jersey, USA',
    period: 'Oct 2023 — May 2025',
    start: '2023-10-01',
    end: '2025-05-31',
    note:
      'Python analytical workflows over large-scale biological and experimental data, built so results ' +
      'could be reproduced rather than remembered.',
    bullets: [
      'Developed and maintained Python-based analytical workflows to process large-scale biological and experimental datasets, supporting reproducible research and computational analysis.',
      'Automated data preprocessing, transformation and validation workflows using Python, SQL and analytical libraries, improving consistency and reliability of research datasets.',
      'Worked with distributed data processing concepts and computational environments to execute analytical workloads and manage research data efficiently.',
      'Implemented data validation, exception handling and quality checks to identify inconsistencies and ensure reliable analytical outputs.',
      'Developed automated analytical workflows and visualizations to communicate research findings to cross-functional research teams.',
      'Collaborated with faculty and research collaborators to document workflows, establish analytical standards and improve reproducibility.',
    ],
  },
  {
    id: 'piramal',
    title: 'Data Analyst — Pharma & Finance',
    org: 'Piramal Pharma',
    place: 'Bangalore, India',
    period: 'Jun 2021 — Jul 2023',
    start: '2021-06-01',
    end: '2023-07-31',
    note:
      'Spark and Delta Lake ETL over large healthcare datasets, with quality monitoring and anomaly ' +
      'detection built into the pipelines themselves.',
    bullets: [
      'Developed and maintained scalable ETL/ELT workflows using Python, PySpark, SQL and Databricks to process large-scale healthcare operational and patient datasets.',
      'Implemented automated data ingestion, transformation and validation workflows leveraging Apache Spark and Delta Lake to improve processing reliability and data accessibility.',
      'Optimized Spark-based processing workflows and SQL transformations to improve execution efficiency and support scalable analytical workloads.',
      'Developed reusable data processing components and automated validation mechanisms to improve consistency and reduce manual intervention.',
      'Implemented data quality monitoring, anomaly detection and root-cause analysis using Python and SQL to identify processing discrepancies and improve pipeline reliability.',
      'Collaborated with data engineering, clinical operations and business teams to troubleshoot data integration issues and maintain reliable data delivery.',
    ],
  },
];

/** Profile summary bullets — the résumé's opening section. */
export const profileSummary: string[] = [
  'Cloud and data platform engineer with 5+ years designing, automating and managing enterprise cloud infrastructure, CI/CD pipelines and scalable data platforms across healthcare, financial services and enterprise environments.',
  'Hands-on with Microsoft Azure, Azure DevOps, YAML-based CI/CD, Azure Synapse Analytics, Azure Databricks, ADLS Gen2, Apache Spark and Delta Lake.',
  'Experienced automating deployments across development, staging and production, managing cloud resources, configuring access controls and applying infrastructure and deployment best practices.',
  'Experienced with ETL orchestration and pipeline scheduling using Azure Synapse Pipelines, Spark job orchestration and Azure DevOps, mapping directly to Airflow-style workflow automation patterns.',
  'Comfortable translating business and compliance requirements into production-grade data solutions with both technical and non-technical stakeholders.',
  'Working knowledge of AI-assisted development tools (GitHub Copilot, Amazon Bedrock) and machine learning techniques for analytical workflows and anomaly detection.',
];
