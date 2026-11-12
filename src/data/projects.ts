/**
 * Case studies. Each one is a real engagement from the résumé, written as
 * problem -> approach -> what changed, with the stack it actually used.
 */

export interface Project {
  slug: string;
  num: string;
  title: string;
  org: string;
  period: string;
  /** One sentence for cards and meta descriptions. */
  summary: string;
  problem: string;
  approach: string[];
  outcomes: string[];
  stack: string[];
  role: string;
  tags: string[];
  /** Renders the interactive lineage explorer on this case study. */
  hasPipeline?: boolean;
  /** Links the in-browser SQL playground from this case study. */
  hasPlayground?: boolean;
  external?: { label: string; url: string } | null;
}

export const projects: Project[] = [
  {
    slug: 'azure-clinical-platform',
    num: '01',
    title: 'Moving a county health system off Oracle',
    org: 'LA County DHS',
    period: 'Nov 2025 — present',
    summary:
      'The Azure platform replacing Oracle Millennium HealtheIntent — a medallion lakehouse, tuned Delta storage, and clinical history that survives the move.',
    problem:
      'Clinical and operational data sat in Oracle Millennium HealtheIntent. It answered the questions it was built for and little else: analysts waited on extracts, and the platform could not be extended to meet new reporting or operational needs. Moving it to Azure meant rebuilding not just the storage but the shape of the data and the way it is served.',
    approach: [
      'I architect and manage the Azure platform components behind the migration — Synapse workspaces, Apache Spark pools, ADLS Gen2 storage containers, and the Key Vault linked services and access permissions that hold them together.',
      'Ingestion and transformation run as Python, PySpark, T-SQL and PL/SQL workloads inside Azure Synapse, organised as a medallion lakehouse: raw landing in Bronze, conformed and history-tracked in Silver, serving models in Gold. Keeping the layers separable means a transformation can be corrected and replayed without going back to the source system.',
      'On the storage side, Delta Lake tuning does the heavy lifting. Liquid clustering and Z-order indexing on the serving tables keep queries interactive at scale, so consumers stop building their own pre-aggregated copies.',
    ],
    outcomes: [
      'Clinical and operational data is queryable in Azure rather than locked behind HealtheIntent extracts.',
      'Delta liquid clustering and Z-order indexing improved query performance and cluster resource utilization on the serving layer.',
      'Bronze / Silver / Gold separation means a transformation can be rebuilt without re-ingesting from the source system.',
      'Platform access runs through Key Vault linked services and scoped permissions rather than embedded credentials.',
    ],
    stack: [
      'Azure Synapse',
      'PySpark',
      'Python',
      'T-SQL',
      'PL/SQL',
      'Delta Lake',
      'ADLS Gen2',
      'Azure Key Vault',
      'Apache Spark',
    ],
    role: 'Data Analytics Engineer — platform architecture, implementation and workspace administration.',
    tags: ['Azure Synapse', 'Delta Lake', 'Medallion'],
    hasPipeline: true,
    external: null,
  },
  {
    slug: 'shipping-a-data-platform',
    num: '02',
    title: 'Shipping a data platform like software',
    org: 'LA County DHS',
    period: 'Nov 2025 — present',
    summary:
      'YAML pipelines that deploy Synapse notebooks, SQL and platform assets across three environments — plus the logging and validation that prove the deploy did what it claimed.',
    problem:
      'Data platforms are usually promoted by hand: a notebook copied into the next workspace, a parameter edited in a portal, a script someone remembers to run. It works until an environment drifts, and then nobody can say which version of a transformation produced a given number — or whether staging and production are still the same system.',
    approach: [
      'I design and maintain automated CI/CD pipelines in YAML and Azure DevOps that deploy Synapse notebooks, SQL scripts and data platform assets across development, staging and production. Deployment configuration, environment-specific parameters and infrastructure dependencies are part of the release definition rather than manual steps.',
      'The security surface is configured alongside it — Azure DevOps service connections, RBAC and access permissions, and Key Vault integration — so deployments are repeatable and scoped rather than running on a standing admin credential.',
      'Inside the pipelines I implement structured logging, execution tracking, error handling and auditing frameworks, so a failed run is diagnosable from its logs instead of by rerunning it and watching.',
      'On top sits an automated validation and UAT framework that verifies deployment outputs, schema consistency, transformation accuracy and data integrity across environments before a release is signed off.',
    ],
    outcomes: [
      'Promotion across dev, staging and production runs from one pipeline definition instead of manual steps.',
      'Environment-specific parameters are declared in the release, which keeps environments from drifting apart.',
      'Schema consistency and transformation accuracy are verified automatically before sign-off, not after a stakeholder notices.',
      'Structured logging and execution auditing make failures diagnosable from logs rather than by reproduction.',
    ],
    stack: [
      'Azure DevOps',
      'YAML pipelines',
      'Azure Synapse',
      'RBAC',
      'Azure Key Vault',
      'Python',
      'PySpark',
      'Azure Monitor',
    ],
    role: 'Owner of the deployment, logging and validation tooling for the platform.',
    tags: ['CI/CD', 'Azure DevOps', 'Observability'],
    hasPlayground: true,
    external: null,
  },
  {
    slug: 'governed-lakehouse',
    num: '03',
    title: 'A governed lakehouse on Databricks',
    org: 'I Net Software Technologies',
    period: 'Jun 2025 — Oct 2025',
    summary:
      'Medallion architecture on Azure Databricks with Unity Catalog for access and lineage, orchestrated by Data Factory and Databricks Jobs, deployed by Azure DevOps.',
    problem:
      'A lakehouse without governance is a data swamp with better branding. Access was managed per workspace, lineage was tribal knowledge, and recurring jobs ran when somebody noticed they had not. The platform worked, but no one could answer who could read what, or where a table came from.',
    approach: [
      'I implemented an Azure Databricks lakehouse on Medallion architecture with Delta Lake, standardising how data moves between layers and how those movements are deployed.',
      'Unity Catalog became the governance layer — centralised access management, permission control and data lineage across Databricks environments, so entitlements and provenance are properties of the catalog rather than of whoever configured a workspace.',
      'PySpark and Python workflows handle the ETL/ELT processing. Scheduling moved onto Azure Data Factory, Databricks Jobs and Azure DevOps pipelines so recurring work runs on a schedule rather than on attention.',
      'Validation, exception handling and structured logging surface pipeline failures explicitly instead of letting a job report success over bad output.',
    ],
    outcomes: [
      'Access and permissions are centrally managed in Unity Catalog rather than per workspace.',
      'Lineage across Databricks environments became queryable instead of tribal knowledge.',
      'Recurring ingestion and transformation run on schedule through ADF and Databricks Jobs.',
      'Pipeline failures surface through structured logging and exception handling rather than silently.',
    ],
    stack: [
      'Azure Databricks',
      'Unity Catalog',
      'Delta Lake',
      'PySpark',
      'Azure Data Factory',
      'Azure DevOps',
      'Python',
    ],
    role: 'Data Engineer Intern — built the lakehouse and its deployment workflows.',
    tags: ['Databricks', 'Unity Catalog', 'Governance'],
    external: null,
  },
  {
    slug: 'pipelines-that-catch-failures',
    num: '04',
    title: 'Pipelines that catch their own failures',
    org: 'Piramal Pharma',
    period: 'Jun 2021 — Jul 2023',
    summary:
      'Spark and Delta Lake ETL over large-scale healthcare data, with quality monitoring, anomaly detection and root-cause analysis built into the pipeline instead of bolted on afterwards.',
    problem:
      'Healthcare operational and patient data arrived from several systems, and the dangerous failure was never a crash. It was a pipeline that completed successfully while producing subtly wrong numbers. By the time a discrepancy surfaced in a report, the run that caused it was weeks in the past and the context was gone.',
    approach: [
      'I built and maintained scalable ETL/ELT workflows in Python, PySpark, SQL and Databricks to process large-scale healthcare operational and patient datasets, using Apache Spark and Delta Lake for ingestion, transformation and validation.',
      'Spark processing and SQL transformations were tuned for execution efficiency so the workloads stayed viable as volumes grew.',
      'The repeated work was factored into reusable processing components with validation built in, rather than re-implemented per pipeline — which is where inconsistency creeps in.',
      'Data quality monitoring, anomaly detection and root-cause analysis in Python and SQL ran over the outputs, so processing discrepancies were identified by the system rather than by a stakeholder reading a report.',
    ],
    outcomes: [
      'Processing discrepancies were caught by monitoring and anomaly detection instead of surfacing downstream.',
      'Reusable validation components reduced repeated manual intervention across recurring data operations.',
      'Spark and SQL tuning improved execution efficiency on large-scale workloads.',
      'Root-cause analysis became a query against logged output rather than an investigation.',
    ],
    stack: ['PySpark', 'Python', 'SQL', 'Databricks', 'Apache Spark', 'Delta Lake'],
    role: 'Data Analyst — Pharma & Finance, on the data engineering side of healthcare analytics.',
    tags: ['Apache Spark', 'Delta Lake', 'Data quality'],
    external: null,
  },
  {
    slug: 'reproducible-research-pipelines',
    num: '05',
    title: 'Research that can be run twice',
    org: 'Rutgers University',
    period: 'Oct 2023 — May 2025',
    summary:
      'Python analytical workflows over large-scale biological and experimental datasets, built so a result could be regenerated rather than remembered.',
    problem:
      'Research analysis tends to live in one person’s notebook: undocumented preprocessing, hand-edited inputs, and a figure nobody can reproduce six months later. That is a reproducibility problem before it is an engineering one, and it gets expensive exactly when a result matters.',
    approach: [
      'I developed and maintained Python-based analytical workflows to process large-scale biological and experimental datasets, automating preprocessing, transformation and validation in Python and SQL so the same inputs reliably produce the same outputs.',
      'Validation, exception handling and quality checks identify dataset inconsistencies and processing issues early, before they propagate into analysis.',
      'I worked with distributed processing concepts and computational environments to keep larger analytical workloads tractable.',
      'Alongside the pipelines I built automated analytical workflows and visualisations for cross-functional research teams, and worked with faculty and collaborators to document workflows and establish shared analytical standards.',
    ],
    outcomes: [
      'Preprocessing and validation run as automated workflows rather than manual notebook steps.',
      'Quality checks catch dataset inconsistencies before they reach analysis.',
      'Documented workflows and analytical standards made results reproducible across the group.',
    ],
    stack: ['Python', 'SQL', 'pandas', 'Distributed processing'],
    role: 'Data Science Analyst, alongside the MS in Data Science.',
    tags: ['Python', 'Reproducibility', 'Research'],
    external: null,
  },
  {
    slug: 'nutriweb',
    num: '06',
    title: 'NutriWeb: matching meals to intent',
    org: 'Personal project',
    period: '2024',
    summary:
      'A dietary recommendation system that reads food descriptions in plain language and ranks options against structured nutrition data.',
    problem:
      'Nutrition datasets are structured; the way people describe what they eat is not. "Something light with protein, no dairy" does not join to a food table, and a recommender that insists on a fixed vocabulary pushes that translation work onto the person asking.',
    approach: [
      'NutriWeb extracts food entities from free text using NLP, then scores and ranks candidates against a structured nutrition dataset using LLM APIs.',
      'The matching layer combines text similarity with nutritional profiling, so a recommendation has to satisfy both what somebody said and what their stated dietary constraints require — constraints are treated as hard filters, not preferences to trade off.',
    ],
    outcomes: [
      'Handles vague, conversational requests without requiring a fixed food vocabulary.',
      'Recommendations respect hard dietary constraints instead of ranking around them.',
      'Built as a testbed for combining retrieval-style matching with LLM scoring.',
    ],
    stack: ['Python', 'NLP', 'LLM APIs', 'scikit-learn', 'pandas'],
    role: 'Solo — design, build and evaluation.',
    tags: ['Python', 'NLP', 'LLM'],
    external: null,
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
