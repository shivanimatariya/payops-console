import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, StatCard, PageHeader, EmptyState, Modal } from '../components/ui.jsx';
import { IconCheckCircle, IconXCircle, IconAlertTriangle, IconAlertCircle, IconClock, IconSearch, IconChevronLeft, IconChevronRight, IconActivity, IconShieldCheck, IconBarChart, IconTrendingUp } from '../components/icons.jsx';
import { api, auth } from '../lib/apexApi.js';

const REF = new Date('2025-06-12T12:00:00Z').getTime();
const DAY_MS = 86400000;
const TOTAL_TXNS = 480;
const TREND = [96.2, 96.8, 95.9, 97.1, 97.4, 96.5, 95.8, 96.9, 97.6, 96.7, 96.3, 97.0, 96.4];
const money = (n) => '$' + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (d) => String(d ?? '').substring(0, 10);
const stamp = (d) => String(d ?? '').replace('T', ' ').substring(0, 16);
const r2 = (v) => Math.round(v * 100) / 100;
const pad = (n) => String(n).padStart(2, '0');
const kindOf = (r) => { const s = String(r?.reason_code ?? '').toLowerCase(); return s.includes('timing') ? 'timing' : s.includes('fee') ? 'fee' : s.includes('dup') ? 'dup' : 'missing'; };
const needsReview = (r) => r.status === 'Open' || r.status === 'Investigating';
const KIND_LABEL = { timing: 'Timing difference', fee: 'Fee mismatch', dup: 'Duplicate charge', missing: 'Missing record' };
const KIND_STYLE = { timing: 'bg-primary-50 text-primary-700 border-primary-200', fee: 'bg-amber-50 text-amber-700 border-amber-200', dup: 'bg-rose-50 text-rose-700 border-rose-200', missing: 'bg-slate-100 text-slate-700 border-slate-200' };
const STATUS_STYLE = {
  Open: ['bg-slate-100 text-slate-700 border-slate-200', IconClock],
  Investigating: ['bg-amber-50 text-amber-700 border-amber-200', IconAlertTriangle],
  Resolved: ['bg-emerald-50 text-emerald-700 border-emerald-200', IconCheckCircle],
  Rejected: ['bg-rose-50 text-rose-700 border-rose-200', IconXCircle],
};
const SIDE_STATE = {
  match: ['Matches', 'bg-emerald-50 text-emerald-700 border-emerald-200', IconCheckCircle],
  differs: ['Differs', 'bg-amber-50 text-amber-700 border-amber-200', IconAlertTriangle],
  missing: ['Missing', 'bg-rose-50 text-rose-700 border-rose-200', IconXCircle],
  duplicate: ['Duplicate', 'bg-rose-50 text-rose-700 border-rose-200', IconAlertCircle],
};
const DOT = { match: 'bg-emerald-500', differs: 'bg-amber-500', missing: 'bg-rose-500', duplicate: 'bg-rose-500' };
const ACTIONS = {
  approve: { action: 'Approve adjustment', logText: 'Approved adjustment', status: 'Resolved', tone: 'success', busy: 'Approving…', reason: (r) => r.proposed_fix || 'Adjustment approved by reviewer.', done: (r) => 'Adjustment approved for ' + r.transaction_id + '. Added to the activity log.' },
  reject: { action: 'Reject', logText: 'Rejected proposed fix', status: 'Rejected', tone: 'danger', busy: 'Rejecting…', reason: () => 'Reviewer did not accept the proposed fix.', done: (r) => 'Proposed fix rejected for ' + r.transaction_id + '. Added to the activity log.' },
  flag: { action: 'Flag for investigation', logText: 'Flagged for investigation', status: 'Investigating', tone: 'warning', busy: 'Flagging…', reason: () => 'Needs a deeper look before any adjustment.', done: (r) => r.transaction_id + ' flagged for investigation. Added to the activity log.' },
};

