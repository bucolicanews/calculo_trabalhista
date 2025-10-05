import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">Configurações</h1>
        <Card className="max-w-2xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500">Configurações do Aplicativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <p>Esta é uma página de configurações em construção. Opções de personalização virão em breve!</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;