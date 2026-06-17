import { z } from "zod";
import { env } from "./env";

/** Schema for the backend health response; responses are validated, never trusted raw. */
export const healthSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  version: z.string(),
  environment: z.string(),
});

export type Health = z.infer<typeof healthSchema>;

/** Fetch and validate the backend health status. Throws on network or schema errors. */
export async function fetchHealth(signal?: AbortSignal): Promise<Health> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/health`, {
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}`);
  }
  return healthSchema.parse(await res.json());
}
