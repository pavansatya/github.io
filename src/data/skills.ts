/**
 * Skills, grouped the way the résumé groups them so the two never drift.
 * `headline` entries are the ones surfaced on the home page marquee.
 */

export interface SkillGroup {
  id: string;
  label: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'cloud',
    label: 'Cloud platforms',
    items: [
      'Microsoft Azure',
      'Azure Synapse Analytics',
      'Azure Databricks',
      'ADLS Gen2',
      'Azure Data Factory',
      'Azure Key Vault',
      'Microsoft Fabric',
      'AWS',
      'GCP',
    ],
  },
  {
    id: 'devops',
    label: 'DevOps & CI/CD',
    items: [
      'Azure DevOps',
      'Azure Pipelines',
      'YAML pipelines',
      'Build & release pipelines',
      'Deployment automation',
      'Environment management',
      'Git',
      'GitHub',
    ],
  },
  {
    id: 'infra',
    label: 'Infrastructure & administration',
    items: [
      'Workspace administration',
      'Spark pool management',
      'Storage account management',
      'Access control / RBAC',
      'Service connections',
      'Linked services',
      'Key Vault integration',
    ],
  },
  {
    id: 'languages',
    label: 'Languages & scripting',
    items: ['Python', 'PySpark', 'SQL', 'T-SQL', 'PL/SQL', 'Bash', 'PowerShell'],
  },
  {
    id: 'distributed',
    label: 'Distributed computing',
    items: [
      'Apache Spark',
      'Databricks',
      'Delta Lake',
      'Unity Catalog',
      'Distributed processing',
      'Containerization',
    ],
  },
  {
    id: 'observability',
    label: 'Monitoring & observability',
    items: [
      'Azure Monitor',
      'Azure Log Analytics',
      'Structured logging',
      'Pipeline monitoring',
      'Execution auditing',
      'Error handling',
      'Performance monitoring',
    ],
  },
  {
    id: 'architecture',
    label: 'Data architecture',
    items: [
      'Medallion architecture',
      'Lakehouse architecture',
      'Data warehousing',
      'ETL / ELT',
      'Dimensional modeling',
      'Delta Lake optimization',
    ],
  },
  {
    id: 'practice',
    label: 'Ways of working',
    items: [
      'Agile / Scrum',
      'Version control',
      'Code reviews',
      'Release management',
      'Technical documentation',
      'Data governance',
    ],
  },
];

/** The short list used in the hero — chosen for recognition, not completeness. */
export const headlineSkills: string[] = [
  'Azure Synapse',
  'Databricks',
  'Delta Lake',
  'PySpark',
  'Azure DevOps',
  'Unity Catalog',
  'T-SQL',
  'Python',
  'ADLS Gen2',
  'Medallion',
];
