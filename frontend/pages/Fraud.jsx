import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PageHeader, StatCard, Card, Button, Tabs, Modal, EmptyState } from '../components/ui.jsx';
import { IconAlertTriangle, IconCheckCircle, IconArrowUpRight, IconXCircle, IconShield, IconShieldCheck, IconClock, IconActivity, IconArrowRight, IconUser } from '../components/icons.jsx';
import { api, auth } from '../lib/apexApi.js';

const mk = (n, merchant, amount, score, signals, hist, verdict, conf, status, at) => ({
  id: 'FLG-' + n, transaction_id: 'TXN-' + n, merchant_name: merchant, amount, currency: 'USD',
  risk_score: score, signals, customer_history: hist, verdict, confidence: conf, status,
  flagged_at: '2025-06-12T' + at + ':00Z',
});

const SEED = [
  mk(5521, 'Vela Gift Cards', 3200, 93, 'Velocity spike (6 gift card purchases in 9 minutes); High-risk product category; Card issued in a different country than the shipping address', 'Account created 2 days ago. No prior successful orders. 3 previous cards declined in the last hour.', 'Hold', 0.9, 'Held', '03:14'),
  mk(5524, 'Bayside Pet Supply', 189.99, 52, 'Order value 3x customer average; New shipping address', 'Customer for 4 years, 31 prior orders, no chargebacks. Recently moved, which explains the new address.', 'Clear', 0.86, 'Cleared', '05:02'),
  mk(5526, 'Pine & Pearl Jewelers', 1840, 58, 'Mismatched geo (purchase from Lisbon, billing address in Denver); High-value item', 'Returning customer for 2 years with 9 prior orders. Travel notice was filed with the card issuer last week.', 'Clear', 0.74, 'Open', '08:20'),
  mk(5527, 'Kestrel Electronics', 960, 77, 'New device; Shipping to freight forwarder address; Second flagged transaction for this merchant today', 'Guest checkout with no history. Email address created 5 hours ago.', 'Hold', 0.79, 'Open', '09:41'),
  mk(5528, 'Vela Gift Cards', 2750, 91, 'Velocity spike (4 purchases in 6 minutes); High-risk product category; Same device as FLG-5521', 'Account created 2 days ago. Shares a device fingerprint with another flagged account.', 'Hold', 0.88, 'Open', '03:21'),
  mk(5529, 'Vela Gift Cards', 1900, 88, 'Velocity spike (3 purchases in 5 minutes); New device; High-risk product category', 'First order on this account. Email domain was registered this week.', 'Hold', 0.87, 'Open', '03:29'),
  mk(5530, 'Vela Gift Cards', 2400, 95, 'Velocity spike (8 purchases in 12 minutes); Card issued in a different country than the shipping address; Same device as FLG-5521', 'Account created yesterday. Four earlier card attempts failed. Matches the pattern of the other Vela Gift Cards flags.', 'Escalate', 0.92, 'Open', '03:37'),
  mk(5531, 'Vela Gift Cards', 640, 84, 'Velocity spike; High-risk product category; Mismatched geo', 'New account with a single prior declined order.', 'Hold', 0.83, 'Open', '03:44'),
  mk(5532, 'Northwind Travel', 4200, 71, 'High-value order; Mismatched geo (booking from Nairobi, card billed in Toronto); New device', 'Customer for 8 months with 3 prior bookings, all under $900. Order is nearly five times the usual amount.', 'Escalate', 0.68, 'Open', '10:12'),
  mk(5533, 'Juniper Home Goods', 124.5, 38, 'Order value 2x customer average', 'Customer for 3 years with 22 orders and no disputes. Bought a larger set than usual during a seasonal sale.', 'Clear', 0.91, 'Open', '11:05'),
  mk(5534, 'Kestrel Electronics', 1320, 69, 'New device; Second flagged transaction for this merchant today; Shipping to freight forwarder address', 'Guest checkout. Email address created 7 hours ago.', 'Hold', 0.72, 'Open', '11:48'),
  mk(5535, 'Orchard Coffee Roasters', 58, 31, 'New shipping address', 'Subscriber for 14 months with 15 prior orders. Changed address after a recent move.', 'Clear', 0.93, 'Cleared', '12:30'),
];

