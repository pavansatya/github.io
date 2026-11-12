-- ---------------------------------------------------------------------
-- Synthetic pipeline-telemetry warehouse.
--
-- Entirely generated: no real data from any system. It models the thing
-- I actually build -- run telemetry and validation results for a
-- medallion lakehouse -- as a small star schema you can query.
--
-- setseed() makes every visitor see identical numbers.
-- ---------------------------------------------------------------------

SELECT setseed(0.42);

-- -------------------------------------------------- dimensions

CREATE TABLE dim_pipeline (
    pipeline_sk   INTEGER,
    pipeline_name VARCHAR,
    layer         VARCHAR,
    kind          VARCHAR,
    base_rows     INTEGER,
    owner         VARCHAR
);

INSERT INTO dim_pipeline VALUES
    (1, 'bronze_encounter_land',      'bronze', 'ingest',    420000, 'platform'),
    (2, 'bronze_patient_land',        'bronze', 'ingest',     98000, 'platform'),
    (3, 'bronze_lab_result_land',     'bronze', 'ingest',    760000, 'platform'),
    (4, 'silver_encounter_conform',   'silver', 'transform', 415000, 'platform'),
    (5, 'silver_patient_scd',         'silver', 'transform',  97000, 'platform'),
    (6, 'silver_lab_result_conform',  'silver', 'transform', 752000, 'platform'),
    (7, 'gold_fact_encounter',        'gold',   'model',     410000, 'analytics'),
    (8, 'gold_dim_patient',           'gold',   'model',      96500, 'analytics'),
    (9, 'gold_measure_summary',       'gold',   'model',      12400, 'analytics');

CREATE TABLE dim_environment (env_sk INTEGER, env_name VARCHAR);
INSERT INTO dim_environment VALUES (1, 'dev'), (2, 'staging'), (3, 'prod');

CREATE TABLE dim_date AS
SELECT
    CAST(strftime(d, '%Y%m%d') AS INTEGER)      AS date_sk,
    CAST(d AS DATE)                             AS full_date,
    dayname(d)                                  AS day_name,
    CAST(strftime(d, '%V') AS INTEGER)          AS iso_week,
    dayofweek(d) IN (0, 6)                      AS is_weekend
FROM generate_series(DATE '2026-08-15', DATE '2026-11-11', INTERVAL 1 DAY) AS t(d);

CREATE TABLE dim_check (
    check_sk   INTEGER,
    check_name VARCHAR,
    check_type VARCHAR,
    severity   VARCHAR
);

INSERT INTO dim_check VALUES
    (1, 'row_count_vs_source',     'reconciliation', 'fail'),
    (2, 'row_count_delta_pct',     'anomaly',        'fail'),
    (3, 'business_key_not_null',   'schema',         'fail'),
    (4, 'business_key_unique',     'schema',         'fail'),
    (5, 'referential_integrity',   'referential',    'fail'),
    (6, 'schema_drift',            'schema',         'warn'),
    (7, 'null_rate_within_bounds', 'profiling',      'warn'),
    (8, 'freshness_within_sla',    'freshness',      'warn');

-- -------------------------------------------------- facts

-- One run per pipeline per day in prod; staging only for the last six weeks.
CREATE TABLE fact_pipeline_run AS
WITH grid AS (
    SELECT p.pipeline_sk, p.base_rows, p.layer, p.pipeline_name,
           d.date_sk, d.full_date, d.is_weekend,
           e.env_sk, e.env_name
    FROM dim_pipeline p
    CROSS JOIN dim_date d
    CROSS JOIN dim_environment e
    WHERE e.env_name = 'prod'
       OR (e.env_name = 'staging' AND d.full_date >= DATE '2026-10-01')
),
shaped AS (
    SELECT
        row_number() OVER (ORDER BY date_sk, pipeline_sk, env_sk) AS run_id,
        pipeline_sk,
        date_sk,
        env_sk,
        full_date,
        pipeline_name,
        layer,
        -- weekends are quieter; prod carries full volume, staging a sample
        CAST(base_rows
             * (CASE WHEN is_weekend THEN 0.55 ELSE 1.0 END)
             * (CASE WHEN env_name = 'prod' THEN 1.0 ELSE 0.12 END)
             * (0.94 + 0.12 * random()) AS BIGINT) AS rows_in,
        random() AS r_status,
        random() AS r_drop,
        random() AS r_dur
    FROM grid
)
SELECT
    run_id,
    pipeline_sk,
    date_sk,
    env_sk,
    full_date + INTERVAL (2) HOUR + INTERVAL (CAST(r_dur * 90 AS INTEGER)) MINUTE AS started_at,
    rows_in,
    -- the planted incident: encounter conform drops ~40% of rows on 23 Oct
    CASE
        WHEN pipeline_sk = 4 AND date_sk = 20261023 THEN CAST(rows_in * 0.58 AS BIGINT)
        WHEN r_status < 0.035                       THEN 0
        ELSE CAST(rows_in * (0.985 + 0.014 * r_drop) AS BIGINT)
    END AS rows_out,
    CASE
        WHEN pipeline_sk = 4 AND date_sk = 20261023 THEN 'success'
        WHEN r_status < 0.035                       THEN 'failed'
        WHEN r_status < 0.095                       THEN 'warning'
        ELSE 'success'
    END AS status,
    CAST(
        (CASE layer WHEN 'bronze' THEN 180 WHEN 'silver' THEN 420 ELSE 240 END)
        * (0.7 + 0.9 * r_dur)
        * (CASE WHEN pipeline_sk = 4 AND date_sk = 20261023 THEN 2.4 ELSE 1.0 END)
    AS INTEGER) AS duration_seconds
FROM shaped;

-- Each run is checked; the planted incident fails its delta check.
CREATE TABLE fact_validation_result AS
WITH pairs AS (
    SELECT r.run_id, r.pipeline_sk, r.date_sk, r.status AS run_status,
           c.check_sk, c.severity,
           random() AS r_check
    FROM fact_pipeline_run r
    CROSS JOIN dim_check c
)
SELECT
    run_id,
    check_sk,
    date_sk,
    CASE
        WHEN pipeline_sk = 4 AND date_sk = 20261023 AND check_sk = 2 THEN 'fail'
        WHEN run_status = 'failed'  AND check_sk = 1                 THEN 'fail'
        WHEN run_status = 'warning' AND check_sk IN (6, 7, 8) AND r_check < 0.45 THEN 'warn'
        WHEN r_check < 0.006 AND severity = 'fail'                   THEN 'fail'
        WHEN r_check < 0.030 AND severity = 'warn'                   THEN 'warn'
        ELSE 'pass'
    END AS result,
    round(r_check, 4) AS observed_value
FROM pairs;
