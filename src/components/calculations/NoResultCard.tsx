import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NoResultCard: React.FC = () => {
  return (
    <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white">
      <CardHeader>
        <CardTitle className="text-2xl text-orange-500">Resposta do Webhook</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400">Ainda não há uma resposta de webhook para este cálculo. Envie o cálculo para um webhook para gerar um resultado.</p>
        <Button asChild className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
          <Link to={`/calculations`}>
            Enviar Cálculo
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default NoResultCard;