const LOG_SEED = [
  { id: 'LOG-7101', agent: 'Fraud', timestamp: '2025-06-12T09:41:30Z', actor: 'Fraud Agent', actor_type: 'Agent', action: 'score_transaction', target: 'FLG-5527' },
  { id: 'LOG-7102', agent: 'Fraud', timestamp: '2025-06-12T09:41:20Z', actor: 'Fraud Agent', actor_type: 'Agent', action: 'get_customer_history', target: 'FLG-5527' },
  { id: 'LOG-7103', agent: 'Fraud', timestamp: '2025-06-12T05:40:00Z', actor: 'Dana Whitfield', actor_type: 'Human', action: 'Cleared transaction', target: 'FLG-5524', decision_id: 'DEC-9004' },
  { id: 'LOG-7104', agent: 'Fraud', timestamp: '2025-06-12T03:44:10Z', actor: 'Fraud Agent', actor_type: 'Agent', action: 'detect_velocity_pattern', target: 'FLG-5531' },
];

const VERDICT = {
  Hold: { label: 'Hold', icon: IconAlertTriangle, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  Clear: { label: 'Clear', icon: IconCheckCircle, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  Escalate: { label: 'Escalate', icon: IconArrowUpRight, cls: 'bg-rose-50 border-rose-200 text-rose-700' },
};
const STATUS_CLS = {
  Open: 'bg-slate-50 border-slate-200 text-slate-700',
  Held: 'bg-amber-50 border-amber-200 text-amber-700',
  Cleared: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Escalated: 'bg-rose-50 border-rose-200 text-rose-700',
  Blocked: 'bg-rose-50 border-rose-200 text-rose-700',
};
const NEW_STATUS = { Hold: 'Held', Clear: 'Cleared', Escalate: 'Escalated', Block: 'Blocked' };
const ACTION_LABEL = { Hold: 'Hold', Clear: 'Clear', Escalate: 'Escalate to case', Block: 'Block merchant' };
const DEFAULT_REASON = {
  Hold: 'Held for manual review in line with the agent recommendation.',
  Clear: 'Reviewed signals and customer history; treated as a false positive.',
  Escalate: 'Escalated to a fraud case for deeper investigation.',
  Block: 'Merchant blocked after repeated high-risk flags.',
};
const PROMPTS = ['Review flagged transaction 5530', 'Why was this flagged?', 'Show merchants with repeated flags.'];

const money = (n) => '$' + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (s) => String(s ?? '').replace('T', ' ').substring(0, 16) + ' UTC';
const tone = (s) => (s >= 80
  ? { bar: 'bg-rose-600', stroke: 'stroke-rose-600', text: 'text-rose-700' }
  : s >= 60
    ? { bar: 'bg-amber-500', stroke: 'stroke-amber-500', text: 'text-amber-700' }
    : { bar: 'bg-emerald-600', stroke: 'stroke-emerald-600', text: 'text-emerald-700' });

function VerdictChip({ verdict }) {
  const v = VERDICT[verdict] || VERDICT.Hold;
  const Icon = v.icon;
  return (
    <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ' + v.cls}>
      <Icon className='w-3.5 h-3.5' />{v.label}
    </span>
  );
}

function StatusChip({ status }) {
  return <span className={'inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-bold ' + (STATUS_CLS[status] || STATUS_CLS.Open)}>{status ?? 'Open'}</span>;
}

function Gauge({ score }) {
  const s = Math.max(0, Math.min(100, Number(score ?? 0)));
  const c = 2 * Math.PI * 42;
  const t = tone(s);
  return (
    <svg width='120' height='120' viewBox='0 0 100 100' role='img' aria-label={'Fraud score ' + s + ' out of 100'}>
      <circle cx='50' cy='50' r='42' fill='none' strokeWidth='9' className='stroke-slate-200' />
      <circle cx='50' cy='50' r='42' fill='none' strokeWidth='9' strokeLinecap='round' className={t.stroke}
        strokeDasharray={(c * s / 100) + ' ' + c} transform='rotate(-90 50 50)' />
      <text x='50' y='51' textAnchor='middle' className='fill-slate-900' style={{ fontSize: 24, fontWeight: 800 }}>{s}</text>
      <text x='50' y='66' textAnchor='middle' className='fill-slate-600' style={{ fontSize: 8, fontWeight: 600 }}>FRAUD SCORE</text>
    </svg>
  );
}

function HourChart({ rows }) {
  const counts = Array.from({ length: 24 }, () => 0);
  rows.forEach((r) => {
    const h = new Date(String(r.flagged_at ?? '')).getUTCHours();
    if (!Number.isNaN(h)) counts[h] += 1;
  });
  const max = Math.max(1, ...counts);
  return (
    <svg viewBox='0 0 480 130' className='w-full h-36' role='img' aria-label='Flagged transactions by hour'>
      {counts.map((c, i) => {
        const h = (c / max) * 80;
        return (
          <g key={i}>
            <rect x={i * 20 + 3} y={95 - h} width='14' height={Math.max(h, 1.5)} rx='3' className={c ? 'fill-primary-600' : 'fill-slate-200'}>
              <title>{String(i).padStart(2, '0') + ':00 UTC - ' + c + ' flagged'}</title>
            </rect>
            {c > 0 && <text x={i * 20 + 10} y={90 - h} textAnchor='middle' className='fill-slate-800' style={{ fontSize: 9, fontWeight: 700 }}>{c}</text>}
            {i % 3 === 0 && <text x={i * 20 + 10} y='112' textAnchor='middle' className='fill-slate-600' style={{ fontSize: 9 }}>{String(i).padStart(2, '0')}</text>}
          </g>
        );
      })}
      <text x='240' y='127' textAnchor='middle' className='fill-slate-600' style={{ fontSize: 9, fontWeight: 600 }}>Hour of day (UTC)</text>
    </svg>
  );
}

export default function Fraud() {
  const [rows, setRows] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [chat, setChat] = useState([]);
  const [tab, setTab] = useState('queue');
  const [filter, setFilter] = useState('Open');
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockErr, setBlockErr] = useState('');
  const [notice, setNotice] = useState(null);
  const [me, setMe] = useState('Fraud analyst');
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [logFilter, setLogFilter] = useState('All');
  const endRef = useRef(null);

  useEffect(() => {
    api.list('FlaggedTransaction').then((r) => {
      const base = Array.isArray(r) ? r : [];
      const ids = new Set(base.map((x) => x.id));
      setRows([...base, ...SEED.filter((s) => !ids.has(s.id))]);
    }).catch(() => setRows(SEED));
    api.list('Decision').then((d) => setDecisions(Array.isArray(d) ? d : [])).catch(() => {});
    api.list('ActivityLogEntry').then((l) => {
      const f = (Array.isArray(l) ? l : []).filter((x) => x.agent === 'Fraud');
      setLogs([...f, ...LOG_SEED]);
    }).catch(() => setLogs(LOG_SEED));
    api.list('ChatMessage').then((m) => {
      const f = (Array.isArray(m) ? m : []).filter((x) => x.agent === 'Fraud');
      setChat(f.length ? f : [{ id: 'welcome', role: 'agent', content: 'Hi, I am the Fraud agent. I can explain why a payment was flagged and look up merchants with repeated flags. This chat is read-only: only you can hold, clear, escalate or block.' }]);
    }).catch(() => setChat([]));
    Promise.resolve().then(() => auth.me()).then((u) => { const n = u && (u.name || u.full_name); if (n) setMe(n); }).catch(() => {});
  }, []);

  const queue = useMemo(() => rows
    .filter((r) => filter === 'all' || r.status === filter)
    .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0)), [rows, filter]);

  useEffect(() => {
    if (!selectedId && rows.length) {
      const top = rows.filter((r) => r.status === 'Open').sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))[0];
      if (top) setSelectedId(top.id);
    }
  }, [rows, selectedId]);

  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: 'smooth' }); }, [chat, pending, tab]);
  useEffect(() => { if (!notice) return undefined; const t = setTimeout(() => setNotice(null), 4500); return () => clearTimeout(t); }, [notice]);

  const selected = rows.find((r) => r.id === selectedId) || null;

  const merchantCounts = useMemo(() => {
    const m = {};
    rows.forEach((r) => { m[r.merchant_name] = (m[r.merchant_name] || 0) + 1; });
    return m;
  }, [rows]);

  const kpis = useMemo(() => {
    const dates = rows.map((r) => String(r.flagged_at ?? '').substring(0, 10)).sort();
    const today = dates[dates.length - 1];
    const sum = (list) => list.reduce((a, r) => a + Number(r.amount ?? 0), 0);
    return {
      today: rows.filter((r) => String(r.flagged_at ?? '').substring(0, 10) === today).length,
      held: rows.filter((r) => r.status === 'Held').length,
      cleared: rows.filter((r) => r.status === 'Cleared').length,
      cases: rows.filter((r) => r.status === 'Escalated').length,
      protectedAmt: sum(rows.filter((r) => ['Held', 'Escalated', 'Blocked'].includes(r.status))),
      open: rows.filter((r) => r.status === 'Open').length,
    };
  }, [rows]);

  const filters = [
    { id: 'Open', label: 'Needs review' }, { id: 'Held', label: 'Held' }, { id: 'Escalated', label: 'Escalated' },
    { id: 'Cleared', label: 'Cleared' }, { id: 'Blocked', label: 'Blocked' }, { id: 'all', label: 'All' },
  ];

  const decide = (type, reason) => {
    if (!selected) return;
    const item = selected;
    const text = (reason || '').trim() || DEFAULT_REASON[type];
    setRows((prev) => prev.map((r) => ((r.id === item.id || (type === 'Block' && r.merchant_name === item.merchant_name && r.status === 'Open'))
      ? { ...r, status: NEW_STATUS[type] } : r)));
    const now = new Date().toISOString();
    const dec = { id: 'DEC-' + Date.now(), agent: 'Fraud', item_type: 'FlaggedTransaction', item_id: item.id, action: ACTION_LABEL[type], reason: text, decided_by: me, decided_at: now };
    setDecisions((d) => [dec, ...d]);
    try { Promise.resolve(api.create('Decision', dec)).catch(() => {}); } catch (e) { /* mock layer unavailable */ }
    setLogs((l) => [{ id: 'LOG-' + Date.now(), agent: 'Fraud', timestamp: now, actor: me, actor_type: 'Human', action: ACTION_LABEL[type], target: item.id, decision_id: dec.id }, ...l]);
    const candidates = queue.filter((r) => r.status === 'Open' && r.id !== item.id && !(type === 'Block' && r.merchant_name === item.merchant_name));
    const idx = queue.findIndex((r) => r.id === item.id);
    const next = candidates.find((r) => queue.indexOf(r) > idx) || candidates[0];
    setSelectedId(next ? next.id : item.id);
    setNote('');
    setNotice({ tone: type === 'Clear' ? 'emerald' : type === 'Hold' ? 'amber' : 'rose', text: ACTION_LABEL[type] + ' recorded for ' + item.transaction_id + (next ? '. Next up: ' + next.transaction_id + '.' : '. The queue is clear.') });
  };

  const confirmBlock = () => {
    if (blockReason.trim().length < 8) { setBlockErr('Please give a short reason (at least 8 characters).'); return; }
    decide('Block', blockReason);
    setBlockOpen(false); setBlockReason(''); setBlockErr('');
  };

  const agentReply = (text) => {
    const q = text.toLowerCase();
    if (q.includes('review')) {
      const num = (text.match(/[0-9]{4}/) || [])[0];
      const r = rows.find((x) => x.transaction_id === 'TXN-' + num);
      if (r) {
        return { content: r.merchant_name + ' (' + r.transaction_id + ', ' + money(r.amount) + ') scored ' + (r.risk_score ?? 0) + '/100. I recommend ' + (r.verdict ?? 'Hold').toLowerCase() + ' with ' + Math.round((r.confidence ?? 0.8) * 100) + '% confidence. Open in review card.', linked: r.id };
      }
      return { content: 'I could not find a flagged transaction with that number. Try one of the 4-digit IDs in the queue, for example 5530.' };
    }
    if (q.includes('why')) {
      const r = selected || queue[0];
      if (!r) return { content: 'There is nothing selected to explain yet.' };
      return { content: r.transaction_id + ' was flagged because: ' + String(r.signals ?? '').split(';').map((s) => s.trim()).filter(Boolean).join('; ') + '. Open in review card.', linked: r.id };
    }
    if (q.includes('repeated') || q.includes('merchant')) {
      const list = Object.entries(merchantCounts).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
      if (!list.length) return { content: 'No merchant has more than one flag right now.' };
      return { content: 'Merchants with repeated flags: ' + list.map(([m, n]) => m + ' (' + n + ')').join(', ') + '. Vela Gift Cards shows a velocity pattern across the same device.' };
    }
    return { content: 'I can review a flagged transaction, explain why it was flagged, or list merchants with repeated flags. Decisions stay with you.' };
  };

  const send = (text) => {
    const t = (text ?? input).trim();
    if (!t || pending) return;
    setChat((c) => [...c, { id: 'u-' + Date.now(), role: 'user', content: t }]);
    setInput(''); setPending(true);
    const local = agentReply(t);
    const pick = (d) => {
      if (d == null) return '';
      if (typeof d === 'string') return d;
      const v = d.text ?? d.output ?? d.response ?? d.answer ?? d.message ?? d.content ?? (d.data && pick(d.data)) ?? (d.result && pick(d.result));
      if (typeof v === 'string') return v;
      if (Array.isArray(d.content)) return d.content.map((x) => (x && x.text) || '').join('');
      if (d.choices && d.choices[0] && d.choices[0].message) return d.choices[0].message.content || '';
      return v && typeof v === 'object' ? pick(v) : '';
    };
    const ids = ['payops-test-fraud-agent', 'PayOps-Test-Fraud-Agent', 'payops_test_fraud_agent', 'apexflow'];
    const call = (i) => fetch('/api/integrations/' + ids[i], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/api/v1/prediction/99c297b5-db72-4fda-89dd-1921ffb95577', method: 'POST', json_body: { question: t } }),
    }).then((res) => {
      if (res.status === 404 && i < ids.length - 1) return call(i + 1);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
    call(0)
      .then((data) => {
        const txt = String(pick(data) || '').trim();
        if (!txt) throw new Error('empty reply');
        setChat((c) => [...c, { id: 'a-' + Date.now(), role: 'agent', content: txt, linked_item_id: local.linked }]);
      })
      .catch((err) => {
        setChat((c) => [...c, { id: 'a-' + Date.now(), role: 'agent', content: 'The Fraud agent could not be reached (' + ((err && err.message) || 'error') + '). ' + local.content, linked_item_id: local.linked }]);
      })
      .finally(() => setPending(false));
  };

  const openInReview = (id) => { setFilter('all'); setSelectedId(id); setTab('queue'); };

  const sortedLogs = useMemo(() => [...logs]
    .filter((l) => logFilter === 'All' || l.actor_type === logFilter)
    .sort((a, b) => String(b.timestamp ?? '').localeCompare(String(a.timestamp ?? ''))), [logs, logFilter]);

  const signals = selected ? String(selected.signals ?? '').split(';').map((s) => s.trim()).filter(Boolean) : [];
  const shares = [0.42, 0.3, 0.18, 0.1];
  const sel = selected || {};
  const selTone = tone(sel.risk_score ?? 0);
  const repeat = selected ? (merchantCounts[sel.merchant_name] || 0) : 0;

  return (
    <div className='space-y-6 sm:space-y-8'>
      <PageHeader eyebrow='Fraud agent' title='Fraud Detection' subtitle='Work flagged payments from highest risk to lowest. The agent recommends, you decide.' />

      {notice && (
        <div className={'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold bg-' + notice.tone + '-50 border-' + notice.tone + '-200 text-' + notice.tone + '-700'} role='status'>
          <IconCheckCircle className='w-4 h-4' />{notice.text}
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
        <StatCard label='Flagged today' value={kpis.today} icon={IconAlertTriangle} iconColor='blue' />
        <StatCard label='Held' value={kpis.held} icon={IconShield} iconColor='amber' />
        <StatCard label='Cleared as false positives' value={kpis.cleared} icon={IconCheckCircle} iconColor='emerald' />
        <StatCard label='Open cases' value={kpis.cases} icon={IconArrowUpRight} iconColor='rose' />
        <StatCard label='Estimated amount protected' value={'$' + Math.round(kpis.protectedAmt).toLocaleString('en-US')} icon={IconShieldCheck} iconColor='teal' />
      </div>

      <Card title='Flagged transactions by hour' subtitle='Spikes in the early morning line up with the Vela Gift Cards velocity pattern.'>
        <HourChart rows={rows} />
      </Card>

      <Tabs tabs={[{ id: 'queue', label: 'Review queue', count: kpis.open }, { id: 'chat', label: 'Ask the agent' }, { id: 'log', label: 'Activity log', count: logs.length }]} activeTab={tab} onChange={setTab} />

      {tab === 'queue' && (
        <div className='space-y-4'>
          <div className='flex gap-2 overflow-x-auto pb-1'>
            {filters.map((f) => {
              const n = f.id === 'all' ? rows.length : rows.filter((r) => r.status === f.id).length;
              const on = filter === f.id;
              return (
                <button key={f.id} type='button' onClick={() => setFilter(f.id)}
                  className={'shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-primary-500 ' + (on ? 'bg-primary-600 border-primary-600 text-white' : 'bg-card border-card-border text-slate-700 hover:bg-slate-50')}>
                  {f.label} <span className={on ? 'text-white' : 'text-slate-600'}>({n})</span>
                </button>
              );
            })}
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
            <div className='lg:col-span-2 space-y-3'>
              <p className='text-xs font-bold uppercase tracking-wider text-slate-600'>Ranked by risk score, highest first</p>
              {queue.length === 0 && <EmptyState icon={IconCheckCircle} title='Nothing waiting here' description='Every flagged payment in this view has been handled. Pick another filter to look back.' />}
              {queue.map((r, i) => {
                const t = tone(r.risk_score ?? 0);
                const on = r.id === selectedId;
                return (
                  <button key={r.id} type='button' onClick={() => setSelectedId(r.id)}
                    className={'w-full text-left rounded-xl border p-4 bg-card transition focus:outline-none focus:ring-2 focus:ring-primary-500 ' + (on ? 'border-primary-500 ring-2 ring-primary-100 shadow-md' : 'border-card-border hover:bg-slate-50 shadow-sm')}>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex items-start gap-3 min-w-0'>
                        <span className='w-7 h-7 shrink-0 rounded-full bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center'>{i + 1}</span>
                        <div className='min-w-0'>
                          <p className='text-sm font-bold text-slate-900 truncate'>{r.merchant_name || 'Merchant'}</p>
                          <p className='text-xs text-slate-600 font-semibold'>{r.transaction_id} · {money(r.amount)}</p>
                        </div>
                      </div>
                      <VerdictChip verdict={r.verdict} />
                    </div>
                    <div className='mt-3 flex items-center gap-3'>
                      <div className='flex-1 h-2 rounded-full bg-slate-100 overflow-hidden'>
                        <div className={'h-full rounded-full ' + t.bar} style={{ width: Math.min(100, r.risk_score ?? 0) + '%' }} />
                      </div>
                      <span className={'text-sm font-extrabold ' + t.text}>{r.risk_score ?? 0}</span>
                    </div>
                    <div className='mt-2 flex items-center justify-between text-xs text-slate-600 font-semibold'>
                      <span>Agent confidence {Math.round((r.confidence ?? 0) * 100)}%</span>
                      <span className='flex items-center gap-2'>
                        {(merchantCounts[r.merchant_name] || 0) > 1 && <span className='text-rose-700'>{merchantCounts[r.merchant_name]} flags from merchant</span>}
                        {r.status !== 'Open' && <StatusChip status={r.status} />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className='lg:col-span-3'>
              {!selected ? (
                <EmptyState icon={IconShield} title='Select a flagged payment' description='Choose a card from the queue to see the evidence and decide.' />
              ) : (
                <div className='rounded-xl border border-card-border bg-card shadow-sm p-5 sm:p-6 space-y-6 lg:sticky lg:top-4'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                      <p className='text-xs font-bold uppercase tracking-wider text-slate-600'>{sel.transaction_id} · flagged {fmt(sel.flagged_at)}</p>
                      <h2 className='text-xl font-bold text-slate-900'>{sel.merchant_name || 'Merchant'}</h2>
                      <p className='text-2xl font-extrabold text-slate-900'>{money(sel.amount)} <span className='text-sm font-semibold text-slate-600'>{sel.currency ?? 'USD'}</span></p>
                    </div>
                    <StatusChip status={sel.status} />
                  </div>

                  <div className='flex flex-col sm:flex-row items-center gap-5 rounded-xl bg-slate-50 border border-slate-200 p-4'>
                    <Gauge score={sel.risk_score} />
                    <div className='space-y-2 text-center sm:text-left'>
                      <p className='text-xs font-bold uppercase tracking-wider text-slate-600'>Agent recommendation</p>
                      <VerdictChip verdict={sel.verdict} />
                      <p className='text-sm text-slate-800'>Confidence <span className='font-bold'>{Math.round((sel.confidence ?? 0) * 100)}%</span></p>
                      <div className='w-48 h-2 rounded-full bg-slate-200 overflow-hidden mx-auto sm:mx-0'>
                        <div className='h-full bg-primary-600 rounded-full' style={{ width: Math.round((sel.confidence ?? 0) * 100) + '%' }} />
                      </div>
                    </div>
                  </div>

                  {repeat > 1 && (
                    <div className='flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm font-semibold'>
                      <IconAlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
                      <span>{sel.merchant_name} has {repeat} flagged payments today. Blocking the merchant would stop all {rows.filter((r) => r.merchant_name === sel.merchant_name && r.status === 'Open').length} that are still open.</span>
                    </div>
                  )}

                  <div>
                    <h3 className='text-sm font-bold text-slate-900 mb-3'>Top signals</h3>
                    <ul className='space-y-3'>
                      {signals.map((s, i) => {
                        const pts = Math.round((sel.risk_score ?? 0) * (shares[i] ?? 0.05));
                        return (
                          <li key={i}>
                            <div className='flex items-center justify-between text-sm text-slate-800'>
                              <span className='font-semibold'>{s}</span>
                              <span className='text-xs font-bold text-slate-700 ml-3 shrink-0'>+{pts} pts</span>
                            </div>
                            <div className='mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden'>
                              <div className={'h-full rounded-full ' + selTone.bar} style={{ width: Math.min(100, (shares[i] ?? 0.05) * 220) + '%' }} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div>
                    <h3 className='text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5'><IconUser className='w-4 h-4' />Customer history</h3>
                    <p className='text-sm text-slate-800 leading-relaxed rounded-xl bg-slate-50 border border-slate-200 p-3'>{sel.customer_history || 'No history on file.'}</p>
                  </div>

                  <div>
                    <label htmlFor='fraud-note' className='text-sm font-bold text-slate-900'>Note for the audit log (optional)</label>
                    <textarea id='fraud-note' rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder='Why are you making this call?'
                      className='mt-1 w-full rounded-xl bg-card border border-card-border text-slate-900 placeholder:text-slate-400 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary-500' />
                  </div>

                  <div className='flex flex-wrap gap-2 pt-4 border-t border-slate-200'>
                    <Button variant='secondary' icon={IconAlertTriangle} onClick={() => decide('Hold', note)}>Hold</Button>
                    <Button variant='primary' icon={IconCheckCircle} onClick={() => decide('Clear', note)}>Clear</Button>
                    <Button variant='outline' icon={IconArrowUpRight} onClick={() => decide('Escalate', note)}>Escalate to case</Button>
                    <Button variant='danger' icon={IconXCircle} onClick={() => { setBlockReason(note); setBlockOpen(true); }}>Block merchant</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'chat' && (
        <Card title='Ask the Fraud agent' subtitle='Read-only chat. The agent explains and looks things up; it cannot take action.'>
          <div className='space-y-4'>
            <div className='max-h-96 overflow-y-auto space-y-4 pr-1'>
              {chat.map((m) => (
                <div key={m.id} className={'flex gap-3 ' + (m.role === 'user' ? 'flex-row-reverse' : '')}>
                  <div className={'w-8 h-8 rounded-full shrink-0 flex items-center justify-center ' + (m.role === 'user' ? 'bg-slate-200 text-slate-800' : 'bg-secondary-100 text-secondary-700')}>
                    {m.role === 'user' ? <IconUser className='w-4 h-4' /> : <IconShield className='w-4 h-4' />}
                  </div>
                  <div className={'max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ' + (m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900')}>
                    <p>{m.content}</p>
                    {m.linked_item_id && (
                      <button type='button' onClick={() => openInReview(m.linked_item_id)} className='mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:underline'>
                        Open in review card <IconArrowRight className='w-3.5 h-3.5' />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {pending && <p className='text-xs font-semibold text-slate-600 animate-pulse'>The Fraud agent is looking that up...</p>}
              <div ref={endRef} />
            </div>
            <div className='flex flex-wrap gap-2'>
              {PROMPTS.map((p) => (
                <button key={p} type='button' onClick={() => send(p)} disabled={pending}
                  className='text-xs font-semibold px-3 py-1.5 rounded-full border border-card-border bg-card text-slate-800 hover:bg-primary-50 hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50'>
                  {p}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className='flex gap-2'>
              <input value={input} onChange={(e) => setInput(e.target.value)} disabled={pending} placeholder='Ask about a flagged payment...'
                className='flex-1 rounded-xl bg-card border border-card-border text-slate-900 placeholder:text-slate-400 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500' />
              <Button variant='primary' icon={IconArrowRight} disabled={!input.trim() || pending} onClick={() => send()}>Send</Button>
            </form>
          </div>
        </Card>
      )}

      {tab === 'log' && (
        <Card title='Audit activity log' subtitle='Every agent step and human decision, newest first.'>
          <div className='flex gap-2 mb-5'>
            {['All', 'Agent', 'Human'].map((f) => (
              <button key={f} type='button' onClick={() => setLogFilter(f)}
                className={'px-3 py-1.5 rounded-full border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ' + (logFilter === f ? 'bg-primary-600 border-primary-600 text-white' : 'bg-card border-card-border text-slate-700 hover:bg-slate-50')}>{f}</button>
            ))}
          </div>
          <ol className='relative border-l-2 border-slate-200 ml-3 space-y-6'>
            {sortedLogs.map((l) => {
              const dec = decisions.find((d) => d.id === l.decision_id);
              const isAgent = l.actor_type === 'Agent';
              return (
                <li key={l.id} className='pl-6 relative'>
                  <span className={'absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ' + (isAgent ? 'bg-secondary-500' : 'bg-primary-600')} />
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-sm font-bold text-slate-900'>{l.actor}</span>
                    <span className={'px-2 py-0.5 rounded-full border text-xs font-bold ' + (isAgent ? 'bg-secondary-50 border-secondary-200 text-secondary-700' : 'bg-primary-50 border-primary-200 text-primary-700')}>{l.actor_type}</span>
                    <span className='text-xs font-semibold text-slate-600 flex items-center gap-1'><IconClock className='w-3 h-3' />{fmt(l.timestamp)}</span>
                  </div>
                  <p className='text-sm text-slate-800 mt-1'>{l.action} on <span className='font-bold'>{l.target}</span></p>
                  {dec && <p className='text-xs text-slate-700 mt-1 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2'>Reason: {dec.reason}</p>}
                </li>
              );
            })}
          </ol>
          {sortedLogs.length === 0 && <EmptyState icon={IconActivity} title='No matching activity' description='Try another filter.' />}
        </Card>
      )}

      <Modal isOpen={blockOpen} onClose={() => { setBlockOpen(false); setBlockErr(''); }} title='Block this merchant?'>
        <div className='space-y-4'>
          <p className='text-sm text-slate-800'>
            This blocks <span className='font-bold'>{sel.merchant_name}</span> and stops the {rows.filter((r) => selected && r.merchant_name === sel.merchant_name && r.status === 'Open').length} open flagged payment(s) from this merchant. This is recorded in the audit log.
          </p>
          <div>
            <label htmlFor='block-reason' className='text-sm font-bold text-slate-900'>Reason (required)</label>
            <textarea id='block-reason' rows={3} value={blockReason} onChange={(e) => { setBlockReason(e.target.value); setBlockErr(''); }}
              placeholder='For example: repeated velocity pattern on a shared device'
              className='mt-1 w-full rounded-xl bg-card border border-card-border text-slate-900 placeholder:text-slate-400 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary-500' />
            {blockErr && <p className='text-xs font-bold text-rose-700 mt-1 flex items-center gap-1'><IconAlertCircleSafe />{blockErr}</p>}
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => { setBlockOpen(false); setBlockErr(''); }}>Cancel</Button>
            <Button variant='danger' icon={IconXCircle} onClick={confirmBlock}>Block merchant</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function IconAlertCircleSafe() {
  return <IconAlertTriangle className='w-3.5 h-3.5' />;
}
