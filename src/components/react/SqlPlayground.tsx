import { useCallback, useEffect, useRef, useState } from 'react';
import seedSql from '../../data/seed.sql?raw';
import { exampleQueries, schema } from '../../data/queries';

type Phase = 'idle' | 'booting' | 'ready' | 'failed';

interface ResultSet {
  columns: string[];
  types: string[];
  rows: unknown[][];
  ms: number;
  truncated: boolean;
  total: number;
}

const MAX_DISPLAY_ROWS = 500;

/** Short, friendly name for an Arrow type, shown under each column header. */
function shortType(arrowType: string): string {
  if (/^Date/.test(arrowType)) return 'date';
  if (/^Timestamp/.test(arrowType)) return 'timestamp';
  if (/^Bool/.test(arrowType)) return 'boolean';
  if (/^Utf8|^LargeUtf8/.test(arrowType)) return 'varchar';
  if (/^Decimal/.test(arrowType)) return 'decimal';
  if (/^Float|^Double/.test(arrowType)) return 'double';
  if (/^Int|^Uint/.test(arrowType)) return 'integer';
  return arrowType.toLowerCase().slice(0, 12);
}

const isNumericType = (arrowType: string) =>
  /^Int|^Uint|^Float|^Double|^Decimal/.test(arrowType);

/**
 * Arrow returns dates and timestamps as epoch integers, not Date objects,
 * so each column is formatted according to its declared Arrow type rather
 * than by guessing from the value.
 */
function makeFormatter(arrowType: string): (value: unknown) => string {
  const toNum = (v: unknown) => (typeof v === 'bigint' ? Number(v) : Number(v));

  if (/^Date/.test(arrowType)) {
    return (v) => {
      if (v == null) return '∅';
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      const n = toNum(v);
      if (!Number.isFinite(n)) return String(v);
      // Date32 counts days since epoch; Date64 counts milliseconds.
      const ms = Math.abs(n) < 1e8 ? n * 86_400_000 : n;
      return new Date(ms).toISOString().slice(0, 10);
    };
  }

  if (/^Timestamp/.test(arrowType)) {
    const divisor = /NANO/i.test(arrowType) ? 1e6 : /MICRO/i.test(arrowType) ? 1e3 : 1;
    return (v) => {
      if (v == null) return '∅';
      if (v instanceof Date) return v.toISOString().replace('T', ' ').slice(0, 19);
      const n = toNum(v);
      if (!Number.isFinite(n)) return String(v);
      return new Date(n / divisor).toISOString().replace('T', ' ').slice(0, 19);
    };
  }

  return (v) => {
    if (v == null) return '∅';
    if (typeof v === 'bigint') return v.toLocaleString('en-US');
    if (typeof v === 'number') {
      return Number.isInteger(v) ? v.toLocaleString('en-US') : String(v);
    }
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v);
  };
}

