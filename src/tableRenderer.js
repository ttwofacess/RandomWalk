import { A1, A2 } from './config.js';
import { getAlerts } from './dataService.js';
import { fmt } from './utils.js';

export function renderTable(slice, maSlice) {
  const tb = document.getElementById('tbody');
  if (!slice || !slice.length) { 
    tb.innerHTML = '<tr><td colspan="8" class="empty">Sin datos</td></tr>'; 
    return; 
  }
  
  // maSlice corresponds to the same indices as slice
  const rows = [...slice].map((r, i) => ({ ...r, ma: maSlice[i] }));
  
  tb.innerHTML = rows.reverse().map(r => {
    const nom = r.max - r.min;
    const pct = (nom / r.min * 100).toFixed(2);
    const al = getAlerts(r.min, r.max);
    const badges = al.map(a => `<span class="badge ${a === A1 ? 'b1' : 'b2'}">${a.toLocaleString('es-AR')}</span>`).join('');
    const maVal = r.ma ? fmt(r.ma.value) + (r.ma.isPartial ? '*' : '') : '—';
    const maTitle = r.ma && r.ma.isPartial ? `Basado en ${r.ma.count} días` : '';

    return `<tr>
      <td>${r.fecha}</td>
      <td>${fmt(r.min)}</td>
      <td>${fmt(r.max)}</td>
      <td>${fmt(nom)}</td>
      <td>${pct}%</td>
      <td title="${maTitle}">${maVal}</td>
      <td>${badges || '—'}</td>
      <td><button class="del" onclick="delEntry(${r.ts})">✕</button></td>
    </tr>`;
  }).join('');
}
