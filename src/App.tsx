import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './utils/supabase/info'
import { LoginForm } from './components/LoginForm'
import Dashboard from './components/Dashboard' // Corrigido
import PatientManagement from './components/PatientManagement' // Corrigido para import default
import ServiceManagement from './components/ServiceManagement'
import AppointmentFlow from './components/AppointmentFlow'; // Corrigido
import KanbanBoard from './components/KanbanBoard' // Corrigido
import { DemoInitializer } from './components/DemoInitializer'
import { Button } from './components/ui/button'
import { 
  User, 
  Users, 
  Calendar, 
  Activity, 
  Settings, 
  LogOut,
  BarChart3
} from 'lucide-react'
import { Session } from '@supabase/supabase-js';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

// Corrigir a tipagem de UserSession
type UserSession = Session;

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [activeModule, setActiveModule] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSession(session as UserSession)
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Credenciais inválidas. Verifique se os dados de demonstração foram inicializados.')
        }
        throw new Error(error.message)
      }
      
      if (session) {
        setSession(session as UserSession)
      }
    } catch (error) {
      throw error
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setActiveModule('dashboard')
  }

  const modules = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      component: Dashboard,
      roles: ['administrador', 'atendente', 'tecnico']
    },
    {
      id: 'patients',
      name: 'Pacientes',
      icon: Users,
      component: PatientManagement,
      roles: ['administrador', 'atendente']
    },
    {
      id: 'services',
      name: 'Serviços',
      icon: Settings,
      component: ServiceManagement,
      roles: ['administrador']
    },
    {
      id: 'appointments',
      name: 'Atendimentos',
      icon: Calendar,
      component: AppointmentFlow,
      roles: ['administrador', 'atendente']
    },
    {
      id: 'laboratory',
      name: 'Laboratório',
      icon: Activity,
      component: KanbanBoard,
      roles: ['administrador', 'tecnico', 'atendente']
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <DemoInitializer />
        <LoginForm onLogin={handleLogin} />
      </>
    )
  }

  const userRole = session.user.user_metadata?.role || 'atendente'
  const availableModules = modules.filter(module => 
    module.roles.includes(userRole)
  )

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component || Dashboard

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Neokids - Sistema de Gestão
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {session.user.user_metadata?.name || session.user.email}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {userRole}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4 space-y-2">
            {availableModules.map((module) => {
              const Icon = module.icon
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeModule === module.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{module.name}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <ActiveComponent accessToken={session.access_token} userRole={userRole} />
        </main>
      </div>
    </div>
  )
}