export default function SqlPlayground() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [bootMessage, setBootMessage] = useState('');
  const [sql, setSql] = useState(exampleQueries[0].sql);
  const [activeExample, setActiveExample] = useState(exampleQueries[0].id);
  const [result, setResult] = useState<ResultSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const connRef = useRef<any>(null);
  const dbRef = useRef<any>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Tear the worker down if the visitor navigates away mid-session.
  useEffect(() => {
    return () => {
      connRef.current?.close?.();
      dbRef.current?.terminate?.();
    };
  }, []);

  const boot = useCallback(async () => {
    setPhase('booting');
    setError(null);
    try {
      setBootMessage('Fetching DuckDB…');
      const duckdb = await import('@duckdb/duckdb-wasm');

      const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());

      setBootMessage('Starting the engine…');
      // The worker script is cross-origin, so it is wrapped in a blob.
      const workerUrl = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
      );
      const worker = new Worker(workerUrl);
      const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.ERROR);
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      URL.revokeObjectURL(workerUrl);

      setBootMessage('Building the warehouse…');
      const conn = await db.connect();
      for (const statement of seedSql.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
        await conn.query(statement);
      }

      dbRef.current = db;
      connRef.current = conn;
      setPhase('ready');
    } catch (err) {
      setPhase('failed');
      setError(err instanceof Error ? err.message : 'Could not start DuckDB.');
    }
  }, []);

  const run = useCallback(async () => {
    if (!connRef.current || running) return;
    setRunning(true);
    setError(null);
    const started = performance.now();
    try {
      const table = await connRef.current.query(sql);
      const ms = performance.now() - started;
      const columns: string[] = table.schema.fields.map((f: any) => f.name);
      const types: string[] = table.schema.fields.map((f: any) => String(f.type));
      const all = table.toArray();
      const rows = all
        .slice(0, MAX_DISPLAY_ROWS)
        .map((row: any) => columns.map((c) => row[c]));
      setResult({
        columns,
        types,
        rows,
        ms,
        truncated: all.length > MAX_DISPLAY_ROWS,
        total: all.length,
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }, [sql, running]);

  // Run the first example automatically once the engine is up.
  useEffect(() => {
    if (phase === 'ready' && !result && !error) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const onEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void run();
    }
  };

  // One formatter per column, rebuilt only when the result set changes.
  const formatters = (result?.types ?? []).map(makeFormatter);

  const pickExample = (id: string) => {
    const q = exampleQueries.find((x) => x.id === id);
    if (!q) return;
    setActiveExample(id);
    setSql(q.sql);
    setError(null);
    editorRef.current?.focus();
  };

  /* ------------------------------------------------ idle / boot screens */
  if (phase !== 'ready') {
    return (
      <div className="rounded-xl border border-line bg-panel p-7 sm:p-10">
        <div className="label mb-3">In-browser database</div>
        <h2 className="mb-4 max-w-[24ch] text-2xl text-fg">
          A real analytical engine, running on your machine.
        </h2>
        <p className="mb-6 max-w-[62ch] leading-relaxed text-fg-dim">
          This loads DuckDB compiled to WebAssembly, then builds a small star schema of pipeline
          runs and validation results — the telemetry a data platform produces about itself. Nothing
          is sent anywhere: the database is created in this tab and disappears when you close it.
        </p>

        <ul className="mb-8 flex flex-col gap-2 text-sm text-fg-dim">
          {[
            'About 10 MB on first load, from DuckDB’s official CDN.',
            'Fully synthetic data, generated by SQL — no real records.',
            'Six starter queries, and you can write your own.',
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {line}
            </li>
          ))}
        </ul>

        {phase === 'booting' ? (
          <div className="flex items-center gap-3 font-mono text-sm text-accent">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            {bootMessage}
          </div>
        ) : (
          <button
            type="button"
            onClick={boot}
            className="rounded-md bg-accent px-5 py-3 font-mono text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            Load the engine →
          </button>
        )}

        {phase === 'failed' && error && (
          <p className="mt-5 max-w-[60ch] font-mono text-xs leading-relaxed text-fail">
            {error} — this usually means the CDN is blocked on your network. The rest of the site
            works regardless.
          </p>
        )}
      </div>
    );
  }

  /* ------------------------------------------------ the playground */
  return (
    <div className="flex flex-col gap-5">
      {/* examples */}
      <div className="flex flex-wrap gap-2">
        {exampleQueries.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => pickExample(q.id)}
            title={q.blurb}
            className={`rounded-md border px-3 py-2 font-mono text-xs transition-colors ${
              activeExample === q.id
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line bg-panel text-fg-dim hover:border-line-bright hover:text-fg'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_15rem]">
        {/* editor + results */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line bg-panel-2 px-4 py-2">
              <span className="font-mono text-[11px] text-fg-dim">query</span>
              <span className="font-mono text-[10px] text-fg-faint">⌘/Ctrl + ↵ to run</span>
            </div>
            <textarea
              ref={editorRef}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={onEditorKeyDown}
              spellCheck={false}
              aria-label="SQL query editor"
              rows={14}
              className="w-full resize-y bg-canvas p-4 font-mono text-[12.5px] leading-relaxed text-fg-dim focus:outline-none"
            />
            <div className="flex items-center justify-between gap-4 border-t border-line bg-panel-2 px-4 py-2.5">
              <button
                type="button"
                onClick={() => void run()}
                disabled={running}
                className="rounded-md bg-accent px-4 py-2 font-mono text-xs font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {running ? 'Running…' : 'Run query'}
              </button>
              {result && !error && (
                <span className="font-mono text-[11px] text-fg-faint">
                  {result.total.toLocaleString('en-US')} rows · {result.ms.toFixed(1)} ms
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-fail/40 bg-fail/5 p-4">
              <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-fail">
                Query error
              </div>
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap text-fg-dim">
                {error}
              </pre>
            </div>
          )}

          {result && !error && (
            <div className="overflow-hidden rounded-xl border border-line bg-panel">
              <div className="max-h-[28rem] overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-panel-2">
                    <tr>
                      {result.columns.map((c, i) => (
                        <th
                          key={c + i}
                          scope="col"
                          className={`border-b border-line px-3 py-2 font-mono text-[11px] font-medium whitespace-nowrap text-fg-dim ${
                            isNumericType(result.types[i]) ? 'text-right' : 'text-left'
                          }`}
                        >
                          {c}
                          <span className="mt-0.5 block text-[9px] font-normal tracking-wider text-fg-faint uppercase">
                            {shortType(result.types[i])}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="even:bg-canvas/40">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className={`border-b border-line/60 px-3 py-2 font-mono text-[12px] whitespace-nowrap ${
                              cell === null || cell === undefined
                                ? 'text-fg-faint'
                                : isNumericType(result.types[j])
                                  ? 'text-right tabular-nums text-fg'
                                  : 'text-fg-dim'
                            }`}
                          >
                            {formatters[j](cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.rows.length === 0 && (
                <p className="px-4 py-5 font-mono text-xs text-fg-faint">
                  No rows returned.
                </p>
              )}
              {result.truncated && (
                <p className="border-t border-line px-4 py-2.5 font-mono text-[11px] text-fg-faint">
                  Showing first {MAX_DISPLAY_ROWS.toLocaleString('en-US')} of{' '}
                  {result.total.toLocaleString('en-US')} rows.
                </p>
              )}
            </div>
          )}
        </div>

        {/* schema */}
        <aside className="rounded-xl border border-line bg-panel p-4 lg:sticky lg:top-24 lg:max-h-[80vh] lg:self-start lg:overflow-auto">
          <div className="label mb-3">Schema</div>
          <div className="flex flex-col gap-4">
            {schema.map((t) => (
              <div key={t.table}>
                <button
                  type="button"
                  onClick={() => setSql(`SELECT * FROM ${t.table} LIMIT 20;`)}
                  className="block text-left font-mono text-[11.5px] text-accent hover:underline"
                >
                  {t.table}
                </button>
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-fg-faint">{t.grain}</p>
                <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-fg-dim">
                  {t.columns.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
