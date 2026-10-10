export function literal(value) {
  if (value == null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Invalid SQL number');
    return String(value);
  }
  if (value instanceof Date) value = value.toISOString();
  return "'" + String(value).replaceAll("'", "''") + "'";
}

export function insert(table, row) {
  return `INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.values(row).map(literal).join(',')});`;
}
