import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { projectId } from '@/utils/supabase/info';
import { Appointment } from '@/types';

export const useAppointments = (accessToken: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/appointments`,
        { 
          headers: { 'Authorization': `Bearer ${accessToken}` },
          cache: 'no-store'
        }
      );
      if (!response.ok) throw new Error("Falha ao buscar atendimentos.");
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  return { appointments, loading, fetchAppointments, setAppointments };
};
