import { useState } from "react";
import {
  isAirtableConfigured,
  testAirtableConnection,
  getAirtableTableStructure,
  type AirtableTableStructure,
} from "@shared/services/airtableService";

/**
 * Hook for Airtable setup functionality.
 * Provides configuration check, connection testing, and table structure fetching.
 * Wraps service calls to follow architecture rules (components cannot import services directly).
 */
export const useAirtableSetup = () => {
  const isConfigured = isAirtableConfigured();
  const [tableStructure, setTableStructure] = useState<AirtableTableStructure | null>(null);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);

  const fetchTableStructure = async (apiKey: string, baseId: string, tableId: string) => {
    setLoadingStructure(true);
    setStructureError(null);
    setTableStructure(null);

    try {
      const result = await getAirtableTableStructure(apiKey, baseId, tableId);
      if (result.success && result.data) {
        setTableStructure(result.data);
        setStructureError(null);
      } else {
        setStructureError(result.error || "Failed to fetch table structure");
        setTableStructure(null);
      }
    } catch (error) {
      setStructureError(error instanceof Error ? error.message : "Failed to fetch table structure");
      setTableStructure(null);
    } finally {
      setLoadingStructure(false);
    }
  };

  const resetStructure = () => {
    setTableStructure(null);
    setStructureError(null);
    setLoadingStructure(false);
  };

  return {
    isConfigured,
    testAirtableConnection,
    fetchTableStructure,
    tableStructure,
    loadingStructure,
    structureError,
    resetStructure,
  };
};
