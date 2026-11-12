/**
 * Starter queries for the SQL playground. Each one is a question somebody
 * actually asks about a data platform, not a syntax demo.
 */

export interface ExampleQuery {
  id: string;
  label: string;
  blurb: string;
  sql: string;
}

export const exampleQueries: ExampleQuery[] = [
  {
    id: 'last-night',
    label: 'What ran last night?',
    blurb: 'The orientation query — every production run for a single day.',
    sql: `-- Every production run on 10 Nov, by layer.
SELECT
    p.layer,
    p.pipeline_name,
    r.status,
    r.rows_out,
    r.duration_seconds AS secs
FROM fact_pipeline_run r
JOIN dim_pipeline    p USING (pipeline_sk)
JOIN dim_environment e USING (env_sk)
WHERE r.date_sk = 20261110
  AND e.env_name = 'prod'
ORDER BY p.layer, p.pipeline_name;`,
  },
  {
    id: 'silent-drop',
    label: 'Find the silent data loss',
    blurb:
      'A run that succeeded while losing 40% of its rows. This is the failure that matters — nothing crashed.',
    sql: `-- Runs that reported success but lost rows against the previous
-- weekday. Weekends are excluded because volume legitimately drops,
-- and rows_out > 0 removes hard failures so only SILENT loss is left.
WITH prod_runs AS (
    SELECT p.pipeline_name, p.pipeline_sk, d.full_date,
           r.date_sk, r.rows_out, r.status
    FROM fact_pipeline_run r
    JOIN dim_pipeline    p USING (pipeline_sk)
    JOIN dim_date        d USING (date_sk)
    JOIN dim_environment e USING (env_sk)
    WHERE e.env_name = 'prod'
      AND NOT d.is_weekend
),
with_prev AS (
    SELECT *,
           lag(rows_out) OVER (PARTITION BY pipeline_sk
                               ORDER BY date_sk) AS prev_rows_out
    FROM prod_runs
)
SELECT
    pipeline_name,
    full_date,
    status,
    prev_rows_out,
    rows_out,
    round(100.0 * (rows_out - prev_rows_out)
          / nullif(prev_rows_out, 0), 1) AS pct_change
FROM with_prev
WHERE prev_rows_out IS NOT NULL
  AND rows_out > 0
ORDER BY pct_change
LIMIT 10;`,
  },
  {
    id: 'root-cause',
    label: 'Root-cause that day',
    blurb: 'Pivot from "a number moved" to "here is the check that caught it".',
    sql: `-- Everything that was not a clean pass on 23 Oct.
SELECT
    e.env_name,
    p.pipeline_name,
    c.check_name,
    c.check_type,
    v.result
FROM fact_validation_result v
JOIN dim_check         c USING (check_sk)
JOIN fact_pipeline_run r USING (run_id)
JOIN dim_pipeline      p USING (pipeline_sk)
JOIN dim_environment   e USING (env_sk)
WHERE v.date_sk = 20261023
  AND v.result <> 'pass'
ORDER BY v.result, e.env_name, p.pipeline_name;`,
  },
  {
    id: 'check-health',
    label: 'Which checks earn their keep',
    blurb: 'Failure rate per check, per layer — the ones that never fire are candidates for removal.',
    sql: `-- Pass rate by check and layer across the whole window.
SELECT
    p.layer,
    c.check_name,
    count(*)                                        AS evaluated,
    count(*) FILTER (WHERE v.result = 'fail')       AS failed,
    count(*) FILTER (WHERE v.result = 'warn')       AS warned,
    round(100.0 * count(*) FILTER (WHERE v.result = 'pass')
          / count(*), 2)                            AS pass_pct
FROM fact_validation_result v
JOIN dim_check         c USING (check_sk)
JOIN fact_pipeline_run r USING (run_id)
JOIN dim_pipeline      p USING (pipeline_sk)
GROUP BY p.layer, c.check_name
HAVING failed > 0
ORDER BY failed DESC, p.layer
LIMIT 15;`,
  },
  {
    id: 'slowest',
    label: 'Where the time goes',
    blurb: 'p95 runtime by layer — which part of the lakehouse to tune next.',
    sql: `-- Duration distribution by layer, production only.
SELECT
    p.layer,
    count(*)                                          AS runs,
    round(avg(r.duration_seconds), 1)                 AS avg_secs,
    round(quantile_cont(r.duration_seconds, 0.50), 1) AS p50_secs,
    round(quantile_cont(r.duration_seconds, 0.95), 1) AS p95_secs,
    max(r.duration_seconds)                           AS max_secs
FROM fact_pipeline_run r
JOIN dim_pipeline    p USING (pipeline_sk)
JOIN dim_environment e USING (env_sk)
WHERE e.env_name = 'prod'
GROUP BY p.layer
ORDER BY p95_secs DESC;`,
  },
  {
    id: 'reliability',
    label: 'Reliability by pipeline',
    blurb: 'Success rate per pipeline — the standing question in any platform review.',
    sql: `-- Success rate and volume per pipeline, production only.
SELECT
    p.pipeline_name,
    p.layer,
    count(*)                                        AS runs,
    count(*) FILTER (WHERE r.status = 'failed')     AS failed,
    round(100.0 * count(*) FILTER (WHERE r.status = 'success')
          / count(*), 1)                            AS success_pct,
    sum(r.rows_out)                                 AS rows_written
FROM fact_pipeline_run r
JOIN dim_pipeline    p USING (pipeline_sk)
JOIN dim_environment e USING (env_sk)
WHERE e.env_name = 'prod'
GROUP BY p.pipeline_name, p.layer
ORDER BY success_pct, runs DESC;`,
  },
];

/** Schema summary rendered beside the editor. */
export const schema: { table: string; grain: string; columns: string[] }[] = [
  {
    table: 'fact_pipeline_run',
    grain: 'one row per pipeline, per environment, per day',
    columns: [
      'run_id', 'pipeline_sk', 'date_sk', 'env_sk', 'started_at',
      'rows_in', 'rows_out', 'status', 'duration_seconds',
    ],
  },
  {
    table: 'fact_validation_result',
    grain: 'one row per check, per run',
    columns: ['run_id', 'check_sk', 'date_sk', 'result', 'observed_value'],
  },
  {
    table: 'dim_pipeline',
    grain: 'one row per pipeline',
    columns: ['pipeline_sk', 'pipeline_name', 'layer', 'kind', 'base_rows', 'owner'],
  },
  {
    table: 'dim_check',
    grain: 'one row per validation rule',
    columns: ['check_sk', 'check_name', 'check_type', 'severity'],
  },
  {
    table: 'dim_date',
    grain: 'one row per day',
    columns: ['date_sk', 'full_date', 'day_name', 'iso_week', 'is_weekend'],
  },
  {
    table: 'dim_environment',
    grain: 'one row per environment',
    columns: ['env_sk', 'env_name'],
  },
];
