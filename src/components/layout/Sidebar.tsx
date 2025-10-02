import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calculator, Settings, LogOut, Briefcase, Building2, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { showError } from '@/utils/toast';

interface SidebarProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, onLinkClick }) => {
  const { signOut } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error: any) {
      showError('Erro ao fazer logout: ' + error.message);
    }
  };

  // URL da função Edge para receber o resumo da IA
  const aiSummaryWebhookUrl = "https://oqiycpjayuzuyefkdujp.supabase.co/functions/v1/store-ai-summary";

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Clientes', icon: Users, path: '/clients' },
    { name: 'Cálculos', icon: Calculator, path: '/calculations' },
    { name: 'Sindicatos', icon: Building2, path: '/sindicatos' },
    { name: 'Webhooks', icon: BellRing, path: '/webhooks' },
    // { name: 'Configurações', icon: Settings, path: '/settings' }, // Futuro
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col h-screen border-r border-gray-700">
      <div className="text-2xl font-bold text-orange-500 mb-8 text-center">
        Rescisão App
      </div>
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link to={item.path} onClick={isMobile && onLinkClick ? onLinkClick : undefined}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-lg py-6 ${
                    location.pathname.startsWith(item.path) ? 'bg-orange-500 text-white hover:bg-orange-600' : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-700">
        <div className="mb-4 p-2 bg-gray-800 rounded-md text-sm text-gray-400 break-all">
          <p className="font-semibold text-orange-400 mb-1">Webhook Resumo IA:</p>
          <span className="text-xs">{aiSummaryWebhookUrl}</span>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-lg py-6 text-red-400 hover:bg-gray-800 hover:text-red-500"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;