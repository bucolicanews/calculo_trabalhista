import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useWebhookManagement } from '@/hooks/useWebhookManagement';
import WebhookCard from '@/components/webhooks/WebhookCard'; 
import WebhookForm from '@/components/webhooks/WebhookForm';

const WebhookConfigPage = () => {
  const {
    webhooks,
    loading,
    isDialogOpen,
    setIsDialogOpen,
    currentWebhook,
    isEditing,
    fieldPopoverOpen,
    setFieldPopoverOpen,
    currentTableAvailableFields,
    areAllFieldsSelected,
    handleNewWebhook,
    handleEditWebhook,
    handleChange,
    handleTableChange,
    handleFieldToggle,
    handleToggleSelectAllFields,
    handleSubmit,
    handleDeleteWebhook,
    getFieldLabel,
  } = useWebhookManagement();

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Configurações de Webhook</h1>
          <Button onClick={handleNewWebhook} className="bg-orange-500 hover:bg-orange-600 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Webhook
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando configurações...</p>
        ) : webhooks.length === 0 ? (
          <p className="text-gray-400">Nenhuma configuração de webhook cadastrada ainda. Crie uma nova para começar!</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {webhooks.map((webhook) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                onEdit={handleEditWebhook}
                onDelete={handleDeleteWebhook}
                getFieldLabel={getFieldLabel}
              />
            ))}
          </div>
        )}

        <WebhookForm
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          currentWebhook={currentWebhook}
          isEditing={isEditing}
          loading={loading}
          fieldPopoverOpen={fieldPopoverOpen}
          setFieldPopoverOpen={setFieldPopoverOpen}
          currentTableAvailableFields={currentTableAvailableFields}
          areAllFieldsSelected={areAllFieldsSelected}
          handleChange={handleChange}
          handleTableChange={handleTableChange}
          handleFieldToggle={handleFieldToggle}
          handleToggleSelectAllFields={handleToggleSelectAllFields}
          handleSubmit={handleSubmit}
        />
      </div>
    </MainLayout>
  );
};

export default WebhookConfigPage;