// Helper to extract value from nested Supabase data structure based on a path string
// Example path: 'tbl_sindicatos(tbl_dissidios(nome_dissidio))'
// Example path: 'tbl_clientes(nome)'
// Example path: 'nome_funcionario'
export const extractValueFromPath = (data: any, path: string) => {
  const parts = path.match(/(\w+)(?:\((.*)\))?/); // Matches 'table' and 'field(nested_path)'

  if (!parts) { // Direct field
    return data[path];
  }

  const [_, currentKey, nestedPath] = parts;

  let currentData = data[currentKey];

  if (!currentData) return null;

  if (nestedPath) {
    // If currentData is an array, process each item
    if (Array.isArray(currentData)) {
      const results: any[] = [];
      currentData.forEach(item => {
        const nestedValue = extractValueFromPath(item, nestedPath);
        if (nestedValue !== undefined && nestedValue !== null) {
          if (Array.isArray(nestedValue)) { // If nested path also returns an array
            results.push(...nestedValue);
          } else {
            results.push(nestedValue);
          }
        }
      });
      return results.length > 0 ? results : null;
    } else {
      // Single object, recurse
      return extractValueFromPath(currentData, nestedPath);
    }
  } else {
    // No nested path, return the value directly from currentKey
    return currentData;
  }
};