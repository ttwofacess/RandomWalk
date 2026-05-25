export function parseFecha(s) {
  s = s.trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dd = parseInt(m[1]), mm = parseInt(m[2]), yyyy = parseInt(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const dt = new Date(yyyy, mm - 1, dd);
  if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
  const dw = dt.getDay();
  if (dw === 0 || dw === 6) return null;
  return { ts: dt.getTime(), str: s };
}
