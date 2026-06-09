/**
 * Sanitiza una cadena de texto para que solo contenga números y barras diagonales,
 * limitando su longitud y aplicando un formato básico de fecha (DD/MM/AAAA).
 */
export function sanitizeFecha(s) {
  if (typeof s !== 'string') return '';
  // Remover todo lo que no sea dígito
  const digits = s.replace(/\D/g, '');
  let out = '';
  for (let i = 0; i < digits.length && i < 8; i++) {
    if (i === 2 || i === 4) out += '/';
    out += digits[i];
  }
  return out;
}

export function parseFecha(s) {
  if (!s) return null;
  s = s.trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  
  const dt = new Date(yyyy, mm - 1, dd);
  // Verificar que la fecha sea real (ej. no 31 de abril)
  if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
  
  // Excluir fines de semana (0=Domingo, 6=Sábado)
  const dw = dt.getDay();
  if (dw === 0 || dw === 6) return null;
  
  // Formatear a DD/MM/AAAA con ceros a la izquierda
  const cleanStr = `${dd.toString().padStart(2, '0')}/${mm.toString().padStart(2, '0')}/${yyyy}`;
  
  return { ts: dt.getTime(), str: cleanStr };
}

/**
 * Sanitiza un valor numérico permitiendo solo dígitos y un punto decimal.
 * También convierte comas en puntos.
 */
export function sanitizePrecio(s) {
  if (typeof s !== 'string') return '';
  // Convertir comas a puntos
  let out = s.replace(/,/g, '.');
  // Remover todo lo que no sea dígito o punto
  out = out.replace(/[^0-9.]/g, '');
  // Asegurar que solo haya un punto decimal
  const parts = out.split('.');
  if (parts.length > 2) {
    out = parts[0] + '.' + parts.slice(1).join('');
  }
  return out;
}

/**
 * Parsea un valor numérico y valida que sea positivo.
 */
export function parsePrecio(s) {
  const v = parseFloat(s);
  if (isNaN(v) || v <= 0) return null;
  return v;
}
