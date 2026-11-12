/**
 * Data behind the interactive lineage explorer.
 *
 * The code samples are REPRESENTATIVE: they illustrate the pattern used,
 * written for this site. They are not source from any client system.
 */

export type Layer = 'source' | 'bronze' | 'silver' | 'gold' | 'serve';

export interface Stage {
  id: string;
  layer: Layer;
  name: string;
  /** Shown on the node itself. */
  kicker: string;
  tech: string[];
  /** One-paragraph explanation of what this stage is responsible for. */
  purpose: string;
  /** The engineering decisions that matter at this stage. */
  notes: string[];
  code: { lang: string; label: string; body: string };
  /** Validation applied as data leaves this stage. */
  checks: string[];
}

export const layerMeta: Record<Layer, { label: string; token: string }> = {
  source: { label: 'Source', token: 'var(--color-fg-faint)' },
  bronze: { label: 'Bronze', token: 'var(--color-bronze)' },
  silver: { label: 'Silver', token: 'var(--color-silver)' },
  gold: { label: 'Gold', token: 'var(--color-gold)' },
  serve: { label: 'Serve', token: 'var(--color-accent)' },
};

export const stages: Stage[] = [
  {
    id: 'source',
    layer: 'source',
    name: 'Oracle Millennium HealtheIntent',
    kicker: 'System of record',
    tech: ['Oracle', 'JDBC', 'Key Vault'],
    purpose:
      'The clinical and operational system of record being migrated. It is read-only as far as the platform is concerned: the migration never writes back, and extraction is driven by watermark columns so a re-run costs only the new rows.',
    notes: [
      'Credentials resolve from Azure Key Vault through a linked service — nothing is embedded in a notebook.',
      'Extraction is incremental on a watermark so a failed batch can be replayed safely.',
      'The source schema is captured per batch, so a schema change upstream is detectable rather than silent.',
    ],
    code: {
      lang: 'python',
      label: 'Watermarked extract',
      body: `watermark = spark.sql(f"""
    SELECT COALESCE(MAX(_source_modified_at), TIMESTAMP '1900-01-01')
    FROM bronze.{table}
""").first()[0]

extract_sql = f"""
    SELECT * FROM {source_schema}.{table}
    WHERE modified_at > TIMESTAMP '{watermark}'
"""`,
    },
    checks: [
      'Source reachable and credential resolves from Key Vault',
      'Watermark is monotonic — never moves backwards',
    ],
  },
  {
    id: 'bronze',
    layer: 'bronze',
    name: 'Raw landing',
    kicker: 'ADLS Gen2 · Delta',
    tech: ['ADLS Gen2', 'Delta Lake', 'PySpark'],
    purpose:
      'An append-only, unmodified copy of what the source actually sent, with audit columns attached. Bronze exists so that every downstream layer can be rebuilt without touching the source system again — which is what makes a bad transformation recoverable instead of permanent.',
    notes: [
      'No business logic here. Casting, renaming and deduplication all belong downstream.',
      'Audit columns record ingestion time, source system and batch id so any row can be traced to the run that produced it.',
      'Append-only: a re-run adds a batch rather than overwriting history.',
    ],
    code: {
      lang: 'python',
      label: 'Land raw with audit columns',
      body: `(spark.read
    .format("jdbc")
    .option("url", source_url)          # from Key Vault linked service
    .option("dbtable", f"({extract_sql}) src")
    .load()
    .withColumn("_ingested_at",   F.current_timestamp())
    .withColumn("_source_system", F.lit("millennium_healtheintent"))
    .withColumn("_batch_id",      F.lit(batch_id))
    .write
    .format("delta")
    .mode("append")
    .save(f"abfss://bronze@{account}.dfs.core.windows.net/{table}"))`,
    },
    checks: [
      'Row count landed matches rows read from source',
      'Batch id present and unique for the run',
      'Schema drift vs. previous batch is reported, not swallowed',
    ],
  },
  {
    id: 'silver',
    layer: 'silver',
    name: 'Conformed + history',
    kicker: 'PySpark · SCD tracking',
    tech: ['PySpark', 'Delta Lake', 'SCD'],
    purpose:
      'Where raw becomes trustworthy. Types are enforced, codes are conformed across source systems, duplicates collapse to one row per business key — and changes are tracked over time rather than overwritten, so you can ask what a record looked like when a decision was made.',
    notes: [
      'A row hash drives change detection, so an unchanged record does not create a new version.',
      'SCD-style tracking closes the previous version and opens a new one, preserving point-in-time state.',
      'Conforming happens here so that Gold never has to know which source a field came from.',
    ],
    code: {
      lang: 'python',
      label: 'History-preserving merge',
      body: `from delta.tables import DeltaTable

silver = DeltaTable.forPath(spark, silver_path)

(silver.alias("t")
    .merge(
        staged.alias("s"),
        "t.encounter_id = s.encounter_id AND t.is_current = true")
    .whenMatchedUpdate(
        condition = "t.row_hash <> s.row_hash",
        set = {
            "is_current": "false",
            "valid_to":   "s._ingested_at",
        })
    .whenNotMatchedInsertAll()
    .execute())`,
    },
    checks: [
      'Exactly one current row per business key',
      'No nulls in business keys or effective-dating columns',
      'Version intervals are contiguous and non-overlapping',
    ],
  },
  {
    id: 'gold',
    layer: 'gold',
    name: 'Serving models',
    kicker: 'Star schemas · Synapse',
    tech: ['Azure Synapse', 'Delta Lake', 'T-SQL'],
    purpose:
      'Dimensional models built for the questions people actually ask. Facts and conformed dimensions, clustered on the columns real queries filter by, so consumers can query interactively instead of maintaining their own pre-aggregated extracts.',
    notes: [
      'Liquid clustering on the columns queries actually filter by — usually date and facility.',
      'Z-order indexing co-locates related values so large scans read fewer files.',
      'Conformed dimensions are shared, so two teams counting the same thing get the same number.',
    ],
    code: {
      lang: 'sql',
      label: 'Fact table with liquid clustering',
      body: `CREATE OR REPLACE TABLE gold.fact_encounter
USING DELTA
CLUSTER BY (encounter_date_sk, facility_sk)
AS
SELECT
    e.encounter_sk,
    d.date_sk            AS encounter_date_sk,
    f.facility_sk,
    p.patient_sk,
    e.length_of_stay_hours,
    e.disposition_code
FROM silver.encounter      e
JOIN gold.dim_date         d ON d.date_key    = CAST(e.admitted_at AS DATE)
JOIN gold.dim_facility     f ON f.facility_id = e.facility_id
JOIN gold.dim_patient      p ON p.patient_id  = e.patient_id
                            AND p.is_current;`,
    },
    checks: [
      'Every fact foreign key resolves to a dimension row',
      'Grain is unique — no accidental fan-out from a join',
      'Measure totals reconcile against the Silver layer',
    ],
  },
  {
    id: 'serve',
    layer: 'serve',
    name: 'Consumers',
    kicker: 'Analysts · reporting',
    tech: ['Synapse SQL', 'Reporting'],
    purpose:
      'The point of the whole exercise. Analysts and operational reporting query the Gold layer directly, with access scoped through RBAC rather than copies handed around, and every release validated before it reaches them.',
    notes: [
      'Access is granted on the serving layer through RBAC, not by distributing extracts.',
      'A release only reaches consumers after automated validation and UAT sign-off.',
      'Structured logs make it possible to answer why a number changed between runs.',
    ],
    code: {
      lang: 'yaml',
      label: 'Gated promotion to production',
      body: `- stage: promote_production
  dependsOn: validate_staging
  condition: succeeded()
  jobs:
    - deployment: synapse_prod
      environment: production      # approval gate lives here
      strategy:
        runOnce:
          deploy:
            steps:
              - template: templates/deploy-synapse.yml
                parameters:
                  workspace: $(synapseWorkspaceProd)
                  keyVault:  $(keyVaultProd)
              - template: templates/run-validation.yml`,
    },
    checks: [
      'Validation suite green across all layers',
      'UAT sign-off recorded for the release',
      'Production approval gate satisfied in Azure DevOps',
    ],
  },
];

/** Cross-cutting concerns that apply to every stage above. */
export const crossCutting = [
  {
    name: 'CI/CD',
    detail: 'Every stage deploys from one YAML definition across dev, staging and production.',
  },
  {
    name: 'Observability',
    detail: 'Structured logging, execution tracking and auditing on each run.',
  },
  {
    name: 'Validation',
    detail: 'Schema, row-count and reconciliation checks gate promotion between layers.',
  },
  {
    name: 'Secrets',
    detail: 'All credentials resolve from Key Vault through linked services.',
  },
];
