import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { projectId } from '@/utils/supabase/info';
import { Patient } from '@/types';

export const usePatients = (accessToken: string) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPatients = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/patients/search?q=${query}`,
        { 
          headers: { 'Authorization': `Bearer ${accessToken}` },
          cache: 'no-store'
        }
      );
      if (!response.ok) throw new Error("Falha ao buscar pacientes.");
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  return { patients, loading, fetchPatients, setPatients };
};
