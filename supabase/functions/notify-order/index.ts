// ============================================================
// supabase/functions/notify-order/index.ts
// Sends queued order notifications. Called by pg_cron (or manually)
// with the service role key, so the WhatsApp token never reaches a
// browser.
//
// Deploy:  supabase functions deploy notify-order
// Secrets: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID  (Meta Cloud API)
//          (optional) WHATSAPP_TEMPLATE_NAME  — required for messages
//          outside a 24h customer service window
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface NotifyRow {
  id: string;
  order_id: string;
  recipient: string | null;
  payload: Record<string, unknown>;
  channel: string;
}

const TOKEN = Deno.env.get('WHATSAPP_TOKEN') ?? '';
const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID') ?? '';
const TEMPLATE = Deno.env.get('WHATSAPP_TEMPLATE_NAME') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const normalise = (raw: string): string =>
  raw.replace(/[^\d]/g, '').replace(/^0+/, '971'); // strip, then assume country code

async function send(recipient: string, text: string): Promise<{ ok: boolean; error?: string }> {
  if (!TOKEN || !PHONE_ID) return { ok: false, error: 'WhatsApp secrets not configured' };

  const to = normalise(recipient);

  const body = TEMPLATE
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: TEMPLATE,
          language: { code: 'en' },
          components: [{ type: 'body', parameters: [{ type: 'text', text }] }],
        },
      }
    : {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      };

  const res = await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, error: `${res.status}: ${detail.slice(0, 240)}` };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  // Only the service role may invoke this
  const auth = req.headers.get('authorization') ?? '';
  if (!SERVICE_KEY || auth !== `Bearer ${SERVICE_KEY}`) {
    return new Response('unauthorised', { status: 401 });
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: rows, error } = await db
    .from('order_notifications')
    .select('id, order_id, recipient, payload, channel')
    .eq('status', 'queued')
    .order('created_at')
    .limit(20);

  if (error) return new Response(error.message, { status: 500 });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const row of (rows ?? []) as NotifyRow[]) {
    if (row.channel !== 'whatsapp' || !row.recipient) {
      await db.from('order_notifications')
        .update({ status: 'skipped', error: 'no recipient or unsupported channel' })
        .eq('id', row.id);
      results.push({ id: row.id, ok: false, error: 'skipped' });
      continue;
    }

    const p = row.payload as Record<string, string | number>;
    const text = p['audience'] === 'customer'
      ? `Clothza: your order ${p['tracking']} is now ${p['status']}.`
      : `New order ${p['tracking']} — ${p['items']} item(s), ${p['total']} NPR, ` +
        `for ${p['customer'] ?? 'a customer'} in ${p['city'] ?? 'Nepal'} ` +
        `(${p['method']}). Pack it and mark it shipped in your Clothza dashboard.`;

    const result = await send(row.recipient, text);

    await db.from('order_notifications').update(
      result.ok
        ? { status: 'sent', sent_at: new Date().toISOString(), error: null }
        : { status: 'failed', error: result.error ?? 'unknown' }
    ).eq('id', row.id);

    results.push({ id: row.id, ...result });
  }

  return Response.json({ processed: results.length, results });
});
