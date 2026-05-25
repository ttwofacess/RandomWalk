import { A1, A2 } from './config.js';
import { getAlerts } from './dataService.js';
import { fmt } from './utils.js';

export function renderTable(slice) {
  const tb = document.getElementById('tbody');
  if (!slice || !slice.length) { 
    tb.innerHTML = '<tr><td colspan="7" class="empty">Sin datos</td></tr>'; 
    return; 
  }
  tb.innerHTML = [...slice].reverse().map(r => {
    const nom = r.max - r.min;
    const pct = (nom / r.min * 100).toFixed(2);
    const al = getAlerts(r.min, r.max);
    const badges = al.map(a => `<span class="badge ${a === A1 ? 'b1' : 'b2'}">${a.toLocaleString('es-AR')}</span>`).join('');
    return `<tr>
      <td>${r.fecha}</td>
      <td>${fmt(r.min)}</td>
      <td>${fmt(r.max)}</td>
      <td>${fmt(nom)}</td>
      <td>${pct}%</td>
      <td>${badges || '—'}</td>
      <td><button class="del" onclick="delEntry(${r.ts})">✕</button></td>
    </tr>`;
  }).join('');
}
