// ... (Assumindo que este bloco está dentro da função de carregamento de dados)

// Fix for TS2345: Ensure only string or number is passed to formatCurrencyForDisplay
currencyFields.forEach(field => {
    const value = loadedCalculation[field];
    // Se o valor for booleano (como 'false'), trata como 0 para evitar erro de formatação de moeda.
    const safeValue = typeof value === 'boolean' ? 0 : value; 
    initialCurrencyValues[field] = formatCurrencyForDisplay(safeValue);
});

// ...