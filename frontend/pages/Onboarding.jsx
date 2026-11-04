import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Button, Tabs, Modal, EmptyState, RiskBadge, PageHeader } from '../components/ui.jsx';
import { IconCheckCircle, IconAlertTriangle, IconXCircle, IconShieldCheck, IconUser, IconChevronDown, IconChevronRight, IconArrowRight, IconClock, IconCheck, IconX, IconActivity } from '../components/icons.jsx';
import { api } from '../lib/apexApi.js';

const AGENT_ID = 'PayOps-Test-Onboarding-Agent';
const FLOW_ID = '99c297b5-db72-4fda-89dd-1921ffb95577';

const SEED_APPS = [
  { id: 'APP-1040', merchant_name: 'Harbor Light Books', business_type: 'Retail - Books & Media', country: 'United States', monthly_volume_estimate: 42000, documents_complete: true, kyc_result: 'pass', aml_result: 'pass', credit_result: 'pass', risk_tier: 'low', reasoning: 'Established 9-year business with verified ownership, clean sanctions screening and strong credit file. No adverse media found.', recommendation: 'Approve with standard terms', status: 'Approved', received_at: '2025-06-11T09:12:00Z' },
  { id: 'APP-1042', merchant_name: 'Summit Peak Fitness', business_type: 'Fitness Studio (subscriptions)', country: 'United States', monthly_volume_estimate: 68000, documents_complete: true, kyc_result: 'pass', aml_result: 'pass', credit_result: 'pass', risk_tier: 'low', reasoning: 'All owners verified against government ID. No watchlist or sanctions hits. Credit score 742 with no recent delinquencies. Recurring billing model carries low chargeback history in this category.', recommendation: 'Approve with standard terms', status: 'Pending Review', received_at: '2025-06-12T07:48:00Z' },
  { id: 'APP-1043', merchant_name: 'Blue Fern Coffee', business_type: 'Food & Beverage - Cafe & Online Roastery', country: 'Canada', monthly_volume_estimate: 31500, documents_complete: true, kyc_result: 'pass', aml_result: 'pass', credit_result: 'warn', risk_tier: 'medium', reasoning: 'Identity and AML checks are clean. Rated medium because the business is under 18 months old and the owner credit file shows a recent late payment on an equipment loan. Online roastery adds card-not-present exposure.', recommendation: 'Approve with 10% reserve', status: 'Pending Review', received_at: '2025-06-12T08:05:00Z' },
  { id: 'APP-1044', merchant_name: 'Orion Digital Goods Ltd', business_type: 'Digital Goods - Software Keys & Gift Cards', country: 'Cyprus', monthly_volume_estimate: 250000, documents_complete: true, kyc_result: 'warn', aml_result: 'fail', credit_result: 'fail', risk_tier: 'high', reasoning: 'Beneficial owner is linked to a company named in a regulatory warning. AML screening returned a partial match on a politically exposed person. Projected volume is 8x the stated business size and credit file shows two unpaid judgments.', recommendation: 'Reject', status: 'Pending Review', received_at: '2025-06-12T08:31:00Z' },
  { id: 'APP-1045', merchant_name: 'Northwind Artisan Candles', business_type: 'Retail - Home Goods (online)', country: 'United Kingdom', monthly_volume_estimate: 18500, documents_complete: false, kyc_result: 'warn', aml_result: 'pass', credit_result: 'pass', risk_tier: 'medium', reasoning: 'Screening is clean so far, but proof of business address and the second director ID were not uploaded. Identity verification could not be completed for one of two owners.', recommendation: 'Request more info', status: 'Pending Review', received_at: '2025-06-12T08:50:00Z' },
  { id: 'APP-1046', merchant_name: 'Vapor Haven Online', business_type: 'Restricted - Vaping Products', country: 'United States', monthly_volume_estimate: 54000, documents_complete: true, kyc_result: 'pass', aml_result: 'warn', credit_result: 'fail', risk_tier: 'high', reasoning: 'Restricted category without age-verification controls or state licences; prior processor termination.', recommendation: 'Reject', status: 'Rejected', received_at: '2025-06-11T13:20:00Z' },
  { id: 'APP-1047', merchant_name: 'Pine & Quill Stationery', business_type: 'Retail - Stationery & Gifts', country: 'United States', monthly_volume_estimate: 22000, documents_complete: true, kyc_result: 'pass', aml_result: 'pass', credit_result: 'pass', risk_tier: 'low', reasoning: 'Two-year-old storefront with consistent card volume, verified owner and a clean credit profile. Low dispute exposure for the category.', recommendation: 'Approve with standard terms', status: 'Pending Review', received_at: '2025-06-12T09:02:00Z' },
  { id: 'APP-1048', merchant_name: 'Delta Freight Brokers', business_type: 'Logistics - Freight Brokerage', country: 'Mexico', monthly_volume_estimate: 120000, documents_complete: true, kyc_result: 'pass', aml_result: 'warn', credit_result: 'pass', risk_tier: 'medium', reasoning: 'Ownership is verified but AML screening flagged a cross-border payment pattern that needs a human look. Large ticket sizes and delayed delivery increase chargeback exposure.', recommendation: 'Approve with 5% reserve and weekly payouts', status: 'Pending Review', received_at: '2025-06-12T09:20:00Z' }
];

