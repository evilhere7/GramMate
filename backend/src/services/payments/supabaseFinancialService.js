import { createClient } from '@supabase/supabase-js';
import config from '../../config.js';

const supabase = config.supabaseUrl && config.supabaseServiceRoleKey
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } })
  : null;

function requireSupabase() {
  if (!supabase) {
    const error = new Error('Supabase financial service is not configured on the server.');
    error.status = 503;
    throw error;
  }
  return supabase;
}

export async function recordWebhookEvent({ provider, event }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('payment_webhook_events')
    .insert({
      provider,
      event_id: event.id,
      event_type: event.type,
      payload: event,
      processed: false,
    })
    .select('id,processed')
    .maybeSingle();

    if (error?.code === '23505') {
      const { data: existing, error: lookupError } = await client
        .from('payment_webhook_events')
        .select('id,processed')
        .eq('provider', provider)
        .eq('event_id', event.id)
        .maybeSingle();
      if (lookupError) throw lookupError;
      return { duplicate: true, processed: Boolean(existing?.processed) };
    }
  if (error) throw error;
  return { duplicate: false, event: data };
}

export async function markWebhookProcessed(provider, eventId) {
  const client = requireSupabase();
    const { error } = await client
      .from('payment_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('provider', provider)
      .eq('event_id', eventId);
  if (error) throw error;
}