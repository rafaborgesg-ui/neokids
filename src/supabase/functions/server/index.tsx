import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createClient } from '@supabase/supabase-js'
import * as kv from './kv_store.ts' // Alterado para .ts

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

app.use('*', logger(console.log))

const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

// Auth middleware
async function requireAuth(c: any, next: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1]
  if (!accessToken) {
    return c.json({ error: 'Token de acesso não fornecido' }, 401)
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user?.id) {
    return c.json({ error: 'Token inválido ou expirado' }, 401)
  }
  
  c.set('userId', user.id)
  c.set('userEmail', user.email)
  await next()
}

// Auth routes
app.post('/make-server-f78aeac5/signup', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true
    })
    
    if (error) {
      console.log('Erro ao criar usuário:', error)
      return c.json({ error: error.message }, 400)
    }
    
    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.log('Erro no signup:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// Initialize demo users
app.post('/make-server-f78aeac5/init-demo', async (c) => {
  try {
    const demoUsers = [
      {
        email: 'admin@neokids.com',
        password: 'admin123',
        name: 'Administrador Neokids',
        role: 'administrador'
      },
      {
        email: 'atendente@neokids.com',
        password: 'atendente123',
        name: 'Maria Silva',
        role: 'atendente'
      },
      {
        email: 'tecnico@neokids.com',
        password: 'tecnico123',
        name: 'João Santos',
        role: 'tecnico'
      }
    ]
    
    const results = []
    
    for (const user of demoUsers) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: { name: user.name, role: user.role },
        email_confirm: true
      })
      
      if (error && !error.message.includes('already exists')) {
        console.log(`Erro ao criar usuário ${user.email}:`, error)
      } else {
        results.push({ email: user.email, success: true })
      }
    }
    
    // Create demo services
    const demoServices = [
      {
        name: 'Hemograma Completo',
        category: 'Análises Clínicas',
        code: 'HG001',
        basePrice: 45.00,
        operationalCost: 12.00,
        estimatedTime: '2-4 horas',
        instructions: 'Não é necessário jejum. Evitar exercícios físicos intensos 24h antes.'
      },
      {
        name: 'Glicemia de Jejum',
        category: 'Análises Clínicas',
        code: 'GL001',
        basePrice: 25.00,
        operationalCost: 6.00,
        estimatedTime: '2 horas',
        instructions: 'Jejum de 8 a 12 horas. Apenas água é permitida.'
      },
      {
        name: 'Radiografia de Tórax',
        category: 'Exames de Imagem',
        code: 'RX001',
        basePrice: 120.00,
        operationalCost: 35.00,
        estimatedTime: '30 minutos',
        instructions: 'Remover objetos metálicos. Evitar roupas com metais.'
      },
      {
        name: 'Ultrassom Abdominal',
        category: 'Exames de Imagem',
        code: 'US001',
        basePrice: 180.00,
        operationalCost: 50.00,
        estimatedTime: '24 horas',
        instructions: 'Jejum de 8 horas. Beber 4 copos de água 1 hora antes do exame.'
      },
      {
        name: 'Vacina Tríplice Viral',
        category: 'Vacinas',
        code: 'VT001',
        basePrice: 85.00,
        operationalCost: 65.00,
        estimatedTime: 'Imediato',
        instructions: 'Criança deve estar saudável. Informar sobre alergias.'
      }
    ]
    
    for (const service of demoServices) {
      const serviceId = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await kv.set(`service:${serviceId}`, {
        id: serviceId,
        ...service,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      })
    }
    
    // Create demo patient
    const demoPatient = {
      id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Ana Clara Silva',
      birthDate: '2018-03-15',
      cpf: '12345678901',
      phone: '11987654321',
      email: 'ana.clara@email.com',
      address: 'Rua das Flores, 123, Vila Nova, São Paulo, SP - 01234-567',
      responsibleName: 'Maria Silva Santos',
      responsibleCpf: '98765432100',
      responsiblePhone: '11987654321',
      specialAlert: 'Alergia a penicilina',
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    }
    
    await kv.set(`patient:${demoPatient.id}`, demoPatient)
    await kv.set(`patient_search:${demoPatient.cpf}`, demoPatient.id)
    
    return c.json({ 
      success: true, 
      message: 'Dados de demonstração criados com sucesso',
      users: results.length,
      services: demoServices.length,
      patients: 1
    })
  } catch (error) {
    console.log('Erro ao inicializar demo:', error)
    return c.json({ error: 'Erro ao inicializar dados de demonstração' }, 500)
  }
})

// Patient routes
app.post('/make-server-f78aeac5/patients', requireAuth, async (c) => {
  try {
    const patientData = await c.req.json()
    const patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const patient = {
      id: patientId,
      ...patientData,
      createdAt: new Date().toISOString(),
  createdBy: c.get && typeof c.get === 'function' ? c.get('userId' as any) : undefined
    }
    
    await kv.set(`patient:${patientId}`, patient)
    await kv.set(`patient_search:${patientData.cpf}`, patientId)
    
    return c.json({ success: true, patient })
  } catch (error) {
    console.log('Erro ao criar paciente:', error)
    return c.json({ error: 'Erro ao criar paciente' }, 500)
  }
})

