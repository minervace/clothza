// ============================================================
// lib/supabaseMessages.ts — Clothza v5.0
// Threaded conversations between a customer and a shop.
// ============================================================

import supabase, { isSupabaseConfigured } from '@/lib/supabase';

export interface Conversation {
  id:           string;
  storeId:      string;
  customerId:   string;
  customerName: string;
  lastMessage:  string | null;
  lastAt:       string;
  storeName?:   string;
}

export interface ChatMessage {
  id:       string;
  senderId: string;
  body:     string;
  createdAt: string;
}

type Row = Record<string, unknown>;

const mapConversation = (r: Row): Conversation => ({
  id:           String(r['id']),
  storeId:      String(r['store_id']),
  customerId:   String(r['customer_id']),
  customerName: String(r['customer_name'] ?? ''),
  lastMessage:  (r['last_message'] as string) ?? null,
  lastAt:       String(r['last_at'] ?? ''),
  storeName:    (r['stores'] as Row | undefined)?.['name'] as string | undefined,
});

const mapMessage = (r: Row): ChatMessage => ({
  id:        String(r['id']),
  senderId:  String(r['sender_id']),
  body:      String(r['body'] ?? ''),
  createdAt: String(r['created_at'] ?? ''),
});

/** Conversations for the shop the signed-in seller owns. */
export async function fetchStoreConversations(): Promise<Conversation[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('conversations')
    .select('*, stores(name)')
    .order('last_at', { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map(mapConversation);
}

/** Conversations the signed-in customer started. */
export async function fetchMyConversations(): Promise<Conversation[]> {
  if (!isSupabaseConfigured) return [];
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('conversations')
    .select('*, stores(name)')
    .eq('customer_id', uid)
    .order('last_at', { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map(mapConversation);
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at');
  if (error || !data) return [];
  return (data as Row[]).map(mapMessage);
}

export async function startConversation(storeId: string, body: string): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };
  const { data, error } = await supabase.rpc('start_conversation', { p_store: storeId, p_body: body });
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: String(data) };
}

export async function replyToConversation(conversationId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };
  const { error } = await supabase.rpc('reply_to_conversation', { p_conversation: conversationId, p_body: body });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
