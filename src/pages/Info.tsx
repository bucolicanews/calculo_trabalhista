import React, { useState } from 'react';

// Dados do JSON (mantidos como constantes fora do componente para performance)
const proventosData = [
    { "Provento": "Média_de_Verbas_Variáveis_(Integração_à_Base)", "Cálculo": { "Parametro": "Média_das_Variáveis_Pendentes", "Valor": 0.00, "Fórmula_Sugerida": "(Média_Horas_Extras + Média_Comissões + Média_Adicionais) / N_Meses" }, "Memoria_de_Calculo": "Base: Verbas variáveis pagas nos últimos 12 meses (Horas Extras, Adicional Noturno, Comissões, etc.). Cálculo: Soma dessas verbas dividida por 12. Este valor deve ser somado ao Salário Base Fixo para compor a Remuneração Média.", "Legislação": "Súmulas 264 e 347 do TST", "Exemplos_Aplicaveis": "O valor encontrado aqui é a base para corrigir o Salário Base (Salário Base Corrigido).", "Natureza_da_Verba": "Normal" },
    { "Provento": "Base_de_Cálculo_Rescisória", "Cálculo": { "Parametro": "Remuneração_Média_para_Proporcionais", "Valor": 0.00, "Fórmula_Sugerida": "Salário_Base_Fixo + Média_de_Verbas_Variáveis" }, "Memoria_de_Calculo": "Base: Salário Base Fixo do Contrato. Cálculo: Soma do Salário Base Fixo com o valor calculado na verba 'Média_de_Verbas_Variáveis_(Integração_à_Base)'. Este valor compõe o Salário Base Corrigido/Remuneração Média utilizado como base para Férias, 13º e Aviso Prévio.", "Legislação": "Súmulas 264 e 347 do TST", "Exemplos_Aplicaveis": "É a remuneração integral (Salário Base Corrigido) considerada para calcular todas as verbas proporcionais e indenizadas.", "Natureza_da_Verba": "Informativa" },
    // ... (restante dos dados de proventos)
];

const descontosData = [
    { "Desconto": "Aviso_Prévio_Indenizado_pelo_Empregado", "Cálculo": { "Parametro": "Dias_de_Aviso_a_Descontar", "Valor": 0.00, "Fórmula_Sugerida": "Um_Mês_de_Salário_Base" }, "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: O valor de 1 Salário Base (equivalente a 30 dias) é descontado quando o empregado pede demissão e não cumpre o aviso.", "Legislação": "CLT, Art. 487, §2º", "Exemplos_Aplicaveis": "Empregado pede demissão e não cumpre o aviso prévio, indenizando o empregador.", "Natureza_da_Verba": "Normal" },
    { "Desconto": "INSS_Sobre_Remunerações_(Saldo_Salário_e_Variáveis)", "Cálculo": { "Parametro": "Base_de_Cálculo_(Saldo_Salário + Variáveis)", "Valor": 0.00, "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_mensal" }, "Memoria_de_Calculo": "Base: Saldo de Salário, Horas Extras, e Adicionais (Periculosidade/Insalubridade/Tempo_de_Serviço/Quebra_de_Caixa/etc.). Cálculo: Aplicação da Tabela Progressiva do INSS sobre a Base de Cálculo Mensal.", "Legislação": "Lei 8.212/91", "Exemplos_Aplicaveis": "Incide sobre Saldo de Salário, Horas Extras, Adicionais (Insalubridade/Periculosidade) e quaisquer diferenças salariais mensais.", "Natureza_da_Verba": "Normal" },
    // ... (restante dos dados de descontos)
];

const fullJsonStructure = {
    Verbas_Rescisorias: {
        Remuneracao: proventosData,
        Descontos: descontosData,
    },
};


