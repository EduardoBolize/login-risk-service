import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Assessment, Summary } from './api';
import { App } from './App';

const summary: Summary = { since: '2026-09-23T00:00:00Z', total: 10, ALLOW: 6, CHALLENGE: 3, DENY: 1 };

const denied: Assessment = {
  id: 'a1',
  userId: 'alice',
  ip: '193.136.0.10',
  deviceId: 'unknown-pc',
  userAgent: null,
  country: 'PT',
  loginSuccess: true,
  score: 80,
  decision: 'DENY',
  reasons: ['NEW_DEVICE', 'IMPOSSIBLE_TRAVEL'],
  ruleResults: [
    { rule: 'new_device', triggered: true, score: 30, reason: 'NEW_DEVICE', details: { knownDevices: 2 } },
    {
      rule: 'impossible_travel',
      triggered: true,
      score: 50,
      reason: 'IMPOSSIBLE_TRAVEL',
      details: { from: 'BR', to: 'PT', speedKmh: 15000 },
    },
    { rule: 'brute_force', triggered: false, score: 0, details: { failures: 0 } },
  ],
  createdAt: new Date().toISOString(),
};

const allowed: Assessment = {
  ...denied,
  id: 'a2',
  userId: 'bob',
  country: 'BR',
  score: 0,
  decision: 'ALLOW',
  reasons: [],
  ruleResults: [],
};

const fetchMock = vi.fn();

function respond(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/summary')) return respond(summary);
      if (url.includes('decision=DENY')) return respond([denied]);
      return respond([denied, allowed]);
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('shows the 24h summary per decision', async () => {
    renderApp();

    expect(await screen.findByText('10')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('lists assessments with decision and translated reasons', async () => {
    renderApp();

    const row = (await screen.findByText('alice')).closest('tr')!;
    expect(within(row).getByText('DENY')).toBeInTheDocument();
    expect(within(row).getByText('Viagem impossível')).toBeInTheDocument();
    expect(within(row).getByText('Device novo')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('sends the API key on every request', async () => {
    renderApp();
    await screen.findByText('alice');

    for (const [, init] of fetchMock.mock.calls) {
      expect(init.headers).toMatchObject({ 'x-api-key': expect.any(String) });
    }
  });

  it('filters by decision', async () => {
    renderApp();
    await screen.findByText('bob');

    await userEvent.click(screen.getByRole('button', { name: 'DENY' }));

    expect(await screen.findByRole('button', { name: 'DENY', pressed: true })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('decision=DENY'), expect.anything());
    await vi.waitFor(() => expect(screen.queryByText('bob')).not.toBeInTheDocument());
  });

  it('expands a row to show the per-rule breakdown', async () => {
    renderApp();

    await userEvent.click(await screen.findByText('alice'));

    expect(screen.getByText('+50')).toBeInTheDocument();
    expect(screen.getByText('15000')).toBeInTheDocument();
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('shows an error banner when the API is unavailable', async () => {
    fetchMock.mockImplementation(() => respond({ message: 'Unauthorized' }, 401));

    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent('API respondeu 401');
    expect(screen.getByText('API indisponível')).toBeInTheDocument();
  });
});
