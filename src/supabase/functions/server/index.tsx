import { Hono, Context } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createClient, User } from '@supabase/supabase-js'

// =================================================================================
// --- TIPAGEM E INICIALIZAÇÃO ---
// =================================================================================

type HonoContext = { Variables: { user: User } }
const app = new Hono<HonoContext>()

app.use('*', cors({ origin: '*', allowHeaders: ['*'], allowMethods: ['*'] }))
app.use('*', logger(console.log))

const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

// =================================================================================
// --- FUNÇÕES AUXILIARES DE MAPEAMENTO (TRADUTORES) ---
// =================================================================================

const toSnakeCase = (obj: any) => {
  if (!obj) return null;
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
};

const toCamelCase = (obj: any) => {
  if (!obj) return null;
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
};

// =================================================================================
// --- MIDDLEWARE DE AUTENTICAÇÃO ---
// =================================================================================

async function requireAuth(c: Context, next: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1]
  if (!accessToken) return c.json({ error: 'Token de acesso não fornecido' }, 401)
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) return c.json({ error: 'Token inválido ou expirado' }, 401)
  
  c.set('user', user)
  await next()
}

// =================================================================================
// --- ROTAS DA API ---
// =================================================================================

// --- Pacientes ---
app.post('/make-server-f78aeac5/patients', requireAuth, async (c) => {
  const patientData = await c.req.json();
  const user = c.get('user');
  
  // 1. Traduz do frontend (camelCase) para o banco (snake_case)
  const patientToInsert = toSnakeCase({ ...patientData, createdBy: user.id });

  const { data, error } = await supabase.from('patients').insert(patientToInsert).select().single();
  if (error) return c.json({ error: error.message }, 500);

  // 2. Traduz a resposta do banco (snake_case) de volta para o frontend (camelCase)
  return c.json({ success: true, patient: toCamelCase(data) });
});

app.get('/make-server-f78aeac5/patients/search', requireAuth, async (c) => {
  const query = c.req.query('q') || '';
  const { data, error } = await supabase.from('patients').select('*').or(`name.ilike.%${query}%,cpf.ilike.%${query}%`);
  if (error) return c.json({ error: error.message }, 500);

  // 3. Traduz CADA paciente da lista para o formato do frontend
  return c.json({ patients: data.map(toCamelCase) });
});

app.patch('/make-server-f78aeac5/patients/:id', requireAuth, async (c) => {
    const { id } = c.req.param();
    const patientData = await c.req.json();
    
    // Converte TODO o objeto para snake_case antes de atualizar
    const patientToUpdate = toSnakeCase(patientData);

    const { data, error } = await supabase.from('patients').update(patientToUpdate).eq('id', id).select().single();
    if (error) return c.json({ error: error.message }, 500);

    // Converte a resposta de volta para camelCase
    return c.json({ success: true, patient: toCamelCase(data) });
});

app.delete('/make-server-f78aeac5/patients/:id', requireAuth, async (c) => {
    const { id } = c.req.param();
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
});

// --- Serviços ---
app.post('/make-server-f78aeac5/services', requireAuth, async (c) => {
  const serviceData = await c.req.json();
  const user = c.get('user');
  const { data, error } = await supabase.from('services').insert({ ...serviceData, created_by: user.id }).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true, service: data });
});

app.get('/make-server-f78aeac5/services', requireAuth, async (c) => {
  const { data, error } = await supabase.from('services').select('*');
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ services: data });
});

app.patch('/make-server-f78aeac5/services/:id', requireAuth, async (c) => {
    const serviceId = c.req.param('id');
    const serviceData = await c.req.json();
    const { data, error } = await supabase.from('services').update(serviceData).eq('id', serviceId).select().single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, service: data });
});

app.delete('/make-server-f78aeac5/services/:id', requireAuth, async (c) => {
    const serviceId = c.req.param('id');
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
});

// --- Atendimentos ---
app.post('/make-server-f78aeac5/appointments', requireAuth, async (c) => {
  const { patient_id, total_amount, insurance_type, services } = await c.req.json();
  const user = c.get('user');
  const { data: appointment, error } = await supabase.from('appointments').insert({ patient_id, total_amount, insurance_type, created_by: user.id }).select().single();
  if (error) return c.json({ error: error.message }, 500);

  const appointmentServices = services.map((serviceId: string) => ({ appointment_id: appointment.id, service_id: serviceId }));
  const { error: servicesError } = await supabase.from('appointment_services').insert(appointmentServices);
  if (servicesError) return c.json({ error: servicesError.message }, 500);

  return c.json({ success: true, appointment });
});

app.get('/make-server-f78aeac5/appointments', requireAuth, async (c) => {
  const { data, error } = await supabase.from('appointments').select(`*, patient:patients(name), appointment_services(service:services(name))`);
  if (error) return c.json({ error: error.message }, 500);
  const formattedData = data.map(apt => ({ ...apt, patientName: apt.patient?.name, services: apt.appointment_services.map((as: any) => as.service) }));
  return c.json({ appointments: formattedData });
});

app.patch('/make-server-f78aeac5/appointments/:id/status', requireAuth, async (c) => {
  const { id } = c.req.param();
  const { status } = await c.req.json();
  const { data, error } = await supabase.from('appointments').update({ status }).eq('id', id).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true, appointment: data });
});

app.delete('/make-server-f78aeac5/appointments/:id', requireAuth, async (c) => {
  const { id } = c.req.param();
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// --- Dashboard ---
app.get('/make-server-f78aeac5/dashboard/stats', requireAuth, async (c) => {
    const { data: appointments, error } = await supabase.from('appointments').select('*');
    if (error) return c.json({ error: error.message }, 500);
    
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(apt => apt.created_at.startsWith(today));
    const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.total_amount || 0), 0);
    const todayRevenue = todayAppointments.reduce((sum, apt) => sum + (apt.total_amount || 0), 0);
    const statusCounts = appointments.reduce((counts: any, apt) => {
      counts[apt.status] = (counts[apt.status] || 0) + 1;
      return counts;
    }, {});
    
    return c.json({
      totalAppointments: appointments.length,
      todayAppointments: todayAppointments.length,
      totalRevenue,
      todayRevenue,
      statusCounts
    });
});

export default app;