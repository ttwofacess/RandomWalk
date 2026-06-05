import { A1, A2 } from './config.js';
import { saveData } from './storage.js';
import { parseFecha } from './validator.js';

let data = [];

export function initData(initialData) {
  data = initialData;
}

export function getData() {
  return data;
}

export function addEntry(fechaStr, min, max) {
  const dt = parseFecha(fechaStr);
  if (!dt) {
    return { ok: false, error: 'Fecha inválida o fin de semana. Usar dd/mm/aaaa, sólo días hábiles.' };
  }
  if (isNaN(min) || isNaN(max)) {
    return { ok: false, error: 'Ingresá valores numéricos válidos.' };
  }
  if (min >= max) {
    return { ok: false, error: 'El mínimo debe ser menor que el máximo.' };
  }
  if (data.find(r => r.ts === dt.ts)) {
    return { ok: false, error: 'Ya existe un registro para esa fecha.' };
  }
  
  data.push({ ts: dt.ts, fecha: dt.str, min, max });
  data.sort((a, b) => a.ts - b.ts);
  saveData(data);
  
  const newIndex = data.findIndex(r => r.ts === dt.ts);
  return { ok: true, index: newIndex };
}

export function deleteEntry(ts) {
  data = data.filter(r => r.ts !== ts);
  saveData(data);
}

export function clearAllEntries() {
  data = [];
  saveData(data);
}

export function getAlerts(mn, mx) {
  const a = [];
  if (mn <= A1) a.push(A1);
  if (mx >= A2) a.push(A2);
  return a;
}

export function mergeEntries(imported) {
  const prevLen = data.length;
  imported.forEach(row => {
    if (!data.find(r => r.ts === row.ts)) {
      data.push(row);
    }
  });
  data.sort((a, b) => a.ts - b.ts);
  saveData(data);
  return data.length - prevLen;
}
