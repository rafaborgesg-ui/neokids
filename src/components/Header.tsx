import { useState } from 'react';
import { Menu, X, LogOut, Download, Home, UserPlus, Calendar, ClipboardList, Stethoscope, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
  handleLogout: () => void;
  userRole: string | null;
  onInstallClick: () => void;
  showInstallButton: boolean;
}

const Header = ({ activeView, setActiveView, handleLogout, userRole, onInstallClick, showInstallButton }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" />, roles: ['admin', 'user'] },
    { id: 'patientManagement', label: 'Pacientes', icon: <UserPlus className="w-4 h-4" />, roles: ['admin', 'user'] },
    { id: 'appointmentFlow', label: 'Agendamento', icon: <Calendar className="w-4 h-4" />, roles: ['admin', 'user'] },
    { id: 'kanbanBoard', label: 'Atendimento', icon: <ClipboardList className="w-4 h-4" />, roles: ['admin', 'user'] },
    { id: 'serviceManagement', label: 'Serviços', icon: <Stethoscope className="w-4 h-4" />, roles: ['admin'] },
  ];

  const accessibleNavItems = navItems.filter(item => userRole && item.roles.includes(userRole));

  const renderNavLinks = () => (
    <>
      {accessibleNavItems.map((item) => (
        <Button
          key={item.id}
          variant={activeView === item.id ? 'secondary' : 'ghost'}
          className="justify-start w-full"
          onClick={() => {
            setActiveView(item.id);
            setIsMenuOpen(false);
          }}
        >
          {item.icon}
          <span className="ml-2">{item.label}</span>
        </Button>
      ))}
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white md:hidden">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            <span className="ml-2 font-bold text-lg">Neokids</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </header>
      
      {/* Drawer Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Drawer Content */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="p-4">
          <div className="mb-8 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Neokids</h1>
          </div>
          <nav className="flex flex-col gap-2">
            {renderNavLinks()}
            {showInstallButton && (
                 <Button onClick={onInstallClick} className="justify-start w-full mt-4">
                    <Download className="w-4 h-4" />
                    <span className="ml-2">Instalar App</span>
                </Button>
            )}
            <Button variant="ghost" className="justify-start w-full text-red-500 hover:text-red-600 mt-auto" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="ml-2">Sair</span>
            </Button>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Header;