function gen(i) {
  const n = 8842 + i;
  const tx = 'TXN-' + n;
  const a = (8000 + ((i * 173) % 1400) * 100 + (i % 5) * 25) / 100;
  const d = 3 + (i % 9);
  const base = { id: 'EXC-' + n, transaction_id: tx, amount: a, currency: 'USD', opened_at: '2025-06-' + pad(d) + 'T' + pad(6 + (i % 15)) + ':20:00Z', status: i % 3 === 2 ? 'Resolved' : i % 5 === 1 ? 'Investigating' : 'Open' };
  const k = i % 4;
  if (k === 0) return { ...base, variance_amount: a, source: i % 8 < 4 ? 'bank' : 'processor', reason_code: 'Timing difference', processor_record: 'Capture ' + tx + ' for ' + money(a) + ' on 2025-06-' + pad(d), bank_record: 'Deposit of ' + money(a) + ' posted 2025-06-' + pad(d + 1), ledger_record: 'Cash entry of ' + money(a) + ' dated 2025-06-' + pad(d), explanation: 'The bank posted the deposit one day after the processor settlement date. Amounts match and the gap is within the normal 1-day window.', proposed_fix: 'Match records and mark timing difference as resolved' };
  if (k === 1) { const x = r2(a * 0.029 + 0.3); const y = r2(x / 2); const v = r2(x - y); const net = r2(a - x); const m = r2(a - y); return { ...base, variance_amount: v, source: 'processor', reason_code: 'Fee mismatch', processor_record: 'Gross ' + money(a) + ', fee ' + money(x) + ', net ' + money(net), bank_record: 'Deposit net ' + money(net), ledger_record: 'Gross ' + money(a) + ', fee ' + money(y) + ', net ' + money(m), explanation: 'The processor applied a ' + money(x) + ' fee (cross-border card surcharge) but the ledger booked only ' + money(y) + ', leaving a ' + money(v) + ' gap against the bank deposit.', proposed_fix: 'Post adjustment entry of ' + money(v) + ' to the fees account' }; }
  if (k === 2) return { ...base, variance_amount: a, source: 'processor', reason_code: 'Duplicate charge', processor_record: 'Duplicate capture: 2 charges of ' + money(a) + ' within 60 seconds for ' + tx, bank_record: 'Both deposits of ' + money(a) + ' settled 2025-06-' + pad(d), ledger_record: 'Single sale entry of ' + money(a), explanation: 'The customer was charged twice for the same order, most likely from a double-click at checkout. The second charge has no matching sale in the ledger.', proposed_fix: 'Refund duplicate charge of ' + money(a) + ' to the customer' };
  if (Math.floor(i / 4) % 2 === 0) return { ...base, variance_amount: a, source: 'ledger', reason_code: 'Missing record', processor_record: 'Capture ' + tx + ' for ' + money(a) + ' settled 2025-06-' + pad(d), bank_record: 'Deposit of ' + money(a) + ' received 2025-06-' + pad(d), ledger_record: 'No entry found', explanation: 'Processor and bank agree, but the ledger sync job never created an entry for this transaction.', proposed_fix: 'Post missing revenue entry of ' + money(a) + ' to the sales account' };
  return { ...base, variance_amount: a, source: 'bank', reason_code: 'Missing record', processor_record: 'Capture ' + tx + ' for ' + money(a) + ' settled 2025-06-' + pad(d), bank_record: 'No deposit found after 3 business days', ledger_record: 'Receivable of ' + money(a) + ' booked 2025-06-' + pad(d), explanation: 'The processor settled and the ledger booked a receivable, but no bank deposit has arrived after 3 business days.', proposed_fix: 'Open a settlement trace with the bank for ' + money(a) };
}

