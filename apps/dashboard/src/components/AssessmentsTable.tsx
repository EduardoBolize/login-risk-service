import { Fragment, useState } from 'react';
import type { Assessment } from '../api';
import { DECISION_STYLES, REASON_LABELS, RULE_LABELS, countryFlag, timeAgo } from '../format';
import { DecisionBadge } from './DecisionBadge';

export function AssessmentsTable({ assessments }: { assessments: Assessment[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (assessments.length === 0) {
    return <p className="px-6 py-12 text-center text-sm text-slate-500">Nenhuma avaliação encontrada.</p>;
  }

  return (
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-4 py-3">Quando</th>
          <th className="px-4 py-3">Usuário</th>
          <th className="px-4 py-3">Origem</th>
          <th className="px-4 py-3">Credencial</th>
          <th className="px-4 py-3">Score</th>
          <th className="px-4 py-3">Decisão</th>
          <th className="px-4 py-3">Motivos</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {assessments.map((assessment) => {
          const expanded = expandedId === assessment.id;
          return (
            <Fragment key={assessment.id}>
              <tr
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => setExpandedId(expanded ? null : assessment.id)}
                aria-expanded={expanded}
              >
                <td className="whitespace-nowrap px-4 py-3 text-slate-500" title={assessment.createdAt}>
                  {timeAgo(assessment.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{assessment.userId}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  <span className="mr-1.5">{countryFlag(assessment.country)}</span>
                  <span className="font-mono text-xs">{assessment.ip}</span>
                </td>
                <td className="px-4 py-3">
                  {assessment.loginSuccess ? (
                    <span className="text-slate-600">válida</span>
                  ) : (
                    <span className="text-rose-600">inválida</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ScoreBar score={assessment.score} barClass={DECISION_STYLES[assessment.decision].bar} />
                </td>
                <td className="px-4 py-3">
                  <DecisionBadge decision={assessment.decision} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {assessment.reasons.map((reason) => (
                      <span key={reason} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                        {REASON_LABELS[reason] ?? reason}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
              {expanded && (
                <tr className="bg-slate-50">
                  <td colSpan={7} className="px-4 py-4">
                    <RuleBreakdown assessment={assessment} />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function ScoreBar({ score, barClass }: { score: number; barClass: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${barClass}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-7 text-right tabular-nums text-slate-700">{score}</span>
    </div>
  );
}

function RuleBreakdown({ assessment }: { assessment: Assessment }) {
  return (
    <div>
      <p className="mb-3 text-xs text-slate-500">
        Device <span className="font-mono">{assessment.deviceId}</span>
        {assessment.userAgent && <> · {assessment.userAgent}</>}
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {assessment.ruleResults.map((result) => (
          <div
            key={result.rule}
            className={`rounded-lg border p-3 ${result.triggered ? 'border-rose-200 bg-white' : 'border-slate-200 bg-white/60'}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-800">{RULE_LABELS[result.rule] ?? result.rule}</span>
              <span className={`text-xs font-semibold ${result.triggered ? 'text-rose-600' : 'text-slate-400'}`}>
                {result.triggered ? `+${result.score}` : 'ok'}
              </span>
            </div>
            {result.details && (
              <dl className="mt-2 space-y-0.5 text-xs text-slate-500">
                {Object.entries(result.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <dt>{key}</dt>
                    <dd className="font-mono text-slate-700">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
