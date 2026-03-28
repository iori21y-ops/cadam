/**
 * CADAM Prompt BFF — service role Supabase + n8n API.
 * Env: PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, N8N_BASE_URL, N8N_API_KEY, BFF_API_KEY (optional)
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const PORT = Number(process.env.PORT || 3099);
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const N8N_BASE_URL = (process.env.N8N_BASE_URL || 'http://127.0.0.1:5678').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const BFF_API_KEY = process.env.BFF_API_KEY || '';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

function auth(req, res, next) {
  if (!BFF_API_KEY) return next();
  const key = req.headers['x-api-key'];
  if (key !== BFF_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing X-API-Key' });
  }
  next();
}

async function n8nFetch(path, opts = {}) {
  const url = `${N8N_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(N8N_API_KEY ? { 'X-N8N-API-KEY': N8N_API_KEY } : {}),
    ...opts.headers,
  };
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = new Error(typeof body === 'object' && body?.message ? body.message : res.statusText);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function resolveSlotContent(slot) {
  const st = slot.source_type;
  if (st === 'prompt_versions_active') {
    const { data, error } = await sb
      .from('prompt_versions')
      .select('id, version, prompt_content, agent_name, is_active, created_at')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return {
      text: data?.prompt_content ?? '',
      meta: data,
      field: 'prompt_content',
    };
  }
  if (st === 'review_prompt_versions_active') {
    const { data, error } = await sb
      .from('review_prompt_versions')
      .select('id, version, prompt_content, created_by, is_active, created_at')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return {
      text: data?.prompt_content ?? '',
      meta: data,
      field: 'prompt_content',
    };
  }
  if (st === 'prompt_templates_key' && slot.template_key) {
    const { data, error } = await sb
      .from('prompt_templates')
      .select('id, version, template_content, template_key, is_active, updated_at')
      .eq('template_key', slot.template_key)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return {
      text: data?.template_content ?? '',
      meta: data,
      field: 'template_content',
    };
  }
  if (st === 'n8n_http_jsonbody' || st === 'n8n_code_jscode') {
    const wfId = slot.workflow_id || slot.scan_meta?.workflow_id;
    const nodeId = slot.node_id || slot.scan_meta?.node_id;
    const field = slot.scan_meta?.field || (st === 'n8n_http_jsonbody' ? 'jsonBody' : 'jsCode');
    if (!wfId || !nodeId) return { text: '', meta: null, field };
    const wf = await n8nFetch(`/api/v1/workflows/${wfId}`);
    const node = (wf.nodes || []).find((n) => n.id === nodeId);
    if (!node) return { text: '', meta: { error: 'node not found' }, field };
    const v = node.parameters?.[field];
    return { text: typeof v === 'string' ? v : JSON.stringify(v ?? '', null, 2), meta: { node: node.name }, field };
  }
  return { text: '', meta: null, field: 'content' };
}

async function applySlotContent(slot, newText, createdBy, note) {
  const st = slot.source_type;
  const prev = await resolveSlotContent(slot);
  const snapshot = prev.text;

  const { error: revErr } = await sb.from('ai_prompt_revisions').insert({
    slot_id: slot.id,
    content: snapshot,
    note: note || 'snapshot before save',
    created_by: createdBy || 'bff',
  });
  if (revErr) throw revErr;

  if (st === 'prompt_versions_active') {
    await sb.from('prompt_versions').update({ is_active: false }).eq('is_active', true);
    const cur = prev.meta;
    const nextVer = (cur?.version || 0) + 1;
    const { error } = await sb.from('prompt_versions').insert({
      version: nextVer,
      prompt_content: newText,
      agent_name: cur?.agent_name || 'cadam-writer',
      is_active: true,
    });
    if (error) throw error;
    return { version: nextVer };
  }

  if (st === 'review_prompt_versions_active') {
    await sb.from('review_prompt_versions').update({ is_active: false }).eq('is_active', true);
    const cur = prev.meta;
    const nextVer = (cur?.version || 0) + 1;
    const { error } = await sb.from('review_prompt_versions').insert({
      version: nextVer,
      prompt_content: newText,
      created_by: createdBy || 'dashboard_bff',
      is_active: true,
    });
    if (error) throw error;
    return { version: nextVer };
  }

  if (st === 'prompt_templates_key' && slot.template_key) {
    const cur = prev.meta;
    const nextVer = (cur?.version || 0) + 1;
    const { error } = await sb
      .from('prompt_templates')
      .update({
        template_content: newText,
        version: nextVer,
        updated_at: new Date().toISOString(),
      })
      .eq('template_key', slot.template_key);
    if (error) throw error;
    return { version: nextVer };
  }

  if (st === 'n8n_http_jsonbody' || st === 'n8n_code_jscode') {
    const wfId = slot.workflow_id || slot.scan_meta?.workflow_id;
    const nodeId = slot.node_id || slot.scan_meta?.node_id;
    const field = slot.scan_meta?.field || (st === 'n8n_http_jsonbody' ? 'jsonBody' : 'jsCode');
    const wf = await n8nFetch(`/api/v1/workflows/${wfId}`);
    const idx = (wf.nodes || []).findIndex((n) => n.id === nodeId);
    if (idx < 0) throw new Error('Node not found in workflow');
    wf.nodes[idx].parameters = wf.nodes[idx].parameters || {};
    wf.nodes[idx].parameters[field] = newText;
    await n8nFetch(`/api/v1/workflows/${wfId}`, { method: 'PUT', body: JSON.stringify(wf) });
    return { n8n: true };
  }

  throw new Error(`Unsupported source_type for save: ${st}`);
}

function looksLikeAiPromptJsonBody(s) {
  if (!s || typeof s !== 'string') return false;
  const lower = s.toLowerCase();
  return (
    (lower.includes('"messages"') || lower.includes("'messages'")) &&
    (lower.includes('system') || lower.includes('user') || lower.includes('assistant'))
  );
}

function looksLikeAiCode(s) {
  if (!s || typeof s !== 'string') return false;
  return s.length > 80 && (s.includes('당신은') || s.includes('You are') || s.includes('검수'));
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/prompt-slots', auth, async (_req, res) => {
  try {
    const { data: slots, error } = await sb
      .from('ai_prompt_slots')
      .select('*')
      .neq('status', 'archived')
      .order('workflow_name', { ascending: true });
    if (error) throw error;

    const enriched = [];
    for (const slot of slots || []) {
      try {
        const r = await resolveSlotContent(slot);
        const { data: revs } = await sb
          .from('ai_prompt_revisions')
          .select('id, created_at, note, created_by')
          .eq('slot_id', slot.id)
          .order('created_at', { ascending: false })
          .limit(30);
        enriched.push({
          ...slot,
          current_content: r.text,
          content_meta: r.meta,
          content_field: r.field,
          revisions_preview: revs || [],
        });
      } catch (e) {
        enriched.push({
          ...slot,
          current_content: '',
          resolve_error: e.message,
          revisions_preview: [],
        });
      }
    }

    const byWorkflow = {};
    for (const row of enriched) {
      const wk = row.workflow_name || row.workflow_id || '기타';
      if (!byWorkflow[wk]) byWorkflow[wk] = { workflow_id: row.workflow_id, workflow_name: row.workflow_name, slots: [] };
      byWorkflow[wk].slots.push(row);
    }

    res.json({ workflows: byWorkflow, slots: enriched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/prompt-slots/:id/revisions', auth, async (req, res) => {
  try {
    const { data, error } = await sb
      .from('ai_prompt_revisions')
      .select('id, content, note, created_by, created_at')
      .eq('slot_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ revisions: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/prompt-slots/:id', auth, async (req, res) => {
  try {
    const { content, note, created_by } = req.body || {};
    if (typeof content !== 'string') return res.status(400).json({ error: 'content (string) required' });

    const { data: slot, error } = await sb.from('ai_prompt_slots').select('*').eq('id', req.params.id).single();
    if (error || !slot) return res.status(404).json({ error: 'Slot not found' });

    if (slot.source_type === 'prompt_templates_key' && slot.template_key === 'rewrite_instruction') {
      try {
        JSON.parse(content);
      } catch (e) {
        return res.status(400).json({ error: 'rewrite_instruction must be valid JSON: ' + e.message });
      }
    }

    const result = await applySlotContent(slot, content, created_by, note);
    await sb.from('ai_prompt_slots').update({ updated_at: new Date().toISOString() }).eq('id', slot.id);

    const { data: revs } = await sb
      .from('ai_prompt_revisions')
      .select('id, created_at, note, created_by')
      .eq('slot_id', slot.id)
      .order('created_at', { ascending: false })
      .limit(30);

    res.json({ ok: true, result, revisions_preview: revs || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/prompt-slots/:id/rollback', auth, async (req, res) => {
  try {
    const { revision_id, created_by } = req.body || {};
    if (!revision_id) return res.status(400).json({ error: 'revision_id required' });

    const { data: slot, error: sErr } = await sb.from('ai_prompt_slots').select('*').eq('id', req.params.id).single();
    if (sErr || !slot) return res.status(404).json({ error: 'Slot not found' });

    const { data: rev, error: rErr } = await sb
      .from('ai_prompt_revisions')
      .select('*')
      .eq('id', revision_id)
      .eq('slot_id', slot.id)
      .single();
    if (rErr || !rev) return res.status(404).json({ error: 'Revision not found' });

    const result = await applySlotContent(slot, rev.content, created_by, `rollback→revision ${revision_id}`);
    await sb.from('ai_prompt_slots').update({ updated_at: new Date().toISOString() }).eq('id', slot.id);

    res.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/prompt-slots/sync-n8n', auth, async (_req, res) => {
  try {
    const list = await n8nFetch('/api/v1/workflows');
    const workflows = Array.isArray(list?.data)
      ? list.data
      : Array.isArray(list)
        ? list
        : [];
    let created = 0;
    let updated = 0;

    for (const w of workflows) {
      if (!w?.id || !w?.nodes) continue;
      const wfDetail = await n8nFetch(`/api/v1/workflows/${w.id}`);
      const name = wfDetail.name || w.name || w.id;
      for (const node of wfDetail.nodes || []) {
        const type = node.type || '';
        if (type === 'n8n-nodes-base.httpRequest') {
          const jb = node.parameters?.jsonBody;
          if (typeof jb === 'string' && looksLikeAiPromptJsonBody(jb)) {
            const stable_key = `n8n:${wfDetail.id}:${node.id}:jsonBody`;
            const row = {
              stable_key,
              workflow_id: wfDetail.id,
              workflow_name: name,
              node_id: node.id,
              node_name: node.name,
              slot_label: `${node.name} · HTTP jsonBody`,
              source_type: 'n8n_http_jsonbody',
              template_key: null,
              scan_meta: { workflow_id: wfDetail.id, node_id: node.id, field: 'jsonBody' },
              status: 'pending_review',
              updated_at: new Date().toISOString(),
            };
            const { data: ex } = await sb.from('ai_prompt_slots').select('id').eq('stable_key', stable_key).maybeSingle();
            if (ex) {
              await sb.from('ai_prompt_slots').update(row).eq('id', ex.id);
              updated++;
            } else {
              await sb.from('ai_prompt_slots').insert({ ...row, status: 'pending_review' });
              created++;
            }
          }
        }
        if (type === 'n8n-nodes-base.code') {
          const code = node.parameters?.jsCode || node.parameters?.code || '';
          if (typeof code === 'string' && looksLikeAiCode(code)) {
            const stable_key = `n8n:${wfDetail.id}:${node.id}:jsCode`;
            const row = {
              stable_key,
              workflow_id: wfDetail.id,
              workflow_name: name,
              node_id: node.id,
              node_name: node.name,
              slot_label: `${node.name} · Code (프롬프트성 문자열)`,
              source_type: 'n8n_code_jscode',
              template_key: null,
              scan_meta: { workflow_id: wfDetail.id, node_id: node.id, field: 'jsCode' },
              status: 'pending_review',
              updated_at: new Date().toISOString(),
            };
            const { data: ex } = await sb.from('ai_prompt_slots').select('id').eq('stable_key', stable_key).maybeSingle();
            if (ex) {
              await sb.from('ai_prompt_slots').update(row).eq('id', ex.id);
              updated++;
            } else {
              await sb.from('ai_prompt_slots').insert({ ...row, status: 'pending_review' });
              created++;
            }
          }
        }
      }
    }

    res.json({ ok: true, workflows_scanned: workflows.length, slots_created: created, slots_updated: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message, detail: e.body });
  }
});

app.listen(PORT, () => {
  console.log(`cadam-prompt-bff listening on :${PORT}`);
});
