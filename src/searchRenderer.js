import { A1 } from './config.js';
import { getData, getAlerts } from './dataService.js';
import { fmt } from './utils.js';

export function searchLevel(value) {
  if (isNaN(value)) { 
    document.getElementById('search-results-wrap').style.display = 'none'; 
    return; 
  }
  const data = getData();
  const res = data.filter(r => value >= r.min && value <= r.max);
  renderSearchResults(res, `Resultados para el nivel ${fmt(value)}`);
}

export function searchLowestMin() {
  const data = getData();
  if (!data.length) return;
  const minVal = Math.min(...data.map(r => r.min));
  const res = data.filter(r => r.min === minVal);
  renderSearchResults(res, `Menor Mínimo Histórico: ${fmt(minVal)}`);
}

export function searchHighestMax() {
  const data = getData();
  if (!data.length) return;
  const maxVal = Math.max(...data.map(r => r.max));
  const res = data.filter(r => r.max === maxVal);
  renderSearchResults(res, `Mayor Máximo Histórico: ${fmt(maxVal)}`);
}

export function renderSearchResults(res, title) {
  const wrap = document.getElementById('search-results-wrap');
  const tbody = document.getElementById('s-tbody');
  const titleEl = wrap.querySelector('.sec-title');
  
  titleEl.textContent = title;
  wrap.style.display = 'block';
  
  if (!res.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No se encontraron registros</td></tr>';
    return;
  }
  
  tbody.innerHTML = res.sort((a,b) => b.ts - a.ts).map(r => {
    const pct = ((r.max - r.min) / r.min * 100).toFixed(2);
    const al = getAlerts(r.min, r.max);
    const badges = al.map(a => `<span class="badge ${a === A1 ? 'b1' : 'b2'}">${a.toLocaleString('es-AR')}</span>`).join('');
    return `<tr>
      <td>${r.fecha}</td>
      <td>${fmt(r.min)}</td>
      <td>${fmt(r.max)}</td>
      <td>${pct}%</td>
      <td>${badges || '—'}</td>
    </tr>`;
  }).join('');
}
