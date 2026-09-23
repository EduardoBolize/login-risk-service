import type { Decision } from './api';

export const REASON_LABELS: Record<string, string> = {
  NEW_DEVICE: 'Device novo',
  IMPOSSIBLE_TRAVEL: 'Viagem impossível',
  BRUTE_FORCE: 'Força bruta',
  CREDENTIAL_STUFFING: 'Credential stuffing',
};

export const RULE_LABELS: Record<string, string> = {
  brute_force: 'Força bruta',
  credential_stuffing: 'Credential stuffing',
  new_device: 'Device novo',
  impossible_travel: 'Viagem impossível',
};

export const DECISION_STYLES: Record<Decision, { label: string; badge: string; bar: string }> = {
  ALLOW: { label: 'Permitido', badge: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20', bar: 'bg-emerald-500' },
  CHALLENGE: { label: 'MFA', badge: 'bg-amber-100 text-amber-800 ring-amber-600/20', bar: 'bg-amber-500' },
  DENY: { label: 'Bloqueado', badge: 'bg-rose-100 text-rose-800 ring-rose-600/20', bar: 'bg-rose-500' },
};

/** "BR" → 🇧🇷 using regional indicator symbols. */
export function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  if (Math.abs(seconds) < 60) return relative.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, 'hour');
  return relative.format(Math.round(hours / 24), 'day');
}

export const percent = (part: number, total: number) =>
  total === 0 ? '0%' : `${Math.round((part / total) * 100)}%`;
