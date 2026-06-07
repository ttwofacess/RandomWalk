import { PAGE } from './config.js';
import { getData, getAlerts, calculateMovingAverage } from './dataService.js';
import { fmt } from './utils.js';
import { drawCandles } from './chart.js';
import { renderTable } from './tableRenderer.js';

let page = 0;

export function getPage() { return page; }
export function setPage(p) { page = p; }

export function render() {
  const data = getData();
  const hasData = data.length > 0;
  document.getElementById('metrics-wrap').style.display = hasData ? 'block' : 'none';
  document.getElementById('chart-wrap').style.display = hasData ? 'block' : 'none';
  
  // Historial siempre visible para que el botón de importar esté accesible
  document.getElementById('table-wrap').style.display = 'block';

  // Deshabilitar botones que requieren datos
  const exportBtn = document.querySelector('button[onclick="exportData()"]');
  const clearBtn = document.querySelector('button[onclick="clearAll()"]');
  if (exportBtn) exportBtn.disabled = !hasData;
  if (clearBtn) clearBtn.disabled = !hasData;

  if (!hasData) {
    document.getElementById('tbody').innerHTML = '<tr><td colspan="8" class="empty">Sin datos cargados. Podés importar un respaldo o agregar nuevos registros arriba.</td></tr>';
    return;
  }

  let sumPct = 0, sumNom = 0, cntAlrt = 0;
  data.forEach(r => {
    const n = r.max - r.min;
    sumNom += n;
    sumPct += (n / r.min * 100);
    if (getAlerts(r.min, r.max).length) cntAlrt++;
  });
  
  const maData = calculateMovingAverage(50);
  const latestMA = maData[maData.length - 1];
  
  document.getElementById('m-pct').textContent = (sumPct / data.length).toFixed(2) + '%';
  document.getElementById('m-nom').textContent = fmt(sumNom / data.length);
  document.getElementById('m-days').textContent = data.length;
  document.getElementById('m-alrt').textContent = cntAlrt;
  document.getElementById('m-ma').textContent = latestMA ? fmt(latestMA.value) + (latestMA.isPartial ? '*' : '') : '—';
  if (latestMA && latestMA.isPartial) {
    document.getElementById('m-ma').title = `Basado en ${latestMA.count} días (menos de 50)`;
  }

  const totalP = Math.max(1, Math.ceil(data.length / PAGE));
  page = Math.max(0, Math.min(page, totalP - 1));
  const s = page * PAGE;
  const slice = data.slice(s, s + PAGE);
  const maSlice = maData.slice(s, s + PAGE);
  
  document.getElementById('nav-info').textContent = 'Página ' + (page + 1) + ' de ' + totalP;
  document.getElementById('btn-prev').disabled = page === 0;
  document.getElementById('btn-next').disabled = page >= totalP - 1;

  drawCandles(slice, maSlice);
  renderTable(slice, maSlice);
}

export function goPage(d) { 
  page += d; 
  render(); 
}

export function switchTab(t) {
  document.getElementById('tab-panel').style.display = t === 'panel' ? 'block' : 'none';
  document.getElementById('tab-search').style.display = t === 'search' ? 'block' : 'none';
  const btns = document.querySelectorAll('.tab-btn');
  btns[0].classList.toggle('active', t === 'panel');
  btns[1].classList.toggle('active', t === 'search');
}
