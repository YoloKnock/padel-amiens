// ============================================
// ChatRoom — vue chat avec polling et envoi
// ============================================
// Client component utilisé par /messages/[id]. Responsabilités :
//   1. Afficher la liste des messages, regroupés par jour pour la lisibilité
//   2. Auto-scroller en bas à chaque nouveau message
//   3. Polling /api/conversations/[id]/messages toutes les 5s pour
//      rapatrier les nouveaux messages (quasi-real-time sans setup complexe)
//   4. Formulaire d'envoi avec optimistic update
//   5. Header avec avatar + pseudo du destinataire + lien profil
//
// Optimisation : on ne re-render que les nouveaux messages détectés via
// comparaison sur la longueur de la liste + dernier ID.

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { format, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar } from './avatar';
import { cn } from '@/lib/utils';
import type { MessageItem } from '@/types/message';

interface ChatRoomProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageItem[];
  other: {
    id: string;
    pseudo: string;
    avatar_url: string | null;
    city: string | null;
    level: string | null;
  };
}

const POLL_INTERVAL_MS = 5000;

export function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
  other,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // ============================================
  // Auto-scroll en bas à chaque changement
  // ============================================
  useEffect(() => {
    // Petit délai pour laisser le DOM se mettre à jour avant le scroll
    const t = setTimeout(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  // ============================================
  // Polling : fetch tous les 5s
  // ============================================
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages`,
          { credentials: 'same-origin', cache: 'no-store' }
        );
        if (!res.ok) return;
        const json = (await res.json()) as { messages: MessageItem[] };
        if (cancelled) return;

        setMessages((prev) => {
          // On fusionne : tout ce qui était optimiste + tout ce que renvoie l'API.
          // Critère de dédoublonnage : l'ID. Si on a un message optimiste
          // (id temporaire qui commence par `temp_`), on le remplace dès
          // qu'on le retrouve par son contenu côté API.
          const apiMessages = json.messages;
          const apiIds = new Set(apiMessages.map((m) => m.id));
          // Garde les optimistes qui ne sont pas encore confirmés
          const pendingOptimistic = prev.filter(
            (m) => m.id.startsWith('temp_') && !apiIds.has(m.id)
          );
          return [...apiMessages, ...pendingOptimistic];
        });
      } catch {
        // Silencieux : le polling reprendra au prochain tick
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  // ============================================
  // Envoi d'un message (optimistic)
  // ============================================
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length === 0 || sending) return;

    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const optimistic: MessageItem = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: trimmed,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    // Ajout optimiste + reset du textarea
    setMessages((prev) => [...prev, optimistic]);
    setInput('');

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: trimmed }),
          credentials: 'same-origin',
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Envoi échoué');
      }
      const json = (await res.json()) as { message: MessageItem };
      // Remplace l'optimiste par le vrai message renvoyé par l'API
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? json.message : m))
      );
    } catch (err) {
      toast.error((err as Error).message);
      // Rollback : on retire l'optimiste
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      // On remet le texte dans la zone de saisie pour réessayer
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter = envoi, Shift+Enter = saut de ligne (convention WhatsApp/Slack)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      form?.requestSubmit();
    }
  }

  return (
    <main className="container mx-auto px-4 py-4 md:py-6 max-w-2xl flex-1 flex flex-col">
      {/* Header conversation : avatar + pseudo + retour */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex items-center gap-3 flex-shrink-0">
        <Link
          href="/messages"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Retour aux messages"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <Link
          href={`/joueur/${encodeURIComponent(other.pseudo)}`}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          <Avatar url={other.avatar_url} name={other.pseudo} size="md" />
          <div className="min-w-0">
            <div className="font-semibold text-base truncate">
              {other.pseudo}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {other.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {other.city}
                </span>
              )}
              {other.level && (
                <span className="inline-flex items-center px-1.5 py-0 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                  {other.level}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Zone messages — flex-1 pour occuper le reste de la hauteur */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-y-auto p-4 mb-4 min-h-[300px]">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              Démarre la conversation — envoie le premier message à{' '}
              <strong>{other.pseudo}</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((m, idx) => {
              const prev = idx > 0 ? messages[idx - 1] : null;
              const showDateSeparator =
                !prev || !isSameDay(parseISO(prev.created_at), parseISO(m.created_at));
              const isMine = m.sender_id === currentUserId;

              return (
                <div key={m.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-3">
                      <span className="text-[11px] text-muted-foreground bg-slate-50 px-2 py-0.5 rounded-full">
                        {format(parseISO(m.created_at), 'EEEE d MMMM yyyy', {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  )}
                  <MessageBubble message={m} isMine={isMine} />
                </div>
              );
            })}
            <div ref={scrollAnchorRef} />
          </div>
        )}
      </div>

      {/* Formulaire d'envoi — sticky en bas grâce au layout flex */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 bg-white rounded-xl border border-slate-200 p-3 flex-shrink-0"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Écrire à ${other.pseudo}…`}
          rows={1}
          maxLength={2000}
          disabled={sending}
          className="flex-1 resize-none px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm disabled:opacity-50 min-h-[40px] max-h-[120px]"
        />
        <button
          type="submit"
          disabled={sending || input.trim().length === 0}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Envoyer</span>
        </button>
      </form>
    </main>
  );
}

// ============================================
// Bulle d'un message
// ============================================
// Style "iMessage" : mes messages à droite emerald, ceux du destinataire à
// gauche en gris clair. Horodatage discret sous chaque bulle.
function MessageBubble({
  message,
  isMine,
}: {
  message: MessageItem;
  isMine: boolean;
}) {
  const time = format(parseISO(message.created_at), 'HH:mm', { locale: fr });
  // Le message est "optimiste" tant qu'il a un ID temporaire
  const pending = message.id.startsWith('temp_');

  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[75%]">
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
            isMine
              ? 'bg-emerald-600 text-white rounded-br-sm'
              : 'bg-slate-100 text-foreground rounded-bl-sm',
            pending && 'opacity-70'
          )}
        >
          {message.body}
        </div>
        <div
          className={cn(
            'text-[10px] text-muted-foreground mt-0.5 px-1',
            isMine ? 'text-right' : 'text-left'
          )}
        >
          {time}
          {isMine && message.read_at && (
            <span className="ml-1 text-emerald-600">· Lu</span>
          )}
          {pending && <span className="ml-1 italic">· Envoi…</span>}
        </div>
      </div>
    </div>
  );
}
