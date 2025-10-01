import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LogOut, Home, Users, Calculator, Landmark, ChevronDown, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isMobile?: boolean;
  onLinkClick?: () => void; // Para fechar o sheet no mobile
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, onLinkClick }) => {
  const location = useLocation();
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(
    location.pathname.startsWith('/clients') || location.pathname.startsWith('/sindicatos')
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onLinkClick) onLinkClick(); // Fecha o menu mobile após logout
  };

  const NavLink = ({ to, icon: Icon, label, onClick }: { to: string; icon: React.ElementType; label: string; onClick?: () => void }) => (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-white hover:text-orange-500 hover:bg-gray-800",
        location.pathname === to && "bg-gray-800 text-orange-500"
      )}
      asChild
      onClick={onClick || onLinkClick}
    >
      <Link to={to}>
        <Icon className="mr-2 h-4 w-4" /> {label}
      </Link>
    </Button>
  );

  return (
    <div className="flex flex-col h-full p-4 space-y-2 bg-gray-900 border-r border-orange-500">
      <NavLink to="/dashboard" icon={Home} label="Dashboard" />

      <Collapsible open={isCadastrosOpen} onOpenChange={setIsCadastrosOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between text-white hover:text-orange-500 hover:bg-gray-800",
              (location.pathname.startsWith('/clients') || location.pathname.startsWith('/sindicatos')) && "bg-gray-800 text-orange-500"
            )}
          >
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" /> Cadastros
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isCadastrosOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pl-4 pt-1">
          <NavLink to="/clients" icon={Users} label="Clientes" />
          <NavLink to="/sindicatos" icon={Landmark} label="Sindicatos" />
        </CollapsibleContent>
      </Collapsible>

      <NavLink to="/calculations" icon={Calculator} label="Cálculos" />

      <div className="mt-auto pt-4"> {/* Empurra o botão de sair para o final */}
        <Button onClick={handleLogout} variant="destructive" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;