const SEED = [
  { id: 'EXC-8836', transaction_id: 'TXN-8836', amount: 98.0, variance_amount: 98.0, currency: 'USD', source: 'ledger', reason_code: 'Missing record', processor_record: 'Capture TXN-8836 for $98.00 settled 2025-06-09', bank_record: 'Deposit of $98.00 received 2025-06-10 (batch BK-20250610-02)', ledger_record: 'No entry found', explanation: 'Processor and bank agree, but no ledger entry was created. The sync job logged a timeout for this transaction on 2025-06-09.', proposed_fix: 'Post missing revenue entry of $98.00 to the sales account', status: 'Investigating', opened_at: '2025-06-09T22:10:00Z' },
  { id: 'EXC-8837', transaction_id: 'TXN-8837', amount: 760.25, variance_amount: 760.25, currency: 'USD', source: 'processor', reason_code: 'Timing difference', processor_record: 'Capture TXN-8837 for $760.25 on 2025-06-11 23:52 UTC', bank_record: 'Not yet received (expected in 2025-06-13 settlement)', ledger_record: 'Receivable of $760.25 booked 2025-06-11', explanation: 'Capture occurred just before the daily cut-off, so funds fall into the next settlement batch. Expected to match within 1 business day.', proposed_fix: 'Mark as timing difference and auto-match on next settlement', status: 'Open', opened_at: '2025-06-12T00:15:00Z' },
  { id: 'EXC-8838', transaction_id: 'TXN-8838', amount: 1320.0, variance_amount: 1320.0, currency: 'USD', source: 'bank', reason_code: 'Timing difference', processor_record: 'Settled $1,320.00 on 2025-06-10', bank_record: 'Deposit of $1,320.00 posted 2025-06-11', ledger_record: 'Cash entry of $1,320.00 dated 2025-06-10', explanation: 'Bank posted the deposit one day after the processor settlement date. Amounts are identical and the dates fall within the normal 1-day window.', proposed_fix: 'Match records and mark timing difference as resolved', status: 'Resolved', opened_at: '2025-06-11T01:05:00Z' },
  { id: 'EXC-8839', transaction_id: 'TXN-8839', amount: 425.0, variance_amount: 12.4, currency: 'USD', source: 'processor', reason_code: 'Fee mismatch', processor_record: 'Gross $425.00, fee $24.80, net $400.20', bank_record: 'Deposit net $400.20', ledger_record: 'Gross $425.00, fee $12.40, net $412.60', explanation: 'Processor charged $24.80 in fees because an international card surcharge was applied. The ledger booked only the standard fee of $12.40, leaving a $12.40 gap against the bank deposit.', proposed_fix: 'Post adjustment entry of $12.40 to the fees account', status: 'Open', opened_at: '2025-06-11T20:40:00Z' },
  { id: 'EXC-8841', transaction_id: 'TXN-8841', amount: 249.0, variance_amount: 249.0, currency: 'USD', source: 'bank', reason_code: 'Missing record', processor_record: 'Capture TXN-8841 for $249.00 settled 2025-06-09', bank_record: 'No deposit found after 3 business days', ledger_record: 'Receivable of $249.00 booked 2025-06-09', explanation: 'The processor settled and the ledger booked a receivable, but no bank deposit exists after 3 business days.', proposed_fix: 'Open a settlement trace with the bank for $249.00', status: 'Open', opened_at: '2025-06-12T09:17:00Z' },
  ...Array.from({ length: 20 }, (_, i) => gen(i)),
];

const SEED_CHAT = [
  { id: 'MSG-3003', agent: 'Reconciliation', role: 'user', content: 'Why is transaction 8841 unmatched?', created_at: '2025-06-12T09:18:00Z' },
  { id: 'MSG-3004', agent: 'Reconciliation', role: 'agent', content: 'TXN-8841 ($249.00) was settled by the processor and booked in the ledger, but no matching bank deposit exists after 3 business days. I suggest a settlement trace.', linked_item_id: 'EXC-8841', created_at: '2025-06-12T09:18:09Z' },
];
const SEED_LOG = [
  { id: 'LOG-7003', agent: 'Reconciliation', timestamp: '2025-06-12T09:17:00Z', actor: 'Reconciliation Agent', actor_type: 'Agent', action: 'get_transaction', target: 'EXC-8841' },
  { id: 'LOG-7004', agent: 'Reconciliation', timestamp: '2025-06-11T09:15:00Z', actor: 'Marcus Lee', actor_type: 'Human', action: 'Approved adjustment', target: 'EXC-8838', decision_id: 'DEC-9003' },
];
const AGENT_IDS = ['apexflow', 'payops-test-reconciliation-agent', 'PayOps-Test-Reconciliation-Agent', 'payops_test_reconciliation_agent'];
const AGENT_FLOW_ID = '99c297b5-db72-4fda-89dd-1921ffb95577';
const AGENT_PATHS = ['/api/v1/prediction/' + AGENT_FLOW_ID, '/prediction/' + AGENT_FLOW_ID, ''];
const AGENT_ROUTE = { ok: null };
const PROMPTS = ['Reconcile yesterday', 'Why is transaction 8841 unmatched?', `Summarize this week's exceptions`];

function StatusPill({ status }) {
  const [cls, Icon] = STATUS_STYLE[status] || STATUS_STYLE.Open;
  return <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ' + cls}><Icon className="w-3.5 h-3.5" />{status || 'Open'}</span>;
}

function ReasonPill({ row }) {
  const k = kindOf(row);
  return <span className={'inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ' + KIND_STYLE[k]}>{row.reason_code || KIND_LABEL[k]}</span>;
}

