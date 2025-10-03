import React, { useState, useEffect, useCallback } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import PatientManagement from './components/PatientManagement';
import ServiceManagement from './components/ServiceManagement';
import AppointmentFlow from './components/AppointmentFlow';
import KanbanBoard from './components/KanbanBoard';
import DemoInitializer from './components/DemoInitializer';
import { Button } from './components/ui/button';
import Header from './components/Header';
import { BarChart3, Users, Settings, Calendar, Activity, LayoutDashboard, LogOut, Download } from 'lucide-react';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

type UserSession = Session;

type Module = {
  id: string;
  name: string;
  icon: React.ElementType;
  component: React.ComponentType<any>;
  roles: string[];
};

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  const modules: Module[] = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, component: Dashboard, roles: ['administrador', 'atendente', 'tecnico'] },
    { id: 'patients', name: 'Pacientes', icon: Users, component: PatientManagement, roles: ['administrador', 'atendente'] },
    { id: 'services', name: 'Serviços', icon: Settings, component: ServiceManagement, roles: ['administrador'] },
    { id: 'appointments', name: 'Atendimentos', icon: Calendar, component: AppointmentFlow, roles: ['administrador', 'atendente'] },
    { id: 'laboratory', name: 'Laboratório', icon: Activity, component: KanbanBoard, roles: ['administrador', 'tecnico', 'atendente'] }
  ];

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleLogin = useCallback((s: UserSession) => {
    setSession(s);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setActiveModule('dashboard');
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      (installPrompt as any).prompt();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return (
      <>
        <DemoInitializer />
        <LoginForm onLogin={handleLogin} supabase={supabase} />
      </>
    );
  }

  const userRole = session.user?.user_metadata?.role || 'atendente';
  const availableModules = modules.filter(module => module.roles.includes(userRole));
  const ActiveComponent = modules.find(m => m.id === activeModule)?.component || Dashboard;

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100">
      <Header
        activeView={activeModule}
        setActiveView={setActiveModule}
        handleLogout={handleLogout}
        userRole={userRole}
        onInstallClick={handleInstallClick}
        showInstallButton={!!installPrompt}
      />
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-white p-4 md:flex">
          <div className="mb-8 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Neokids</h1>
          </div>
          <nav className="flex flex-1 flex-col gap-2">
            {availableModules.map(module => (
              <Button
                key={module.id}
                variant={activeModule === module.id ? 'secondary' : 'ghost'}
                className="justify-start"
                onClick={() => setActiveModule(module.id)}
              >
                <module.icon className="mr-2 h-4 w-4" />
                {module.name}
              </Button>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            {installPrompt && (
              <Button onClick={handleInstallClick} className="justify-start">
                <Download className="mr-2 h-4 w-4" />
                Instalar App
              </Button>
            )}
            <Button variant="ghost" className="justify-start text-red-500 hover:text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-4 sm:p-6">
          <ActiveComponent accessToken={session.access_token} userRole={userRole} />
        </main>
      </div>
    </div>
  );
};

export default App;