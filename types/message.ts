// ============================================
// Types & schémas Zod pour la messagerie interne (DM)
// ============================================

import { z } from 'zod';

// ============================================
// Payload d'envoi de message
// ============================================
export const SendMessageInputSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Message vide')
    .max(2000, 'Message trop long (2000 caractères max)'),
});

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

// ============================================
// Payload de création de conversation
// ============================================
export const CreateConversationInputSchema = z.object({
  recipient_id: z.string().uuid('UUID destinataire invalide'),
});

// ============================================
// Conversation telle qu'elle ressort de l'API (liste de mes conversations)
// ============================================
export interface ConversationListItem {
  id: string;
  /** L'autre participant (pas moi) — déjà joint au profil pour l'UI */
  other: {
    id: string;
    pseudo: string;
    avatar_url: string | null;
    city: string | null;
    level: string | null;
  };
  /** Dernier message (preview du body) — null si conversation vide */
  last_message: {
    body: string;
    sender_id: string;
    created_at: string;
    read_at: string | null;
  } | null;
  last_message_at: string;
  /** Messages non lus pour moi (le destinataire) */
  unread_count: number;
}

// ============================================
// Message tel qu'il ressort de l'API (vue d'une conversation)
// ============================================
export interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}
