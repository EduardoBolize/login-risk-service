import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { type Decision, fetchAssessments, fetchSummary } from './api';
import { AssessmentsTable } from './components/AssessmentsTable';
import { SummaryCards } from './components/SummaryCards';

const REFRESH_MS = 5_000;
const FILTERS: Array<Decision | 'ALL'> = ['ALL', 'ALLOW', 'CHALLENGE', 'DENY'];

export function App() {
  const [filter, setFilter] = useState<Decision | 'ALL'>('ALL');

  const summary = useQuery({ queryKey: ['summary'], queryFn: fetchSummary, refetchInterval: REFRESH_MS });
  const assessments = useQuery({
    queryKey: ['assessments', filter],
    queryFn: () => fetchAssessments(filter === 'ALL' ? undefined : filter),
    refetchInterval: REFRESH_MS,
  });

  const error = summary.error ?? assessments.error;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              🛡️
            </span>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Login Risk Dashboard</h1>
              <p className="text-xs text-slate-500">Avaliações de risco em tempo real</p>
            </div>
          </div>
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`h-2 w-2 rounded-full ${error ? 'bg-rose-500' : 'animate-pulse bg-emerald-500'}`} />
            {error ? 'API indisponível' : 'Ao vivo'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Não foi possível carregar os dados: {error.message}
          </div>
        )}

        <SummaryCards summary={summary.data} />

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Últimas avaliações</h2>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Filtrar por decisão">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  aria-pressed={filter === option}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    filter === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option === 'ALL' ? 'Todas' : option}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            {assessments.isPending ? (
              <p className="px-6 py-12 text-center text-sm text-slate-500">Carregando…</p>
            ) : (
              <AssessmentsTable assessments={assessments.data ?? []} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