// Componente para o botão de copiar
const CopyButton: React.FC<{ buttonId: string; copiedButton: string | null; onClick: () => void; }> = ({ buttonId, copiedButton, onClick }) => {
    const isCopied = copiedButton === buttonId;
    return (
        <button
            onClick={onClick}
            className={`absolute top-2 right-2 px-3 py-1.5 text-xs font-bold text-white rounded transition-colors ${isCopied ? 'bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
            {isCopied ? 'Copiado!' : 'Copiar'}
        </button>
    );
};

// Componente para exibir um card de verba
const VerbaCard: React.FC<{ verba: any, type: 'provento' | 'desconto' }> = ({ verba, type }) => {
    const title = type === 'provento' ? verba.Provento : verba.Desconto;

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-4 shadow-sm">
            <h5 className="text-lg font-semibold text-gray-800 mb-3">{title}</h5>
            <ul className="list-none p-0 space-y-2 text-sm">
                <li>
                    <span className="font-bold text-blue-600">Objetivo:</span>
                    <span className="block ml-5 text-gray-600">{verba.Memoria_de_Calculo}</span>
                </li>
                <li>
                    <span className="font-bold text-blue-600">Legislação:</span>
                    <span className="block ml-5 text-gray-600"><code>{verba.Legislação}</code></span>
                </li>
                <li>
                    <span className="font-bold text-blue-600">Exemplos de Aplicação:</span>
                    <span className="block ml-5 text-gray-600" dangerouslySetInnerHTML={{ __html: verba.Exemplos_Aplicaveis }}></span>
                </li>
            </ul>
        </div>
    );
};


const ManualPromptPage: React.FC = () => {
    const [copiedButton, setCopiedButton] = useState<string | null>(null);

    const handleCopy = (textToCopy: string, buttonId: string) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedButton(buttonId);
            setTimeout(() => setCopiedButton(null), 2000);
        }).catch(err => {
            console.error('Falha ao copiar: ', err);
            alert('Erro ao copiar. Tente manualmente.');
        });
    };

    return (
        <div className="bg-gray-100 p-5">
            <div className="max-w-6xl mx-auto bg-white p-8 sm:p-10 rounded-lg shadow-lg">
                <header className="text-center border-b-2 border-gray-200 pb-5 mb-8">
                    <img src="https://jota.teusite.top/imagens/logo.png" alt="Logo Jota Contabilidade" className="mx-auto max-w-[150px] mb-4" />
                    <h1 className="text-4xl font-bold text-red-700">Jota Contabilidade</h1>
                    <h2 className="text-2xl text-gray-600 font-normal">Proposta para Cálculo Rescisório</h2>
                </header>

                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-red-700 border-b pb-2 mb-4">Título do Modelo: PHD Cálculo Trabalhista2</h3>
                    <h4 className="text-xl font-semibold text-red-700 border-b pb-2 mb-4 mt-6">1. Perfil e Comportamento do Agente de IA</h4>
                    <ul className="list-none p-0 space-y-4">
                        <li>
                            <span className="font-bold text-blue-600 text-lg">Identificação:</span>
                            <p className="ml-5 text-gray-700">Você é um <strong>Especialista Sênior em Cálculo Trabalhista e Tributário (CLT)</strong>. Sua única responsabilidade é analisar os dados de entrada de uma rescisão contratual e preencher o JSON de saída com os valores e detalhes de cálculo corretos.</p>
                        </li>
                        <li>
                            <span className="font-bold text-blue-600 text-lg">Comportamento:</span>
                            <ul className="list-disc list-inside ml-5 space-y-2 mt-2 text-gray-700">
                                <li><strong>Rigor Legal:</strong> Baseie todos os cálculos e descrições nas normas da CLT, Lei 8.036/90 (FGTS), Decreto 3.048/99 (INSS) e Normas Coletivas (CCT/ACT) aplicáveis.</li>
                                <li><strong>Completo e Objetivo:</strong> Preencha TODOS os campos de proventos e descontos. Se um item não for aplicável, o valor deve ser <code>0.00</code> e a <code>Memoria_de_Calculo</code> deve justificar o motivo.</li>
                                <li><strong>Cálculo Detalhado:</strong> A <code>Memoria_de_Calculo</code> deve explicar o passo a passo que levou ao valor final.</li>
                            </ul>
                        </li>
                        {/* Outras seções de regras... */}
                    </ul>
                </div>

                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-red-700 border-b pb-2 mb-4">Modelos JSON para Copiar</h3>
                    <p className="mb-6 text-gray-700">Utilize os botões abaixo para copiar os blocos de texto e JSON necessários para alimentar o agente de IA.</p>

                    <h4 className="text-xl font-semibold text-gray-800 mb-2">Estrutura JSON Modelo Saída (Resultado Final Esperado)</h4>
                    <div className="relative">
                        <pre className="bg-gray-100 border border-gray-300 rounded-md p-4 pt-12 text-sm overflow-x-auto">
                            {JSON.stringify(fullJsonStructure, null, 2)}
                        </pre>
                        <CopyButton buttonId="full-json" copiedButton={copiedButton} onClick={() => handleCopy(JSON.stringify(fullJsonStructure, null, 2), 'full-json')} />
                    </div>

                    <h4 className="text-xl font-semibold text-gray-800 mb-2 mt-6">Modelo JSON: Apenas Proventos (Remuneração)</h4>
                    <div className="relative">
                        <pre className="bg-gray-100 border border-gray-300 rounded-md p-4 pt-12 text-sm overflow-x-auto">
                            {JSON.stringify(proventosData, null, 2)}
                        </pre>
                        <CopyButton buttonId="proventos-json" copiedButton={copiedButton} onClick={() => handleCopy(JSON.stringify(proventosData, null, 2), 'proventos-json')} />
                    </div>

                    <h4 className="text-xl font-semibold text-gray-800 mb-2 mt-6">Modelo JSON: Apenas Descontos</h4>
                    <div className="relative">
                        <pre className="bg-gray-100 border border-gray-300 rounded-md p-4 pt-12 text-sm overflow-x-auto">
                            {JSON.stringify(descontosData, null, 2)}
                        </pre>
                        <CopyButton buttonId="descontos-json" copiedButton={copiedButton} onClick={() => handleCopy(JSON.stringify(descontosData, null, 2), 'descontos-json')} />
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-bold text-red-700 border-b pb-2 mb-4">Detalhamento das Verbas para Consulta</h3>
                    <p className="mb-6 text-gray-700">A seguir, a explicação individual de cada verba.</p>

                    <h4 className="text-xl font-semibold text-gray-800 mb-4">Proventos (Remuneração)</h4>
                    <div>
                        {proventosData.map((verba, index) => (
                            <VerbaCard key={`provento-${index}`} verba={verba} type="provento" />
                        ))}
                    </div>

                    <h4 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Descontos</h4>
                    <div>
                        {descontosData.map((verba, index) => (
                            <VerbaCard key={`desconto-${index}`} verba={verba} type="desconto" />
                        ))}
                    </div>
                </div>

                <div className="mt-10">
                    <h3 className="text-2xl font-bold text-red-700 border-b pb-2 mb-4">Observações e Base Legal</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 font-semibold text-left text-gray-700">Tópico</th>
                                    <th className="p-3 font-semibold text-left text-gray-700">Descrição da Regra</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="p-3 font-semibold">Base Legal Central</td>
                                    <td className="p-3 text-gray-600">Cálculos baseados na CLT (Decreto-Lei nº 5.452/43), Lei do FGTS (nº 8.036/90) e Regulamento da Previdência (Decreto nº 3.048/99).</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold">Validação de Vínculo (CTPS)</td>
                                    <td className="p-3 text-gray-600">Se <code>ctpsAssinada</code> for "não" ou nula, o "FGTS_Não_Depositado_e_Devido" deve ser calculado para todo o período.</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold">Análise Sindical</td>
                                    <td className="p-3 text-gray-600">O campo <code>obsSindicato</code> deve ser analisado para identificar regras específicas da CCT, como piso salarial, multas ou outras verbas.</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold">Proventos de FGTS</td>
                                    <td className="p-3 text-gray-600">A "Multa_FGTS_40_Por_Cento" incide sobre o saldo total do FGTS (Saldo em Conta + FGTS Não Depositado).</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold">Princípio de Execução</td>
                                    <td className="p-3 text-gray-600">Os cálculos são uma simulação baseada nos dados de entrada. Utilizar sempre a maior base de cálculo possível (Salário Base + Médias, Piso, etc.) para verbas reflexas.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualPromptPage;