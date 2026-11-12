import type { ReactNode } from 'react';

/**
 * Deliberately small syntax highlighter.
 *
 * It returns React elements (never raw HTML), so highlighted source can
 * never become markup. Enough fidelity for short illustrative snippets
 * without pulling a 200kB highlighting library onto the page.
 */

const KEYWORDS: Record<string, string[]> = {
  python: [
    'from', 'import', 'def', 'return', 'if', 'elif', 'else', 'for', 'in', 'with',
    'as', 'lambda', 'not', 'and', 'or', 'True', 'False', 'None', 'class', 'raise',
  ],
  sql: [
    'create', 'or', 'replace', 'table', 'using', 'cluster', 'by', 'as', 'select',
    'from', 'join', 'left', 'inner', 'on', 'and', 'where', 'cast', 'coalesce',
    'max', 'min', 'timestamp', 'delta', 'group', 'order', 'having', 'with', 'case',
    'when', 'then', 'end', 'date', 'distinct',
  ],
  yaml: [
    'stage', 'stages', 'dependsOn', 'condition', 'jobs', 'deployment', 'environment',
    'strategy', 'runOnce', 'deploy', 'steps', 'template', 'parameters', 'workspace',
    'keyVault', 'succeeded',
  ],
};

const TOKEN =
  /(#[^\n]*|--[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|f"(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)/g;

export function highlight(code: string, lang: string): ReactNode[] {
  const keywords = new Set(KEYWORDS[lang] ?? []);
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const m of code.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(code.slice(last, i));

    const [raw, comment, str, num, ident] = m;

    if (comment) {
      out.push(<span key={key++} className="text-fg-faint italic">{raw}</span>);
    } else if (str) {
      out.push(<span key={key++} className="text-gold">{raw}</span>);
    } else if (num) {
      out.push(<span key={key++} className="text-bronze">{raw}</span>);
    } else if (ident && keywords.has(lang === 'sql' ? ident.toLowerCase() : ident)) {
      out.push(<span key={key++} className="text-accent">{raw}</span>);
    } else {
      out.push(raw);
    }
    last = i + raw.length;
  }

  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({ code, lang, label }: { code: string; lang: string; label?: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-canvas">
      {label && (
        <figcaption className="flex items-center justify-between border-b border-line bg-panel-2 px-4 py-2">
          <span className="font-mono text-[11px] text-fg-dim">{label}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-fg-faint">{lang}</span>
        </figcaption>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-fg-dim">
        <code>{highlight(code, lang)}</code>
      </pre>
    </figure>
  );
}