function TrendChart({ values, current }) {
  const vals = [...values, current];
  const min = 90, max = 100, w = 280, h = 110, bw = w / vals.length;
  const label = (i) => new Date(REF - (vals.length - 1 - i) * DAY_MS).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <svg viewBox={'0 0 ' + w + ' ' + (h + 20)} className="w-full h-auto" role="img" aria-label="Reconciliation rate over the last 14 days">
      {[90, 95, 100].map((g) => <line key={g} x1="0" x2={w} y1={h - ((g - min) / (max - min)) * h} y2={h - ((g - min) / (max - min)) * h} className="stroke-slate-200" strokeWidth="1" />)}
      {vals.map((v, i) => {
        const c = Math.min(max, Math.max(min, v));
        const bh = Math.max(3, ((c - min) / (max - min)) * h);
        return <rect key={i} x={i * bw + 3} y={h - bh} width={bw - 6} height={bh} rx="2" className={i === vals.length - 1 ? 'fill-primary-700' : 'fill-primary-400'}><title>{label(i) + ': ' + v.toFixed(1) + '%'}</title></rect>;
      })}
      <text x="0" y={h + 15} className="fill-slate-600 text-[9px] font-semibold">{label(0)}</text>
      <text x={w} y={h + 15} textAnchor="end" className="fill-slate-600 text-[9px] font-semibold">{label(vals.length - 1)}</text>
    </svg>
  );
}

