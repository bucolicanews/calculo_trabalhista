import React from 'react';

// Helper para extrair texto de children de forma robusta
export const getTextFromChildren = (children: React.ReactNode): string => {
  return React.Children.toArray(children).map(child => {
    if (typeof child === 'string') {
      return child;
    }
    if (React.isValidElement(child) && child.props.children) {
      return getTextFromChildren(child.props.children);
    }
    return '';
  }).join('');
};

// Custom components for ReactMarkdown rendering
export const customMarkdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => {
    const text = getTextFromChildren(children);

    if (text.includes('DADOS DA RESCISÃO')) {
      return null; // Remove "DADOS DA RESCISÃO"
    }
    if (text.includes('RESUMO FINANCEIRO')) {
      // Centralizado e laranja
      return (
        <h2 className="text-2xl font-bold text-orange-500 mt-6 mb-4 text-center p-4 border border-orange-500 rounded-md">
          {children}
        </h2>
      );
    }
    if (text.includes('VALOR LÍQUIDO A RECEBER')) {
      // De volta para o lado esquerdo
      return (
        <h2 className="text-2xl font-bold text-orange-500 mt-6 mb-4 text-left p-4 border border-orange-500 rounded-md">
          {children}
        </h2>
      );
    }
    if (text.includes('OBSERVAÇÕES E BASE LEGAL')) {
      return (
        <h2 className="text-2xl font-bold text-white bg-black py-2 mt-8 mb-4 text-center rounded-md">
          {children}
        </h2>
      );
    }
    return <h2 className="text-2xl font-bold text-orange-500 mb-4">{children}</h2>;
  },
  h3: ({ children }: { children?: React.ReactNode }) => {
    const text = getTextFromChildren(children);

    if (text.includes('PROVENTOS') || text.includes('DESCONTOS')) {
      // Centralizado e laranja
      return (
        <h3 className="text-xl font-bold text-orange-500 bg-black py-2 my-2 text-center rounded-md">
          {children}
        </h3>
      );
    }
    return <h3 className="text-xl font-semibold text-orange-400 mb-2">{children}</h3>;
  },
  p: ({ children }: { children?: React.ReactNode }) => {
    const text = getTextFromChildren(children);
    // Regex para detectar valores monetários no formato R$ X.XXX,XX
    const monetaryRegex = /R\$\s\d{1,3}(?:\.\d{3})*,\d{2}/;
    if (monetaryRegex.test(text)) {
      // De volta para o lado esquerdo
      return (
        <p className="text-4xl font-extrabold text-orange-500 text-left my-4 p-2 bg-gray-800 rounded-md">
          {children}
        </p>
      );
    }
    return <p className="mb-4">{children}</p>; // Default paragraph styling
  },
  // Removendo o componente 'table' customizado para permitir que o CSS global gerencie o layout da tabela.
  // table: ({ children }: { children?: React.ReactNode }) => (
  //   <table className="my-4">{children}</table>
  // ),
  td: ({ children, align }: { children?: React.ReactNode, align?: string }) => ( // Tipo de 'align' expandido
    <td className={`text-${align || 'left'}`}>
      {children}
    </td>
  ),
  th: ({ children, align }: { children?: React.ReactNode, align?: string }) => ( // Tipo de 'align' expandido
    <th className={`text-${align || 'left'}`}>
      {children}
    </th>
  ),
};