import { z } from "zod";
import { env } from "./env";

const BASE = env.NEXT_PUBLIC_API_BASE_URL;

/** Centralized fetch + zod parse. Responses are validated, never trusted raw. */
async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", ...init });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`API ${res.status} on ${path}${detail ? `: ${detail}` : ""}`);
  }
  return schema.parse(await res.json());
}

// --- Health ----------------------------------------------------------------

export const healthSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  version: z.string(),
  environment: z.string(),
});
export type Health = z.infer<typeof healthSchema>;

export function fetchHealth(signal?: AbortSignal): Promise<Health> {
  return request("/health", healthSchema, { signal });
}

// --- Banking knowledge base ------------------------------------------------

export const bankingProcessSchema = z.object({
  intent_key: z.string(),
  display_name: z.string(),
  required_documents: z.array(z.string()),
  steps: z.array(z.string()),
  keywords: z.array(z.string()),
});
export type BankingProcess = z.infer<typeof bankingProcessSchema>;

export function fetchBankingProcesses(signal?: AbortSignal): Promise<BankingProcess[]> {
  return request("/banking-processes", z.array(bankingProcessSchema), { signal });
}

// --- Conversations & turns -------------------------------------------------

const startConversationSchema = z.object({
  conversation_id: z.string(),
  customer_id: z.string().nullable(),
});

export function startConversation(): Promise<{ conversation_id: string }> {
  return request("/conversations", startConversationSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

export const turnAnalysisSchema = z.object({
  intent: z.string(),
  confidence: z.number(),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  escalate: z.boolean(),
  suggested_guidance: z.array(z.string()),
  required_documents: z.array(z.string()),
});
export type TurnAnalysis = z.infer<typeof turnAnalysisSchema>;

export const customerTurnSchema = z.object({
  original_text: z.string(),
  original_lang: z.string(),
  translated_text: z.string(),
  translated_lang: z.string(),
  analysis: turnAnalysisSchema,
});
export type CustomerTurn = z.infer<typeof customerTurnSchema>;

export function sendCustomerTurn(
  conversationId: string,
  audio: Blob,
): Promise<CustomerTurn> {
  const form = new FormData();
  const ext = audio.type.includes("wav") ? "wav" : "webm";
  form.append("audio", audio, `turn.${ext}`);
  return request(`/conversations/${conversationId}/turn/customer`, customerTurnSchema, {
    method: "POST",
    body: form,
  });
}

export const staffTurnSchema = z.object({
  translated_text: z.string(),
  translated_lang: z.string(),
  audio_base64: z.string().nullable(),
});
export type StaffTurn = z.infer<typeof staffTurnSchema>;

export function sendStaffTurn(
  conversationId: string,
  text: string,
  lang: string,
): Promise<StaffTurn> {
  return request(`/conversations/${conversationId}/turn/staff`, staffTurnSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
  });
}

// --- Dashboard reads -------------------------------------------------------

export const conversationListItemSchema = z.object({
  id: z.string(),
  customer_id: z.string().nullable(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  primary_intent: z.string().nullable(),
  escalated: z.boolean(),
  utterance_count: z.number(),
});
export type ConversationListItem = z.infer<typeof conversationListItemSchema>;

export function listConversations(
  branchId?: string,
  signal?: AbortSignal,
): Promise<ConversationListItem[]> {
  const q = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : "";
  return request(`/conversations${q}`, z.array(conversationListItemSchema), { signal });
}

export const utteranceSchema = z.object({
  speaker: z.enum(["customer", "staff"]),
  original_text: z.string(),
  original_lang: z.string(),
  translated_text: z.string().nullable(),
  translated_lang: z.string().nullable(),
  sentiment: z.string().nullable(),
  created_at: z.string(),
});

export const conversationDetailSchema = z.object({
  id: z.string(),
  customer_id: z.string().nullable(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  primary_intent: z.string().nullable(),
  sentiment_label: z.string().nullable(),
  escalated: z.boolean(),
  utterances: z.array(utteranceSchema),
});
export type ConversationDetail = z.infer<typeof conversationDetailSchema>;

export function getConversation(
  id: string,
  signal?: AbortSignal,
): Promise<ConversationDetail> {
  return request(`/conversations/${id}`, conversationDetailSchema, { signal });
}