export default function Reconciliation() {
  const [rows, setRows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [chat, setChat] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('review');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'opened_at', dir: 'asc' });
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    api.list('ReconException').then((res) => {
      const a = Array.isArray(res) ? res : [];
      const ids = new Set(a.map((x) => x.id));
      setRows(a.length >= 25 ? a : [...a, ...SEED.filter((s) => !ids.has(s.id))]);
    }).catch(() => setRows(SEED));
    api.list('ActivityLogEntry').then((res) => {
      const a = (Array.isArray(res) ? res : []).filter((x) => x.agent === 'Reconciliation');
      setLogs(a.length ? a : SEED_LOG);
    }).catch(() => setLogs(SEED_LOG));
    api.list('ChatMessage').then((res) => {
      const a = (Array.isArray(res) ? res : []).filter((x) => x.agent === 'Reconciliation');
      setChat((a.length ? a : SEED_CHAT).slice().sort((p, q) => String(p.created_at).localeCompare(String(q.created_at))));
    }).catch(() => setChat(SEED_CHAT));
    Promise.resolve().then(() => auth.me()).then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const userName = user?.name || user?.full_name || user?.email || 'Ops reviewer';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      const okStatus = statusFilter === 'all' || (statusFilter === 'review' ? needsReview(r) : r.status === statusFilter);
      const okReason = reasonFilter === 'all' || kindOf(r) === reasonFilter;
      const okQuery = !q || [r.transaction_id, r.id, r.reason_code, r.source].some((v) => String(v ?? '').toLowerCase().includes(q));
      return okStatus && okReason && okQuery;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const x = a[sort.key] ?? '';
      const y = b[sort.key] ?? '';
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }, [rows, query, statusFilter, reasonFilter, sort]);

  const selected = rows.find((r) => r.id === selectedId) || null;
  useEffect(() => {
    if (!selected && visible.length) setSelectedId(visible[0].id);
  }, [selected, visible]);

  const stats = useMemo(() => {
    const un = rows.filter(needsReview);
    const variance = un.reduce((s, r) => s + Number(r.variance_amount ?? 0), 0);
    const oldest = un.reduce((m, r) => Math.max(m, Math.floor((REF - new Date(r.opened_at).getTime()) / DAY_MS) || 0), 0);
    const matched = TOTAL_TXNS - un.length;
    return { unmatched: un.length, matched, rate: (matched / TOTAL_TXNS) * 100, variance, oldest };
  }, [rows]);

  const byKind = useMemo(() => ['timing', 'fee', 'dup', 'missing'].map((k) => ({ k, n: rows.filter((r) => needsReview(r) && kindOf(r) === k).length })), [rows]);
  const timingOpen = useMemo(() => rows.filter((r) => kindOf(r) === 'timing' && needsReview(r)), [rows]);

  const sides = useMemo(() => {
    if (!selected) return [];
    const recs = [['Processor', selected.processor_record], ['Bank', selected.bank_record], ['Ledger', selected.ledger_record]];
    const re = kindOf(selected) === 'timing' ? /([$][0-9,]+[.][0-9]{2}|[0-9]{4}-[0-9]{2}-[0-9]{2})/ : /([$][0-9,]+[.][0-9]{2})/;
    return recs.map(([label, raw], i) => {
      const text = String(raw ?? 'No record');
      const others = recs.filter((_, j) => j !== i).map(([, t]) => String(t ?? ''));
      const parts = text.split(re).map((p, idx) => ({ p, hit: idx % 2 === 1 && !others.some((o) => o.includes(p)) }));
      const missing = /no (entry|deposit) found|not yet received|no record/i.test(text);
      const dup = /duplicate/i.test(text);
      const diff = parts.some((x) => x.hit);
      return { label, parts, state: missing ? 'missing' : dup ? 'duplicate' : diff ? 'differs' : 'match' };
    });
  }, [selected]);
  const agreeing = sides.filter((s) => s.state === 'match').length;

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  const persist = (kind, rec) => Promise.resolve().then(() => api.create(kind, rec)).catch(() => null);

  const commit = async (row, cfg, reason) => {
    const at = new Date().toISOString();
    const dec = await persist('Decision', { agent: 'Reconciliation', item_type: 'ReconException', item_id: row.id, action: cfg.action, reason, decided_by: userName, decided_at: at });
    const entry = { agent: 'Reconciliation', timestamp: at, actor: userName, actor_type: 'Human', action: cfg.logText, target: row.id, decision_id: dec?.id };
    const saved = await persist('ActivityLogEntry', entry);
    try { if (api.update) await api.update('ReconException', row.id, { status: cfg.status }); } catch (e) { /* mock layer may be read-only */ }
    return { ...entry, ...(saved || {}), id: saved?.id || 'LOG-' + row.id + '-' + Date.now() };
  };

  const act = async (kind) => {
    if (!selected || busy) return;
    const cfg = ACTIONS[kind];
    const row = selected;
    setBusy(kind);
    await new Promise((r) => setTimeout(r, 600));
    const saved = await commit(row, cfg, cfg.reason(row));
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: cfg.status } : r)));
    setLogs((l) => [saved, ...l]);
    setBusy(null);
    setToast({ tone: cfg.tone, text: cfg.done(row) });
    const idx = visible.findIndex((r) => r.id === row.id);
    const next = visible.slice(idx + 1).concat(visible.slice(0, Math.max(idx, 0))).find((r) => needsReview(r) && r.id !== row.id);
    if (next) setSelectedId(next.id);
  };

  const bulkApprove = async () => {
    const targets = timingOpen;
    setBulkBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    const cfg = ACTIONS.approve;
    const saved = await Promise.all(targets.map((r) => commit(r, cfg, 'Timing difference matched in bulk. ' + (r.proposed_fix || ''))));
    const ids = new Set(targets.map((r) => r.id));
    setRows((rs) => rs.map((r) => (ids.has(r.id) ? { ...r, status: 'Resolved' } : r)));
    setLogs((l) => [...saved, ...l]);
    setBulkBusy(false);
    setBulkOpen(false);
    setToast({ tone: 'success', text: targets.length + ' timing differences approved. Each one was added to the activity log.' });
  };

  const answer = (prompt) => {
    const p = prompt.toLowerCase();
    if (p.includes('8841')) {
      const r = rows.find((x) => String(x.transaction_id).includes('8841'));
      return r ? { content: r.transaction_id + ' (' + money(r.amount) + '): ' + r.explanation + ' Suggested next step: ' + r.proposed_fix + '.', linked: r.id } : { content: 'I could not find transaction 8841 in the current exceptions.' };
    }
    if (p.includes('yesterday')) {
      const y = rows.filter((r) => day(r.opened_at) === '2025-06-11');
      const t = y.filter((r) => kindOf(r) === 'timing' && needsReview(r));
      const first = y.find(needsReview);
      return { content: `Yesterday's run opened ${y.length} exceptions worth ${money(y.reduce((s, r) => s + Number(r.variance_amount ?? 0), 0))}. ${t.length} are timing differences you can approve together; the rest need a closer look. I have not changed anything.`, linked: first?.id };
    }
    const un = rows.filter(needsReview);
    const parts = byKind.filter((x) => x.n > 0).map((x) => x.n + ' ' + String(KIND_LABEL[x.k] ?? '').toLowerCase());
    return { content: `This week there are ${un.length} unresolved exceptions with ${money(stats.variance)} in total variance: ${parts.join(', ')}. The oldest has been open ${stats.oldest} days.`, linked: un[0]?.id };
  };

  const callAgent = async (prompt) => {
    const routes = AGENT_ROUTE.ok ? [AGENT_ROUTE.ok] : AGENT_IDS.flatMap((id) => AGENT_PATHS.map((path) => ({ id, path })));
    let res = null;
    let route = null;
    for (const r of routes) {
      res = await fetch('/api/integrations/' + r.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: r.path, method: 'POST', json_body: { question: prompt } }),
      });
      if (res.status !== 404) { route = r; break; }
    }
    if (!route) { AGENT_ROUTE.ok = null; throw new Error('HTTP 404, connector or path not found'); }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    AGENT_ROUTE.ok = route;
    const data = await res.json();
    const out = typeof data === 'string' ? data : (data?.output ?? data?.response ?? data?.result ?? data?.text ?? data?.message ?? data?.content ?? null);
    const text = typeof out === 'string' ? out : out ? JSON.stringify(out) : '';
    if (!text) throw new Error('Empty agent response');
    return text;
  };

  const ask = async (prompt) => {
    if (typing || !prompt) return;
    const um = { id: 'U-' + Date.now(), agent: 'Reconciliation', role: 'user', content: prompt, created_at: new Date().toISOString() };
    setChat((c) => [...c, um]);
    setTyping(true);
    let a;
    try {
      a = { content: await callAgent(prompt) };
    } catch (e) {
      const fb = answer(prompt);
      a = { ...fb, content: 'The Reconciliation agent could not be reached (' + (e?.message || 'unknown error') + '). ' + fb.content };
    }
    const am = { id: 'A-' + Date.now(), agent: 'Reconciliation', role: 'agent', content: a.content, linked_item_id: a.linked, created_at: new Date().toISOString() };
    setChat((c) => [...c, am]);
    setTyping(false);
    persist('ChatMessage', um);
    persist('ChatMessage', am);
  };

  const step = (dir) => {
    const idx = visible.findIndex((r) => r.id === selectedId);
    const next = visible[idx + dir];
    if (next) setSelectedId(next.id);
  };
  const selIdx = visible.findIndex((r) => r.id === selectedId);

  const th = (key, label, right) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={'sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider py-3.5 px-4 ' + (right ? 'text-right' : 'text-left')}>
      <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 uppercase tracking-wider font-bold hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
        {label}{sort.key === key && <span aria-hidden="true">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  );

  const segs = [['review', 'Needs review'], ['Resolved', 'Resolved'], ['Rejected', 'Rejected'], ['all', 'All']];
  const segCount = (id) => rows.filter((r) => (id === 'all' ? true : id === 'review' ? needsReview(r) : r.status === id)).length;
  const toneCls = { success: 'bg-emerald-50 border-emerald-200 text-emerald-700', danger: 'bg-rose-50 border-rose-200 text-rose-700', warning: 'bg-amber-50 border-amber-200 text-amber-700' };
  const ToastIcon = toast ? (toast.tone === 'success' ? IconCheckCircle : toast.tone === 'danger' ? IconXCircle : IconAlertTriangle) : null;
  const recLogs = logs.slice().sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0, 6);
  const lastMsgs = chat.slice(-6);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader eyebrow="Reconciliation Agent" title="Payment Reconciliation" subtitle="Compare the processor, bank and ledger records side by side, then approve, reject or flag the proposed fix." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Reconciliation rate" value={stats.rate.toFixed(1) + '%'} subtitle={'of ' + TOTAL_TXNS + ' transactions'} icon={IconTrendingUp} iconColor="blue" />
        <StatCard label="Matched" value={String(stats.matched)} subtitle="transactions" icon={IconCheckCircle} iconColor="emerald" />
        <StatCard label="Unmatched" value={String(stats.unmatched)} subtitle="exceptions to review" icon={IconAlertTriangle} iconColor="amber" />
        <StatCard label="Total variance" value={money(stats.variance)} subtitle="across open exceptions" icon={IconBarChart} iconColor="rose" />
        <StatCard label="Oldest open" value={stats.oldest + ' days'} subtitle="as of Jun 12" icon={IconClock} iconColor="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4 border-b border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Exceptions</h2>
                <p className="text-sm text-slate-600">Showing {visible.length} of {rows.length}. Select a row to compare its records.</p>
              </div>
              <Button variant="primary" size="sm" icon={IconCheckCircle} disabled={timingOpen.length === 0} onClick={() => setBulkOpen(true)}>Approve all timing differences ({timingOpen.length})</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <IconSearch className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transaction, source or reason" aria-label="Search exceptions" className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} aria-label="Filter by reason" className="bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">All reasons</option>
                {Object.keys(KIND_LABEL).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {segs.map(([id, label]) => (
                <button key={id} type="button" onClick={() => setStatusFilter(id)} className={'px-3 py-1.5 rounded-lg text-sm font-semibold border whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-500 ' + (statusFilter === id ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')}>{label} ({segCount(id)})</button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <div className="p-6"><EmptyState icon={IconSearch} title="No exceptions match these filters" description="Try a different status or reason, or clear the search." action={<Button variant="outline" size="sm" onClick={() => { setQuery(''); setReasonFilter('all'); setStatusFilter('all'); }}>Reset filters</Button>} /></div>
          ) : (
            <div className="overflow-auto max-h-[26rem]">
              <table className="w-full text-sm">
                <thead><tr>{th('transaction_id', 'Transaction')}{th('amount', 'Amount', true)}{th('source', 'Source')}{th('reason_code', 'Reason')}{th('status', 'Status')}{th('opened_at', 'Opened')}</tr></thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id} onClick={() => setSelectedId(r.id)} className={'border-b border-slate-100 text-slate-800 cursor-pointer ' + (r.id === selectedId ? 'bg-primary-50' : 'bg-white hover:bg-slate-50/80')}>
                      <td className={'py-3 px-4 font-bold text-slate-900 border-l-4 ' + (r.id === selectedId ? 'border-primary-600' : 'border-transparent')}>{r.transaction_id || r.id}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">{money(r.amount)}</td>
                      <td className="py-3 px-4 capitalize">{r.source || 'Unknown'}</td>
                      <td className="py-3 px-4"><ReasonPill row={r} /></td>
                      <td className="py-3 px-4"><StatusPill status={r.status} /></td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{day(r.opened_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Reconciliation rate" subtitle="Last 14 days">
            <TrendChart values={TREND} current={stats.rate} />
            <p className="text-xs font-semibold text-slate-600 mt-2">Today: {stats.rate.toFixed(1)}% · axis shows 90% to 100%</p>
          </Card>
          <Card title="Open by reason" subtitle="Select to filter the table">
            <div className="space-y-2">
              {byKind.map(({ k, n }) => (
                <button key={k} type="button" onClick={() => { setReasonFilter(k); setStatusFilter('review'); }} className="w-full text-left group focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1">
                  <div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-800 group-hover:text-primary-700">{KIND_LABEL[k]}</span><span className="font-bold text-slate-900">{n}</span></div>
                  <div className="h-2 bg-slate-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-primary-500 rounded-full" style={{ width: Math.min(100, (n / Math.max(1, stats.unmatched)) * 100) + '%' }} /></div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {selected ? (
        <section aria-label="Record comparison" className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{selected.transaction_id || selected.id}</h2>
                <ReasonPill row={selected} />
                <StatusPill status={selected.status} />
              </div>
              <p className="text-sm text-slate-700">Amount <span className="font-bold text-slate-900">{money(selected.amount)}</span> · Variance <span className="font-bold text-slate-900">{money(selected.variance_amount)}</span> · Opened {day(selected.opened_at)} · Origin: <span className="capitalize font-semibold">{selected.source || 'unknown'}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">{selIdx >= 0 ? (selIdx + 1) + ' of ' + visible.length : 'Not in current list'}</span>
              <Button variant="outline" size="sm" icon={IconChevronLeft} disabled={selIdx <= 0} onClick={() => step(-1)}>Previous</Button>
              <Button variant="outline" size="sm" icon={IconChevronRight} disabled={selIdx < 0 || selIdx >= visible.length - 1} onClick={() => step(1)}>Next</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
            {sides.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <span className={'h-0.5 w-8 rounded ' + (sides[i - 1].state === 'match' && s.state === 'match' ? 'bg-emerald-400' : 'bg-amber-400')} />}
                <span className="inline-flex items-center gap-1.5"><span className={'w-2.5 h-2.5 rounded-full ' + DOT[s.state]} />{s.label}</span>
              </React.Fragment>
            ))}
            <span className="ml-2 text-slate-600">{agreeing} of 3 sources agree</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sides.map((s) => {
              const [lbl, cls, Icon] = SIDE_STATE[s.state];
              const origin = String(selected.source ?? '').toLowerCase() === String(s.label ?? '').toLowerCase();
              return (
                <div key={s.label} className={'rounded-xl border-2 p-4 space-y-3 bg-white ' + (s.state === 'match' ? 'border-slate-200' : s.state === 'differs' ? 'border-amber-300' : 'border-rose-300')}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">{s.label} record</h3>
                      {origin && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Origin</span>}
                    </div>
                    <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ' + cls}><Icon className="w-3.5 h-3.5" />{lbl}</span>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-900">
                    {s.parts.map((x, i) => (x.hit ? <mark key={i} className="bg-amber-100 text-amber-900 font-bold rounded px-1">{x.p}</mark> : <span key={i}>{x.p}</span>))}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 flex items-start gap-3">
            <IconShieldCheck className="w-6 h-6 text-primary-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-800">Proposed fix</p>
              <p className="text-base font-bold text-slate-900">{selected.proposed_fix || 'No fix proposed yet'}</p>
              <p className="text-sm text-slate-700">{selected.explanation || 'The agent has not provided an explanation for this exception.'}</p>
            </div>
          </div>

          {selected.status === 'Resolved' ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"><IconCheckCircle className="w-4 h-4" />Resolved. This decision is recorded in the activity log.</div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" icon={IconCheckCircle} disabled={!!busy} onClick={() => act('approve')}>{busy === 'approve' ? ACTIONS.approve.busy : 'Approve adjustment'}</Button>
              <Button variant="danger" icon={IconXCircle} disabled={!!busy} onClick={() => act('reject')}>{busy === 'reject' ? ACTIONS.reject.busy : 'Reject'}</Button>
              <Button variant="outline" icon={IconAlertTriangle} disabled={!!busy || selected.status === 'Investigating'} onClick={() => act('flag')}>{busy === 'flag' ? ACTIONS.flag.busy : selected.status === 'Investigating' ? 'Already flagged' : 'Flag for investigation'}</Button>
            </div>
          )}
        </section>
      ) : (
        <EmptyState icon={IconSearch} title="Select an exception" description="Pick a row in the table to compare the processor, bank and ledger records." />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card title="Ask the Reconciliation Agent" subtitle="Connected to the PayOps Reconciliation Agent. Type a question or pick a suggestion.">
          <div className="space-y-3">
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {lastMsgs.map((m) => (
                <div key={m.id} className={'flex gap-2 ' + (m.role === 'user' ? 'flex-row-reverse' : '')}>
                  {m.role !== 'user' && <div className="w-8 h-8 shrink-0 rounded-full bg-secondary-100 text-secondary-700 text-xs font-bold flex items-center justify-center">AI</div>}
                  <div className={'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ' + (m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900')}>
                    <p>{m.content}</p>
                    {m.linked_item_id && rows.some((r) => r.id === m.linked_item_id) && (
                      <button type="button" onClick={() => { setStatusFilter('all'); setSelectedId(m.linked_item_id); }} className="mt-1.5 text-xs font-bold text-primary-700 hover:underline">Open in review card</button>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex gap-2 items-center"><div className="w-8 h-8 rounded-full bg-secondary-100 text-secondary-700 text-xs font-bold flex items-center justify-center">AI</div><span className="text-sm font-semibold text-slate-600 animate-pulse">Looking at the records…</span></div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const t = draft.trim(); if (!t || typing) return; setDraft(''); ask(t); }} className="flex items-center gap-2">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask the Reconciliation Agent…" aria-label="Message the Reconciliation Agent" disabled={typing} className="flex-1 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50" />
              <Button type="submit" variant="primary" size="sm" disabled={typing || !draft.trim()}>Send</Button>
            </form>
            <div className="flex flex-wrap gap-2 pt-1">
              {PROMPTS.map((p) => (
                <button key={p} type="button" disabled={typing} onClick={() => ask(p)} className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500">{p}</button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Activity log" subtitle="Latest reconciliation actions">
          <ol className="space-y-4">
            {recLogs.map((l) => (
              <li key={l.id} className="flex gap-3">
                <span className={'mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ' + (l.actor_type === 'Agent' ? 'bg-secondary-500' : 'bg-primary-500')} />
                <div className="min-w-0">
                  <p className="text-sm text-slate-900"><span className="font-bold">{l.actor || 'System'}</span> · {l.action || 'Action'} on <span className="font-semibold">{l.target || 'item'}</span></p>
                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1"><IconActivity className="w-3 h-3" />{l.actor_type || 'Agent'} · {stamp(l.timestamp)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Modal isOpen={bulkOpen} onClose={() => (bulkBusy ? null : setBulkOpen(false))} title="Approve all timing differences">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">You are about to approve <span className="font-bold text-slate-900">{timingOpen.length}</span> timing differences worth <span className="font-bold text-slate-900">{money(timingOpen.reduce((s, r) => s + Number(r.amount ?? 0), 0))}</span>. Each one will be marked resolved and added to the activity log.</p>
          <p className="text-xs font-semibold text-slate-600">{timingOpen.slice(0, 8).map((r) => r.transaction_id).join(', ')}{timingOpen.length > 8 ? ' and ' + (timingOpen.length - 8) + ' more' : ''}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={bulkBusy} onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={IconCheckCircle} disabled={bulkBusy || timingOpen.length === 0} onClick={bulkApprove}>{bulkBusy ? 'Approving…' : 'Approve ' + timingOpen.length + ' items'}</Button>
          </div>
        </div>
      </Modal>

      {toast && ToastIcon && (
        <div role="status" className={'fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border shadow-lg px-4 py-3 flex items-start gap-2 text-sm font-semibold ' + toneCls[toast.tone]}>
          <ToastIcon className="w-5 h-5 shrink-0" />
          <span className="flex-1">{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}
    </div>
  );
}
