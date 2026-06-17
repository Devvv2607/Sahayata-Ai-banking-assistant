import { z } from "zod";

/**
 * Validated public environment. Only NEXT_PUBLIC_* values are available in the browser.
 * Parsing here fails fast (at import time) on misconfiguration instead of producing
 * confusing runtime errors deep in the UI.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:8000"),
});

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});
