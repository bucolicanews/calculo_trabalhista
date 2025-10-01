import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Sidebar from './Sidebar'; // Importar o novo Sidebar

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleMobileLinkClick = () => {
    setIsSheetOpen(false); // Fecha o sheet ao clicar em um link
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="bg-gray-900 p-4 flex justify-between items-center border-b border-orange-500 md:hidden">
        <Link to="/dashboard" className="text-2xl font-bold text-orange-500">
          Calculadora Jurídica
        </Link>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:text-orange-500">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-gray-900 border-r border-orange-500 text-white p-0 w-64">
            <div className="p-4">
              <h2 className="text-2xl font-bold text-orange-500 mb-6">Menu</h2>
            </div>
            <Sidebar isMobile onLinkClick={handleMobileLinkClick} />
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-shrink-0">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-grow p-6 overflow-auto">
          {children}
        </main>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default MainLayout;