const SEED_DEC = [
  { id: 'DEC-9001', agent: 'Onboarding', item_type: 'MerchantApplication', item_id: 'APP-1040', action: 'Approve', reason: 'All checks passed; standard terms applied.', decided_by: 'Priya Nair', decided_at: '2025-06-11T11:30:00Z' },
  { id: 'DEC-9002', agent: 'Onboarding', item_type: 'MerchantApplication', item_id: 'APP-1046', action: 'Reject', reason: 'Restricted category without age-verification controls or state licences; prior processor termination.', decided_by: 'Priya Nair', decided_at: '2025-06-11T16:05:00Z' }
];

const SEED_LOG = [
  { id: 'LOG-7001', agent: 'Onboarding', timestamp: '2025-06-12T09:08:00Z', actor: 'Onboarding Agent', actor_type: 'Agent', action: 'verify_kyc', target: 'APP-1042' },
  { id: 'LOG-7005', agent: 'Onboarding', timestamp: '2025-06-12T08:52:00Z', actor: 'Onboarding Agent', actor_type: 'Agent', action: 'screen_aml', target: 'APP-1044' },
  { id: 'LOG-7006', agent: 'Onboarding', timestamp: '2025-06-11T16:05:00Z', actor: 'Priya Nair', actor_type: 'Human', action: 'Rejected application', target: 'APP-1046', decision_id: 'DEC-9002' },
  { id: 'LOG-7002', agent: 'Onboarding', timestamp: '2025-06-11T11:30:00Z', actor: 'Priya Nair', actor_type: 'Human', action: 'Approved application', target: 'APP-1040', decision_id: 'DEC-9001' }
];

const SEED_MSG = [
  { id: 'MSG-3001', role: 'user', content: 'Review application #1042' },
  { id: 'MSG-3002', role: 'agent', content: 'Summit Peak Fitness (#1042) passed KYC, AML and credit checks and is low risk. I recommend approving with standard terms.', links: ['APP-1042'] }
];

const PROMPTS = ['Review application #1042', 'Why was Blue Fern Coffee marked medium risk?', 'Show all high-risk applications.'];

