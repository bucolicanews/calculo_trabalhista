import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import FullRescissionView from '@/components/calculations/FullRescissionView';

const CalculationResultPage: React.FC = () => {
  // O FullRescissionView agora lida com a busca de dados usando useParams.
  // Não precisamos mais buscar dados aqui e passá-los como props.

  return (
    <MainLayout>
      <FullRescissionView />
    </MainLayout>
  );
};

export default CalculationResultPage;