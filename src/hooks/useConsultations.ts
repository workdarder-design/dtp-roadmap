import { useCallback, useEffect, useState } from "react";
import type { Consultation } from "@/lib/roadmap/consultations";
import {
  createConsultationRecord,
  deleteConsultationRecord,
  fetchConsultations,
  fetchConsultationBySlug,
} from "@/lib/services/consultations";

export function useConsultations() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchConsultations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load consultations");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    loading,
    error,
    refresh,
    create: createConsultationRecord,
    remove: deleteConsultationRecord,
  };
}

export function useConsultationBySlug(slug: string) {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchConsultationBySlug(slug)
      .then((c) => {
        if (!cancelled) setConsultation(c);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load consultation");
          setConsultation(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { consultation, loading, error };
}
