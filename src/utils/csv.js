// Tiny CSV builder. Quotes any field containing a comma, quote, or newline,
// per RFC 4180.

export function toCsv(rows) {
    if (!rows?.length) return '';
    return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
  }
  
  function escapeCell(value) {
    const s = value === null || value === undefined ? '' : String(value);
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }
  
  export function downloadCsv(filename, rows) {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }