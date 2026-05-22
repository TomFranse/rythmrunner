/**
 * Shared query keys for cross-cutting data.
 * Feature-specific keys live in features/[feature]/api/keys.ts.
 */

export const sharedQueryKeys = {
  all: ["app"] as const,
} as const;
