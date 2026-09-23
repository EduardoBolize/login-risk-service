import type { Decision, Summary } from '../api';
import { DECISION_STYLES, percent } from '../format';

const DECISIONS: Decision[] = ['ALLOW', 'CHALLENGE', 'DENY'];

export function SummaryCards({ summary }: { summary?: Summary }) {
  const total = summary?.total ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card title="Avaliações (24h)" value={summary ? total : '—'} />
      {DECISIONS.map((decision) => {
        const count = summary?.[decision] ?? 0;
        const style = DECISION_STYLES[decision];
        return (
          <Card
            key={decision}
            title={`${decision} · ${style.label}`}
            value={summary ? count : '—'}
            footer={
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full ${style.bar}`} style={{ width: percent(count, total) }} />
                </div>
                <span className="text-xs text-slate-500">{percent(count, total)}</span>
              </div>
            }
          />
        );
      })}
    </div>
  );
}

function Card({ title, value, footer }: { title: string; value: number | string; footer?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
      {footer}
    </div>
  );
}
