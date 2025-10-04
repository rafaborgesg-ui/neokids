import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { projectId } from '@/utils/supabase/info';
import { Service } from '@/types';

export const useServices = (accessToken: string) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/services`,
        { 
          headers: { 'Authorization': `Bearer ${accessToken}` },
          cache: 'no-store'
        }
      );
      if (!response.ok) throw new Error("Falha ao buscar serviços.");
      const data = await response.json();
      setServices(data.services || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  return { services, loading, fetchServices, setServices };
};
