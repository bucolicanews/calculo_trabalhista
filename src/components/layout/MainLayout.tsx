import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { LogOut, Home, Users, Calculator, Landmark } from 'lucide-react'; // Adicionado Landmark para sindicatos

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="bg-gray-900 p-4 flex justify-between items-center border-b border-orange-500">
        <Link to="/dashboard" className="text-2xl font-bold text-orange-500">
          Calculadora Jurídica
        </Link>
        <nav className="flex items-center space-x-4">
          <Button variant="ghost" asChild className="text-white hover:text-orange-500">
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-white hover:text-orange-500">
            <Link to="/clients">
              <Users className="mr-2 h-4 w-4" /> Clientes
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-white hover:text-orange-500">
            <Link to="/calculations">
              <Calculator className="mr-2 h-4 w-4" /> Cálculos
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-white hover:text-orange-500">
            <Link to="/sindicatos"> {/* Novo link para sindicatos */}
              <Landmark className="mr-2 h-4 w-4" /> Sindicatos
            </Link>
          </Button>
          <Button onClick={handleLogout} variant="destructive" className="bg-orange-500 hover:bg-orange-600 text-white">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </nav>
      </header>
      <main className="flex-grow p-6">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default MainLayout;