const CHECK = {
  pass: { label: 'Passed', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', Icon: IconCheckCircle },
  warn: { label: 'Needs attention', cls: 'bg-amber-50 border-amber-200 text-amber-700', Icon: IconAlertTriangle },
  fail: { label: 'Failed', cls: 'bg-rose-50 border-rose-200 text-rose-700', Icon: IconXCircle }
};

const STATUS = {
  'Pending Review': { cls: 'bg-slate-100 border-slate-200 text-slate-700', Icon: IconClock },
  'Approved': { cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', Icon: IconCheckCircle },
  'Rejected': { cls: 'bg-rose-50 border-rose-200 text-rose-700', Icon: IconXCircle },
  'More Info Requested': { cls: 'bg-amber-50 border-amber-200 text-amber-700', Icon: IconAlertTriangle }
};

const ACTIONS = {
  approve: { action: 'Approve', status: 'Approved', logText: 'Approved application', title: 'Approve application', confirm: 'Approve merchant', variant: 'primary', hint: 'Add a short note about the terms you are approving.' },
  reject: { action: 'Reject', status: 'Rejected', logText: 'Rejected application', title: 'Reject application', confirm: 'Reject merchant', variant: 'danger', hint: 'Explain why this merchant cannot be onboarded.' },
  info: { action: 'Request more info', status: 'More Info Requested', logText: 'Requested more information', title: 'Request more information', confirm: 'Send request', variant: 'primary', hint: 'Say what the merchant needs to provide.' }
};

const RISK_RANK = { high: 0, medium: 1, low: 2 };
const cap = (s) => { const t = String(s ?? 'low'); return t.charAt(0).toUpperCase() + t.slice(1); };
const money = (n) => '$' + Number(n ?? 0).toLocaleString('en-US');
const dayKey = (ts) => String(ts ?? '').substring(0, 10);
const fmt = (ts) => { const d = new Date(ts); if (!ts || isNaN(d)) return '-'; return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }); };
const word = (r) => String((CHECK[r] || CHECK.warn).label).toLowerCase();

function pickText(d) {
  if (d === null || d === undefined) return '';
  if (typeof d === 'string') return d;
  if (typeof d !== 'object') return '';
  return pickText(d.answer ?? d.reply ?? d.response ?? d.output ?? d.message ?? d.text ?? d.content ?? d.result ?? d.data);
}

const CONNECTOR_IDS = ['payops_test_onboarding_agent'];

async function askAgent(q, history) {
  let res = null;
  let lastStatus = 'no response';
  for (const cid of CONNECTOR_IDS) {
    try {
      const r = await fetch('/api/integrations/' + cid, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/api/v1/prediction/' + FLOW_ID, method: 'POST', json_body: { question: q } })
      });
      lastStatus = 'HTTP ' + r.status + ' from ' + cid;
      if (r.ok) { res = r; break; }
      if (r.status !== 404) break;
    } catch (e) {
      lastStatus = 'network error';
      break;
    }
  }
  if (!res) throw new Error('Agent unavailable (' + lastStatus + ')');
  let data;
  const raw = await res.text();
  try { data = JSON.parse(raw); } catch (e) { data = raw; }
  const text = String(pickText(data) ?? '').trim();
  if (!text) throw new Error('Empty agent reply');
  return text;
}

function buildReply(q, apps) {
  const t = q.toLowerCase();
  const num = t.match(/[0-9]{4}/);
  const byName = apps.find((a) => t.includes(String(a.merchant_name ?? '').toLowerCase()));
  const byNum = num ? apps.find((a) => String(a.id ?? '').endsWith(num[0])) : null;
  const app = byName || byNum;
  if (!app && /high[- ]risk|risky/.test(t)) {
    const hi = apps.filter((a) => String(a.risk_tier).toLowerCase() === 'high');
    if (!hi.length) return { text: 'There are no high-risk applications right now.', links: [], tool: 'search_applications', target: 'risk_tier=high' };
    return { text: `I found ${hi.length} high-risk application${hi.length > 1 ? 's' : ''}: ` + hi.map((a) => `${a.merchant_name} (${a.id}, ${String(a.status)})`).join('; ') + '.', links: hi.map((a) => a.id), tool: 'search_applications', target: 'risk_tier=high' };
  }
  if (app) {
    if (/why|reason|medium|risk/.test(t)) {
      return { text: `${app.merchant_name} is rated ${String(app.risk_tier ?? 'unknown')} risk. ${app.reasoning ?? ''}`, links: [app.id], tool: 'explain_risk_tier', target: app.id };
    }
    return { text: `${app.merchant_name} (${app.id}): KYC ${word(app.kyc_result)}, AML ${word(app.aml_result)}, credit ${word(app.credit_result)}. Risk tier is ${String(app.risk_tier ?? 'unknown')}. Recommendation: ${app.recommendation ?? 'none'}.`, links: [app.id], tool: 'verify_kyc', target: app.id };
  }
  return { text: 'I can summarise an application by number or name, explain a risk rating, or list high-risk applications. I am read-only, so decisions are always made by you in the review card.', links: [], tool: 'help', target: 'n/a' };
}