app.get('/make-server-f78aeac5/patients/search', requireAuth, async (c) => {
  try {
    const query = c.req.query('q')?.toLowerCase() || ''
    
    const allPatients = await kv.getByPrefix('patient:')
    const filteredPatients = allPatients.filter(({ value }: any) => {
      if (!value || typeof value !== 'object') return false
      
      const searchableText = [
        value.name,
        value.cpf,
        value.responsibleName,
        value.phone
      ].join(' ').toLowerCase()
      
      return searchableText.includes(query)
    }).map(({ value }: any) => value)
    
    return c.json({ patients: filteredPatients })
  } catch (error) {
    console.log('Erro na busca de pacientes:', error)
    return c.json({ error: 'Erro na busca de pacientes' }, 500)
  }
})

app.get('/make-server-f78aeac5/patients/:id', requireAuth, async (c) => {
  try {
    const patientId = c.req.param('id')
    const patient = await kv.get(`patient:${patientId}`)
    
    if (!patient) {
      return c.json({ error: 'Paciente não encontrado' }, 404)
    }
    
    return c.json({ patient })
  } catch (error) {
    console.log('Erro ao buscar paciente:', error)
    return c.json({ error: 'Erro ao buscar paciente' }, 500)
  }
})

// Services routes
app.post('/make-server-f78aeac5/services', requireAuth, async (c) => {
  try {
    const serviceData = await c.req.json()
    const serviceId = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const service = {
      id: serviceId,
      ...serviceData,
      createdAt: new Date().toISOString(),
  createdBy: c.get && typeof c.get === 'function' ? c.get('userId' as any) : undefined
    }
    
    await kv.set(`service:${serviceId}`, service)
    
    return c.json({ success: true, service })
  } catch (error) {
    console.log('Erro ao criar serviço:', error)
    return c.json({ error: 'Erro ao criar serviço' }, 500)
  }
})

app.get('/make-server-f78aeac5/services', requireAuth, async (c) => {
  try {
    const services = await kv.getByPrefix('service:')
    const serviceList = services.map(({ value }: any) => value).filter(Boolean)
    
    return c.json({ services: serviceList })
  } catch (error) {
    console.log('Erro ao buscar serviços:', error)
    return c.json({ error: 'Erro ao buscar serviços' }, 500)
  }
})

// Appointments routes
app.post('/make-server-f78aeac5/appointments', requireAuth, async (c) => {
  try {
    const appointmentData = await c.req.json()
    const appointmentId = `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate sample IDs for each service
    const sampleIds = appointmentData.services.map(() => 
      `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    )
    
    const appointment = {
      id: appointmentId,
      ...appointmentData,
      sampleIds,
      status: 'Aguardando Coleta',
      createdAt: new Date().toISOString(),
  createdBy: c.get && typeof c.get === 'function' ? c.get('userId' as any) : undefined
    }
    
    await kv.set(`appointment:${appointmentId}`, appointment)
    
    // Create samples tracking
    sampleIds.forEach(async (sampleId, index) => {
      await kv.set(`sample:${sampleId}`, {
        id: sampleId,
        appointmentId,
        serviceId: appointmentData.services[index].id,
        status: 'Aguardando Coleta',
        createdAt: new Date().toISOString()
      })
    })
    
    return c.json({ success: true, appointment })
  } catch (error) {
    console.log('Erro ao criar atendimento:', error)
    return c.json({ error: 'Erro ao criar atendimento' }, 500)
  }
})

app.get('/make-server-f78aeac5/appointments', requireAuth, async (c) => {
  try {
    const appointments = await kv.getByPrefix('appointment:')
    const appointmentList = appointments.map(({ value }: any) => value).filter(Boolean)
    
    return c.json({ appointments: appointmentList })
  } catch (error) {
    console.log('Erro ao buscar atendimentos:', error)
    return c.json({ error: 'Erro ao buscar atendimentos' }, 500)
  }
})

app.patch('/make-server-f78aeac5/appointments/:id/status', requireAuth, async (c) => {
  try {
    const appointmentId = c.req.param('id')
    const { status } = await c.req.json()
    
    const appointment = await kv.get(`appointment:${appointmentId}`)
    if (!appointment) {
      return c.json({ error: 'Atendimento não encontrado' }, 404)
    }
    
    const updatedAppointment = {
      ...appointment,
      status,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`appointment:${appointmentId}`, updatedAppointment)
    
    return c.json({ success: true, appointment: updatedAppointment })
  } catch (error) {
    console.log('Erro ao atualizar status:', error)
    return c.json({ error: 'Erro ao atualizar status' }, 500)
  }
})

// Dashboard/Analytics routes
app.get('/make-server-f78aeac5/dashboard/stats', requireAuth, async (c) => {
  try {
    const appointments = await kv.getByPrefix('appointment:')
    const appointmentList = appointments.map(({ value }: any) => value).filter(Boolean)
    
    const today = new Date().toISOString().split('T')[0]
    const todayAppointments = appointmentList.filter(apt => 
      apt.createdAt?.startsWith(today)
    )
    
    const totalRevenue = appointmentList.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0)
    const todayRevenue = todayAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0)
    
    const statusCounts = appointmentList.reduce((counts, apt) => {
      counts[apt.status] = (counts[apt.status] || 0) + 1
      return counts
    }, {})
    
    return c.json({
      totalAppointments: appointmentList.length,
      todayAppointments: todayAppointments.length,
      totalRevenue,
      todayRevenue,
      statusCounts
    })
  } catch (error) {
    console.log('Erro ao buscar estatísticas:', error)
    return c.json({ error: 'Erro ao buscar estatísticas' }, 500)
  }
})

// Deno.serve(app.fetch)