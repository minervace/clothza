// ============================================================
// components/messages/ConversationView.tsx
// Two-pane inbox: thread list on the left, messages and a reply
// box on the right. Used by the seller dashboard and the
// customer's account page.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/lib/toast';
import { formatRelativeTime } from '@/lib/formatters';
import {
  fetchMessages, replyToConversation,
  type Conversation, type ChatMessage,
} from '@/lib/supabaseMessages';

interface Props {
  conversations: Conversation[];
  meId:         string;
  /** Label for the other party — shop name for customers, customer name for sellers. */
  titleOf:      (c: Conversation) => string;
  emptyHint?:   string;
  onReplied?:   () => void;
}

export function ConversationView({ conversations, meId, titleOf, emptyHint, onReplied }: Props) {
  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [showList, setShowList] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find(c => c.id === activeId) ?? null;

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    let cancelled = false;
    void fetchMessages(activeId).then(m => { if (!cancelled) setMessages(m); });
    return () => { cancelled = true; };
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !activeId) return;
    setBusy(true);
    try {
      const r = await replyToConversation(activeId, body);
      if (!r.ok) { toast.error(r.error ?? 'Could not send'); return; }
      setDraft('');
      setMessages(await fetchMessages(activeId));
      onReplied?.();
    } finally { setBusy(false); }
  };

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon="MessageCircle"
        title="No messages yet"
        description={emptyHint ?? 'Conversations will appear here.'}
        compact
      />
    );
  }

  return (
    <div className="conversation-shell">
      {/* Thread list */}
      <div className={showList ? 'conversation-list' : 'conversation-list conversation-list--hidden'}>
        {conversations.map(c => {
          const isActive = c.id === activeId;
          const preview = c.lastMessage ?? '';
          return (
            <button
              key={c.id}
              onClick={() => { setActiveId(c.id); setShowList(false); }}
              aria-current={isActive ? 'true' : undefined}
              className={isActive ? 'conversation-item conversation-item--active' : 'conversation-item'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>
                  {titleOf(c)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {c.lastAt ? formatRelativeTime(c.lastAt) : ''}
                </span>
              </div>
              <div style={{
                fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginTop: 3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {preview.length > 60 ? `${preview.slice(0, 60)}…` : preview}
              </div>
            </button>
          );
        })}
      </div>

      {/* Thread */}
      <div className={showList ? 'conversation-thread conversation-thread--hidden' : 'conversation-thread'}>
        {active ? (
          <>
            <div className="conversation-thread__head">
              <button
                className="btn btn-ghost btn-sm conversation-back"
                onClick={() => setShowList(true)}
                aria-label="Back to conversations"
              >
                <ArrowLeft size={15} />
              </button>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>
                  {titleOf(active)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {messages.length} message{messages.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            <div className="conversation-thread__body">
              {messages.map(m => {
                const mine = m.senderId === meId;
                return (
                  <div key={m.id} className={mine ? 'bubble bubble--mine' : 'bubble bubble--theirs'}>
                    <div className="bubble__body">{m.body}</div>
                    <div className="bubble__time">{formatRelativeTime(m.createdAt)}</div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="conversation-thread__compose">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
                }}
                placeholder="Write a reply…"
                rows={2}
                className="input-base"
                style={{ resize: 'none', flex: 1, fontFamily: 'var(--font-sans)' }}
                aria-label="Reply"
              />
              <Button variant="accent" isLoading={busy} onClick={send} disabled={!draft.trim()}>
                <Send size={14} />
              </Button>
            </div>
          </>
        ) : (
          <div style={{ padding: 24, color: 'var(--text-tertiary)', fontSize: 'var(--text-body)' }}>
            Choose a conversation.
          </div>
        )}
      </div>
    </div>
  );
}
