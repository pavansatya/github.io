import { useRef, useState } from 'react';
import type { Stage, Layer } from '../../data/pipeline';
import { CodeBlock } from './highlight';

interface Props {
  stages: Stage[];
  crossCutting: { name: string; detail: string }[];
}

const LAYER_COLOR: Record<Layer, string> = {
  source: 'var(--color-fg-faint)',
  bronze: 'var(--color-bronze)',
  silver: 'var(--color-silver)',
  gold: 'var(--color-gold)',
  serve: 'var(--color-accent)',
};

export default function PipelineExplorer({ stages, crossCutting }: Props) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = stages[active];

  // Roving tabindex: arrow keys move between stages, as a tablist should.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (active + delta + stages.length) % stages.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      {/* stage selector */}
      <div
        role="tablist"
        aria-label="Pipeline stages"
        onKeyDown={onKeyDown}
        className="flex gap-2 overflow-x-auto border-b border-line bg-panel-2 p-3"
      >
        {stages.map((s, i) => {
          const selected = i === active;
          return (
            <div key={s.id} className="flex shrink-0 items-center gap-2">
              <button
                ref={(el) => { tabRefs.current[i] = el; }}
                role="tab"
                id={`stage-tab-${s.id}`}
                aria-selected={selected}
                aria-controls={`stage-panel-${s.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={`min-w-[8.5rem] rounded-lg border p-3 text-left transition-colors ${
                  selected
                    ? 'border-line-bright bg-canvas'
                    : 'border-transparent bg-transparent hover:bg-canvas/60'
                }`}
              >
                <span
                  className="mb-2 block h-1 w-9 rounded-full"
                  style={{ background: LAYER_COLOR[s.layer], opacity: selected ? 1 : 0.45 }}
                />
                <span
                  className={`block font-mono text-[10px] uppercase tracking-wider ${
                    selected ? 'text-fg-dim' : 'text-fg-faint'
                  }`}
                >
                  {s.kicker}
                </span>
                <span
                  className={`mt-1 block text-[13px] leading-snug ${
                    selected ? 'text-fg' : 'text-fg-dim'
                  }`}
                >
                  {s.name}
                </span>
              </button>
              {i < stages.length - 1 && (
                <span aria-hidden="true" className="font-mono text-fg-faint">→</span>
              )}
            </div>
          );
        })}
      </div>

      {/* detail */}
      <div
        role="tabpanel"
        id={`stage-panel-${stage.id}`}
        aria-labelledby={`stage-tab-${stage.id}`}
        className="p-5 sm:p-7"
      >
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {stage.tech.map((t) => (
            <span
              key={t}
              className="rounded border border-line bg-canvas px-2 py-1 font-mono text-[11px] text-fg-dim"
            >
              {t}
            </span>
          ))}
        </div>

        <p className="mb-7 max-w-[68ch] leading-relaxed text-fg-dim">{stage.purpose}</p>

        <div className="mb-7 grid gap-7 lg:grid-cols-2">
          <div>
            <div className="label mb-3">Decisions that matter here</div>
            <ul className="flex flex-col gap-2.5">
              {stage.notes.map((n) => (
                <li key={n} className="flex gap-3 text-sm leading-relaxed text-fg-dim">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: LAYER_COLOR[stage.layer] }}
                  />
                  {n}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="label mb-3">Checks before data moves on</div>
            <ul className="flex flex-col gap-2.5">
              {stage.checks.map((c) => (
                <li key={c} className="flex gap-3 text-sm leading-relaxed text-fg-dim">
                  <span aria-hidden="true" className="mt-px font-mono text-xs text-pass">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <CodeBlock code={stage.code.body} lang={stage.code.lang} label={stage.code.label} />

        <p className="mt-3 font-mono text-[11px] leading-relaxed text-fg-faint">
          Representative code — illustrates the pattern, written for this site. Not source from any
          client system.
        </p>
      </div>

      {/* cross-cutting */}
      <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {crossCutting.map((c) => (
          <div key={c.name} className="bg-panel p-4">
            <div className="label mb-1.5">{c.name}</div>
            <p className="text-xs leading-relaxed text-fg-dim">{c.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
