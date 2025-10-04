export interface ParsedTable {
  title?: string; // Optional title for the table, derived from preceding headers
  headers: string[];
  rows: string[][];
}

export const parseMarkdownTables = (markdown: string): ParsedTable[] => {
  const tables: ParsedTable[] = [];
  const lines = markdown.split('\n');
  let inTable = false;
  let currentTable: ParsedTable | null = null;
  let lastHeader: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Capture potential table titles from Markdown headers (##, ###)
    if (line.startsWith('## ') || line.startsWith('### ')) {
      lastHeader = line.replace(/^(##|###)\s*/, '').trim();
    }

    // Check for table header (starts with | and has a separator line below)
    if (line.startsWith('|') && lines[i + 1] && lines[i + 1].includes('---')) {
      if (currentTable) {
        tables.push(currentTable);
      }
      currentTable = { headers: [], rows: [] };
      if (lastHeader) {
        currentTable.title = lastHeader;
        lastHeader = null; // Reset after using
      }
      inTable = true;

      // Parse headers
      currentTable.headers = line.split('|').map(h => h.trim()).filter(h => h !== '');
      i++; // Skip the separator line (---)
      continue;
    }

    // If in a table, parse rows
    if (inTable && line.startsWith('|')) {
      const row = line.split('|').map(c => c.trim()).filter(c => c !== '');
      if (currentTable) {
        currentTable.rows.push(row);
      }
      continue;
    }

    // If not in a table or line doesn't start with '|', end of current table
    if (inTable && !line.startsWith('|')) {
      if (currentTable) {
        tables.push(currentTable);
      }
      currentTable = null;
      inTable = false;
    }
  }

  // Push the last table if still in one
  if (currentTable) {
    tables.push(currentTable);
  }

  return tables;
};

export const convertToCsv = (tables: ParsedTable[]): string => {
  let csvContent = '';

  tables.forEach((table, index) => {
    if (index > 0) {
      csvContent += '\n\n'; // Add extra newlines between tables in the CSV for readability
    }

    if (table.title) {
      csvContent += `"${table.title.replace(/"/g, '""')}"\n`;
    } else {
      csvContent += `"Tabela ${index + 1}"\n`;
    }

    // Headers
    csvContent += table.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

    // Rows
    table.rows.forEach(row => {
      csvContent += row.map(c => `"${c.replace(/"/g, '""')}"`).join(',') + '\n';
    });
  });

  return csvContent;
};