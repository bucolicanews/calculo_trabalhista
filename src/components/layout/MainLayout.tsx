import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { LogOut, Home, Users, Calculator, Landmark, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const NavLinks = () => (
    <>
      <Button variant="ghost" asChild className="text-white hover:text-orange-500">
        <SheetClose asChild>
          <Link to="/dashboard">
            <Home className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </SheetClose>
      </Button>
      <Button variant="ghost" asChild className="text-white hover:text-orange-500">
        <SheetClose asChild>
          <Link to="/clients">
            <Users className="mr-2 h-4 w-4" /> Clientes
          </Link>
        </SheetClose>
      </Button>
      <Button variant="ghost" asChild className="text-white hover:text-orange-500">
        <SheetClose asChild>
          <Link to="/calculations">
            <Calculator className="mr-2 h-4 w-4" /> Cálculos
          </Link>
        </SheetClose>
      </Button>
      <Button variant="ghost" asChild className="text-white hover:text-orange-500">
        <SheetClose asChild>
          <Link to="/sindicatos">
            <Landmark className="mr-2 h-4 w-4" /> Sindicatos
          </Link>
        </SheetClose>
      </Button>
      <Button onClick={handleLogout} variant="destructive" className="bg-orange-500 hover:bg-orange-600 text-white">
        <LogOut className="mr-2 h-4 w-4" /> Sair
      </Button>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="bg-gray-900 p-4 flex justify-between items-center border-b border-orange-500">
        <Link to="/dashboard" className="text-2xl font-bold text-orange-500">
          Calculadora Jurídica
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <NavLinks />
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:text-orange-500">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-gray-900 border-l border-orange-500 text-white p-6 flex flex-col">
              <h2 className="text-2xl font-bold text-orange-500 mb-6">Menu</h2>
              <nav className="flex flex-col space-y-4">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="flex-grow p-6">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default MainLayout;