import { useState } from "react";
import { writeEnvVariables } from "../services/envWriterService";

interface UseEnvWriterOptions {
  onError?: (error: string) => void;
}

/**
 * Hook for writing environment variables to .env file
 *
 * Uses the dev-only API endpoint to write VITE_ prefixed environment variables.
 * This is part of the app code modification feature.
 */
export const useEnvWriter = ({ onError }: UseEnvWriterOptions = {}) => {
  const [envWritten, setEnvWritten] = useState(false);
  const [writingEnv, setWritingEnv] = useState(false);

  const writeEnv = async (variables: Record<string, string>) => {
    setWritingEnv(true);
    try {
      const result = await writeEnvVariables(variables);

      if (result.success) {
        setEnvWritten(true);
        return { success: true };
      } else {
        const error = result.error || "Failed to write environment variables";
        onError?.(error);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to write environment variables";
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setWritingEnv(false);
    }
  };

  return {
    envWritten,
    writingEnv,
    writeEnv,
  };
};