function CheckPill({ name, result }) {
  const c = CHECK[result] || CHECK.warn;
  return (
    <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ' + c.cls}>
      <c.Icon className='w-4 h-4' />{name}: {c.label}
    </span>
  );
}

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS['Pending Review'];
  return (
    <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ' + s.cls}>
      <s.Icon className='w-4 h-4' />{status ?? 'Pending Review'}
    </span>
  );
}

function Tile({ label, value, note }) {
  return (
    <div className='!bg-green-100 !border-green-200 border rounded-xl p-4 shadow-sm'>
      <div className='text-xs font-bold uppercase tracking-wider text-slate-600'>{label}</div>
      <div className='mt-1 text-2xl font-bold text-slate-900'>{value}</div>
      {note && <div className='text-xs font-semibold text-slate-600 mt-0.5'>{note}</div>}
    </div>
  );
}

export default function Onboarding() {
  const [apps, setApps] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [log, setLog] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('pending');
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const chatRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const safe = (e) => Promise.resolve(api.list(e)).then((r) => (Array.isArray(r) ? r : [])).catch(() => []);
    Promise.all([safe('MerchantApplication'), safe('Decision'), safe('ChatMessage'), safe('ActivityLogEntry')]).then(([a, d, c, l]) => {
      if (!alive) return;
      let list = a;
      if (a.length < 8) {
        const byId = {};
        SEED_APPS.forEach((x) => { byId[x.id] = { ...x }; });
        a.forEach((x) => { byId[x.id] = { ...(byId[x.id] || {}), ...x }; });
        list = Object.values(byId);
      }
      const dd = d.filter((x) => x.agent === 'Onboarding');
      const ll = l.filter((x) => x.agent === 'Onboarding');
      const cc = c.filter((x) => x.agent === 'Onboarding').sort((x, y) => String(x.created_at ?? '').localeCompare(String(y.created_at ?? '')));
      setApps(list);
      setDecisions(dd.length ? dd : SEED_DEC);
      setLog(ll.length ? ll : SEED_LOG);
      setMessages(cc.length ? cc.map((m) => ({ id: m.id, role: m.role, content: m.content, links: m.linked_item_id ? [m.linked_item_id] : [] })) : SEED_MSG);
      const first = list.filter((x) => x.status === 'Pending Review').sort((x, y) => (RISK_RANK[x.risk_tier] ?? 3) - (RISK_RANK[y.risk_tier] ?? 3))[0];
      setSelectedId(first ? first.id : null);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages, thinking]);

  const isPending = (a) => a.status === 'Pending Review';
  const byRisk = (x, y) => (RISK_RANK[x.risk_tier] ?? 3) - (RISK_RANK[y.risk_tier] ?? 3) || String(y.received_at ?? '').localeCompare(String(x.received_at ?? ''));

  const counts = useMemo(() => ({
    pending: apps.filter(isPending).length,
    info: apps.filter((a) => a.status === 'More Info Requested').length,
    decided: apps.filter((a) => a.status === 'Approved' || a.status === 'Rejected').length
  }), [apps]);

  const queue = useMemo(() => {
    const f = apps.filter((a) => (tab === 'pending' ? isPending(a) : tab === 'info' ? a.status === 'More Info Requested' : a.status === 'Approved' || a.status === 'Rejected'));
    return [...f].sort(byRisk);
  }, [apps, tab]);

  const kpi = useMemo(() => {
    const ref = apps.reduce((m, a) => (dayKey(a.received_at) > m ? dayKey(a.received_at) : m), '');
    const hrs = decisions.map((d) => {
      const a = apps.find((x) => x.id === d.item_id);
      if (!a) return null;
      const h = (new Date(d.decided_at) - new Date(a.received_at)) / 36e5;
      return h > 0 && h < 72 ? h : null;
    }).filter((h) => h !== null);
    const avg = hrs.length ? hrs.reduce((s, h) => s + h, 0) / hrs.length : null;
    return {
      today: apps.filter((a) => dayKey(a.received_at) === ref).length,
      approved: apps.filter((a) => a.status === 'Approved').length,
      rejected: apps.filter((a) => a.status === 'Rejected').length,
      avg: avg === null ? '-' : `${Math.floor(avg)}h ${Math.round((avg % 1) * 60)}m`
    };
  }, [apps, decisions]);

  const tiers = useMemo(() => ['low', 'medium', 'high'].map((t) => ({ t, n: apps.filter((a) => String(a.risk_tier ?? '').toLowerCase() === t).length })), [apps]);
  const maxTier = Math.max(1, ...tiers.map((x) => x.n));

  const sortedLog = useMemo(() => [...log].sort((x, y) => String(y.timestamp ?? '').localeCompare(String(x.timestamp ?? ''))), [log]);
  const selected = apps.find((a) => a.id === selectedId) || null;
  const selDecision = selected ? decisions.find((d) => d.item_id === selected.id) : null;
  const canDecide = selected && (selected.status === 'Pending Review' || selected.status === 'More Info Requested');

  const addLog = (actor, type, action, target, decisionId) => {
    setLog((l) => [{ id: 'LOG-' + Date.now() + '-' + l.length, agent: 'Onboarding', timestamp: new Date().toISOString(), actor, actor_type: type, action, target, decision_id: decisionId }, ...l]);
  };

  const openApp = (id) => {
    const a = apps.find((x) => x.id === id);
    if (!a) return;
    setTab(a.status === 'Pending Review' ? 'pending' : a.status === 'More Info Requested' ? 'info' : 'decided');
    setSelectedId(id);
  };

  const send = async (text) => {
    const q = String(text ?? '').trim();
    if (!q || thinking) return;
    const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { id: 'u' + Date.now(), role: 'user', content: q }]);
    setInput('');
    setThinking(true);
    try {
      const reply = await askAgent(q, history);
      const ids = Array.from(new Set(reply.match(/APP-[0-9]{4}/g) || [])).filter((id) => apps.some((a) => a.id === id));
      setMessages((m) => [...m, { id: 'a' + Date.now(), role: 'agent', content: reply, links: ids }]);
      addLog(AGENT_ID, 'Agent', 'chat_reply', ids[0] || 'chat');
    } catch (err) {
      const r = buildReply(q, apps);
      setMessages((m) => [...m, { id: 'a' + Date.now(), role: 'agent', content: 'The Onboarding agent could not be reached' + (err && err.message ? ' [' + err.message + ']' : '') + ', so here is a local summary instead. ' + r.text, links: r.links }]);
      addLog('Onboarding Agent', 'Agent', r.tool, r.target);
    } finally {
      setThinking(false);
    }
  };

  const openModal = (type) => { setReason(''); setReasonErr(''); setModal(type); };

  const confirm = () => {
    const r = reason.trim();
    if (r.length < 5) { setReasonErr('Please give a short reason (at least 5 characters).'); return; }
    const cfg = ACTIONS[modal];
    const app = selected;
    if (!cfg || !app) return;
    const dec = { id: 'DEC-' + Date.now(), agent: 'Onboarding', item_type: 'MerchantApplication', item_id: app.id, action: cfg.action, reason: r, decided_by: 'You', decided_at: new Date().toISOString() };
    const nextApps = apps.map((a) => (a.id === app.id ? { ...a, status: cfg.status } : a));
    setApps(nextApps);
    setDecisions((d) => [dec, ...d]);
    addLog('You', 'Human', cfg.logText, app.id, dec.id);
    try {
      const p1 = api.create('Decision', dec);
      if (p1 && p1.catch) p1.catch(() => {});
      if (api.update) { const p2 = api.update('MerchantApplication', app.id, { status: cfg.status }); if (p2 && p2.catch) p2.catch(() => {}); }
    } catch (e) {  }
    const next = nextApps.filter((a) => a.status === 'Pending Review').sort(byRisk)[0];
    setSelectedId(next ? next.id : null);
    if (!next) setTab('pending');
    setModal(null);
    setToast(`${app.merchant_name}: ${String(cfg.status ?? '').toLowerCase()}. Logged in the audit trail.`);
    setTimeout(() => setToast(null), 4000);
  };

  const tabs = [
    { id: 'pending', label: 'Pending review', count: counts.pending },
    { id: 'info', label: 'Waiting on merchant', count: counts.info },
    { id: 'decided', label: 'Decided', count: counts.decided }
  ];

  return (
    <div className='space-y-6 sm:space-y-8'>
      <PageHeader eyebrow='Onboarding Agent' title='Merchant Onboarding' subtitle='Talk to the agent on the left, then make the call on one application at a time on the right.' />

      {toast && (
        <div className='flex items-center gap-2 px-4 py-3 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-700 text-sm font-semibold'>
          <IconCheckCircle className='w-5 h-5' />{toast}
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6'>
        <div className='lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3'>
          <Tile label='Received today' value={kpi.today} />
          <Tile label='Pending review' value={counts.pending} />
          <Tile label='Approved this week' value={kpi.approved} />
          <Tile label='Rejected this week' value={kpi.rejected} />
          <Tile label='Avg time to decision' value={kpi.avg} />
          <Tile label='Waiting on merchant' value={counts.info} />
        </div>
        <div className='lg:col-span-4 bg-card border border-card-border rounded-xl p-4 shadow-sm'>
          <div className='text-xs font-bold uppercase tracking-wider text-slate-600'>Applications by risk tier</div>
          <svg viewBox='0 0 200 100' className='w-full h-28 mt-2' role='img' aria-label='Applications by risk tier'>
            {tiers.map((x, i) => {
              const h = (x.n / maxTier) * 55;
              return (
                <g key={x.t}>
                  <rect x={20 + i * 62} y={70 - h} width='42' height={h} rx='4' className='fill-primary-600' />
                  <text x={41 + i * 62} y={64 - h} textAnchor='middle' className='fill-slate-900' fontSize='11' fontWeight='700'>{x.n}</text>
                  <text x={41 + i * 62} y='88' textAnchor='middle' className='fill-slate-700' fontSize='10' fontWeight='600'>{cap(x.t)}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start'>
        <div className='lg:col-span-5 bg-card border border-card-border rounded-xl shadow-sm flex flex-col h-[640px]'>
          <div className='flex items-center justify-between gap-3 px-4 py-3 border-b border-card-border'>
            <div className='flex items-center gap-3'>
              <span className='w-9 h-9 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center'><IconShieldCheck className='w-5 h-5' /></span>
              <div>
                <div className='text-sm font-bold text-slate-900'>Onboarding Agent</div>
                <div className='text-xs font-semibold text-slate-600'>Read-only: it explains, you decide</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button type='button' disabled={thinking} onClick={() => send('Run a test onboarding check: review application #1042 and summarise the KYC, AML and credit results and your recommendation.')} className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border bg-primary-600 border-primary-600 text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500'><IconActivity className='w-3.5 h-3.5' />Test onboarding</button>
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700 text-xs font-semibold'><IconCheck className='w-3.5 h-3.5' />Online</span>
            </div>
          </div>
          <div ref={chatRef} className='flex-1 overflow-y-auto p-4 space-y-4'>
            {messages.map((m) => (
              <div key={m.id} className={'flex gap-2.5 ' + (m.role === 'user' ? 'flex-row-reverse' : '')}>
                <span className={'w-7 h-7 shrink-0 rounded-full flex items-center justify-center ' + (m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700')}>
                  {m.role === 'user' ? <IconUser className='w-4 h-4' /> : <IconShieldCheck className='w-4 h-4' />}
                </span>
                <div className={'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ' + (m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-800')}>
                  <p className='whitespace-pre-wrap'>{m.content ?? ''}</p>
                  {(m.links ?? []).length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {m.links.map((id) => (
                        <button key={id} type='button' onClick={() => openApp(id)} className='inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded'>
                          Open {id} in review card<IconArrowRight className='w-3.5 h-3.5' />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className='flex gap-2.5'>
                <span className='w-7 h-7 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center'><IconShieldCheck className='w-4 h-4' /></span>
                <div className='rounded-2xl px-3.5 py-3 bg-slate-50 border border-slate-200 flex items-center gap-1.5'>
                  <span className='w-2 h-2 rounded-full bg-secondary-500 animate-bounce' />
                  <span className='w-2 h-2 rounded-full bg-secondary-500 animate-bounce [animation-delay:0.2s]' />
                  <span className='w-2 h-2 rounded-full bg-secondary-500 animate-bounce [animation-delay:0.4s]' />
                </div>
              </div>
            )}
          </div>
          <div className='border-t border-card-border p-3 space-y-2.5'>
            <div className='flex flex-wrap gap-2'>
              {PROMPTS.map((p) => (
                <button key={p} type='button' disabled={thinking} onClick={() => send(p)} className='text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500'>{p}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className='flex gap-2'>
              <input value={input} onChange={(e) => setInput(e.target.value)} disabled={thinking} placeholder='Ask about an application...' className='flex-1 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500' />
              <Button variant='primary' size='md' disabled={!input.trim() || thinking} onClick={() => send(input)}>Ask</Button>
            </form>
          </div>
        </div>

        <div className='lg:col-span-7 space-y-6'>
          <div className='bg-card border border-card-border rounded-xl shadow-sm'>
            <div className='px-4 pt-3'><Tabs tabs={tabs} activeTab={tab} onChange={setTab} /></div>
            <div className='p-3 max-h-64 overflow-y-auto space-y-2'>
              {queue.length === 0 && (
                <div className='py-6 text-center text-sm font-semibold text-slate-700'>Nothing in this list right now.</div>
              )}
              {queue.map((a) => {
                const on = a.id === selectedId;
                return (
                  <button key={a.id} type='button' onClick={() => setSelectedId(a.id)} className={'w-full text-left rounded-lg border px-3.5 py-2.5 flex items-center justify-between gap-3 transition focus:outline-none focus:ring-2 focus:ring-primary-500 ' + (on ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white hover:bg-slate-50')}>
                    <div className='min-w-0'>
                      <div className='text-sm font-bold text-slate-900 truncate'>{a.merchant_name ?? 'Merchant'}</div>
                      <div className='text-xs font-semibold text-slate-600'>{a.id} - {a.country ?? ''} - {money(a.monthly_volume_estimate)}/mo - {fmt(a.received_at)}</div>
                    </div>
                    <RiskBadge level={cap(a.risk_tier)} />
                  </button>
                );
              })}
            </div>
          </div>

          {!selected ? (
            <div className='bg-card border border-card-border rounded-xl shadow-sm'>
              <EmptyState icon={IconCheckCircle} title='Queue is clear' description='Every application has a decision. New applications will show up here as the agent finishes its checks.' />
            </div>
          ) : (
            <div className='bg-card border border-card-border rounded-xl shadow-sm'>
              <div className='p-5 space-y-5'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <h2 className='text-xl font-bold text-slate-900'>{selected.merchant_name ?? 'Merchant'}</h2>
                    <p className='text-sm font-semibold text-slate-600'>{selected.id} - {selected.business_type ?? ''} - {selected.country ?? ''}</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <StatusPill status={selected.status} />
                    <RiskBadge level={cap(selected.risk_tier)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div><div className='text-xs font-bold uppercase tracking-wider text-slate-600'>Monthly volume</div><div className='text-sm font-bold text-slate-900'>{money(selected.monthly_volume_estimate)}</div></div>
                  <div><div className='text-xs font-bold uppercase tracking-wider text-slate-600'>Received</div><div className='text-sm font-bold text-slate-900'>{fmt(selected.received_at)}</div></div>
                  <div><div className='text-xs font-bold uppercase tracking-wider text-slate-600'>Documents</div><div className={'text-sm font-bold ' + (selected.documents_complete ? 'text-emerald-700' : 'text-amber-700')}>{selected.documents_complete ? 'Complete' : 'Missing items'}</div></div>
                </div>

                <div className='flex flex-wrap gap-2'>
                  <CheckPill name='KYC' result={selected.kyc_result} />
                  <CheckPill name='AML' result={selected.aml_result} />
                  <CheckPill name='Credit' result={selected.credit_result} />
                </div>

                {!selected.documents_complete && (
                  <div className='flex items-start gap-2 px-3.5 py-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-700 text-sm font-semibold'>
                    <IconAlertTriangle className='w-5 h-5 shrink-0' />Some required documents have not been uploaded. Ask the merchant to send them before a final decision.
                  </div>
                )}

                <div>
                  <div className='text-xs font-bold uppercase tracking-wider text-slate-600 mb-1'>Why the agent rated it this way</div>
                  <p className='text-sm text-slate-800 leading-relaxed'>{selected.reasoning ?? 'No written reasoning available.'}</p>
                </div>

                <div className='rounded-lg border border-primary-200 bg-primary-50 px-4 py-3'>
                  <div className='text-xs font-bold uppercase tracking-wider text-primary-700'>Agent recommendation</div>
                  <div className='text-sm font-bold text-slate-900 mt-0.5'>{selected.recommendation ?? 'No recommendation'}</div>
                </div>

                {selDecision && !canDecide && (
                  <div className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800'>
                    <span className='font-bold'>{selDecision.action}</span> by {selDecision.decided_by ?? 'a reviewer'} on {fmt(selDecision.decided_at)}. {selDecision.reason ?? ''}
                  </div>
                )}
              </div>
              <div className='border-t border-card-border px-5 py-3.5 flex flex-wrap items-center gap-2.5 bg-slate-50 rounded-b-xl'>
                <Button variant='primary' icon={IconCheck} disabled={!canDecide} onClick={() => openModal('approve')}>Approve</Button>
                <Button variant='danger' icon={IconX} disabled={!canDecide} onClick={() => openModal('reject')}>Reject</Button>
                <Button variant='outline' disabled={!canDecide} onClick={() => openModal('info')}>Request more info</Button>
                {!canDecide && <span className='text-xs font-semibold text-slate-600'>This application already has a final decision.</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='bg-card border border-card-border rounded-xl shadow-sm'>
        <button type='button' onClick={() => setLogOpen((o) => !o)} className='w-full flex items-center justify-between gap-3 px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-xl'>
          <div className='flex items-center gap-3'>
            <IconActivity className='w-5 h-5 text-slate-700' />
            <div>
              <div className='text-sm font-bold text-slate-900'>Activity log ({sortedLog.length})</div>
              {!logOpen && sortedLog[0] && <div className='text-xs font-semibold text-slate-600'>Latest: {sortedLog[0].actor} - {sortedLog[0].action} - {sortedLog[0].target}</div>}
            </div>
          </div>
          {logOpen ? <IconChevronDown className='w-5 h-5 text-slate-700' /> : <IconChevronRight className='w-5 h-5 text-slate-700' />}
        </button>
        {logOpen && (
          <ul className='px-5 pb-5 space-y-3 border-t border-card-border pt-4'>
            {sortedLog.map((l) => (
              <li key={l.id} className='flex items-start gap-3'>
                <span className={'mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ' + (l.actor_type === 'Agent' ? 'bg-secondary-500' : 'bg-slate-600')} />
                <div className='text-sm text-slate-800'>
                  <span className='font-bold text-slate-900'>{l.actor ?? 'Unknown'}</span>{' '}
                  {l.actor_type === 'Agent' ? <span className='font-mono text-xs px-1.5 py-0.5 rounded bg-secondary-50 border border-secondary-200 text-secondary-700'>{l.action}</span> : <span>{l.action}</span>}{' '}
                  on <span className='font-semibold'>{l.target ?? '-'}</span>
                  <div className='text-xs font-semibold text-slate-600'>{l.actor_type === 'Agent' ? 'Tool call' : 'Human decision'} - {fmt(l.timestamp)}{l.decision_id ? ' - ' + l.decision_id : ''}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal ? ACTIONS[modal].title : ''}>
        {modal && selected && (
          <div className='space-y-4'>
            <p className='text-sm text-slate-800'><span className='font-bold'>{selected.merchant_name}</span> ({selected.id}). {ACTIONS[modal].hint}</p>
            <div>
              <label htmlFor='decision-reason' className='block text-sm font-bold text-slate-900 mb-1'>Reason (required)</label>
              <textarea id='decision-reason' rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setReasonErr(''); }} placeholder='Write a short reason for the audit trail...' className='w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500' />
              {reasonErr && <p className='mt-1 flex items-center gap-1 text-sm font-semibold text-rose-700'><IconAlertTriangle className='w-4 h-4' />{reasonErr}</p>}
            </div>
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setModal(null)}>Cancel</Button>
              <Button variant={ACTIONS[modal].variant} onClick={confirm}>{ACTIONS[modal].confirm}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
