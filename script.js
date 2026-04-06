const A1 = 1800, A2 = 2500, PAGE = 5;
let data = [], page = 0;

try {
  const s = localStorage.getItem('cdl_v2');
  if (s) data = JSON.parse(s);
} catch(e) {}

function save() {
  try { localStorage.setItem('cdl_v2', JSON.stringify(data)); } catch(e) {}
}

function parseFecha(s) {
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

function addEntry() {
  const fv = document.getElementById('f-fecha').value;
  const minv = parseFloat(document.getElementById('f-min').value);
  const maxv = parseFloat(document.getElementById('f-max').value);
  const errEl = document.getElementById('err');
  errEl.textContent = '';
  const dt = parseFecha(fv);
  if (!dt) { errEl.textContent = 'Fecha inválida o fin de semana. Usar dd/mm/aaaa, sólo días hábiles.'; return; }
  if (isNaN(minv) || isNaN(maxv)) { errEl.textContent = 'Ingresá valores numéricos válidos.'; return; }
  if (minv >= maxv) { errEl.textContent = 'El mínimo debe ser menor que el máximo.'; return; }
  if (data.find(r => r.ts === dt.ts)) { errEl.textContent = 'Ya existe un registro para esa fecha.'; return; }
  data.push({ ts: dt.ts, fecha: dt.str, min: minv, max: maxv });
  data.sort((a, b) => a.ts - b.ts);
  save();
  document.getElementById('f-fecha').value = '';
  document.getElementById('f-min').value = '';
  document.getElementById('f-max').value = '';
  page = Math.floor((data.length - 1) / PAGE);
  render();
}

function delEntry(ts) {
  if (!confirm('¿Eliminar este registro?')) return;
  data = data.filter(r => r.ts !== ts);
  save();
  const maxP = Math.max(0, Math.ceil(data.length / PAGE) - 1);
  if (page > maxP) page = maxP;
  render();
}

function clearAll() {
  if (!confirm('¿Estás seguro de que quieres borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
  data = [];
  save();
  render();
}

function alerts(mn, mx) {
  const a = [];
  if (mn <= A1 && A1 <= mx) a.push(A1);
  if (mn <= A2 && A2 <= mx) a.push(A2);
  return a;
}

function fmt(n) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function render() {
  const hasData = data.length > 0;
  document.getElementById('metrics-wrap').style.display = hasData ? 'block' : 'none';
  document.getElementById('chart-wrap').style.display = hasData ? 'block' : 'none';
  document.getElementById('table-wrap').style.display = hasData ? 'block' : 'none';
  if (!hasData) {
    document.getElementById('tbody').innerHTML = '<tr><td colspan="7" class="empty">Sin datos cargados</td></tr>';
    return;
  }

  let sumPct = 0, sumNom = 0, cntAlrt = 0;
  data.forEach(r => {
    const n = r.max - r.min;
    sumNom += n;
    sumPct += (n / r.min * 100);
    if (alerts(r.min, r.max).length) cntAlrt++;
  });
  document.getElementById('m-pct').textContent = (sumPct / data.length).toFixed(2) + '%';
  document.getElementById('m-nom').textContent = fmt(sumNom / data.length);
  document.getElementById('m-days').textContent = data.length;
  document.getElementById('m-alrt').textContent = cntAlrt;

  const totalP = Math.max(1, Math.ceil(data.length / PAGE));
  page = Math.max(0, Math.min(page, totalP - 1));
  const s = page * PAGE;
  const slice = data.slice(s, s + PAGE);
  document.getElementById('nav-info').textContent = 'Página ' + (page + 1) + ' de ' + totalP;
  document.getElementById('btn-prev').disabled = page === 0;
  document.getElementById('btn-next').disabled = page >= totalP - 1;

  drawCandles(slice);
  renderTable(slice);
}

function switchTab(t) {
  document.getElementById('tab-panel').style.display = t === 'panel' ? 'block' : 'none';
  document.getElementById('tab-search').style.display = t === 'search' ? 'block' : 'none';
  const btns = document.querySelectorAll('.tab-btn');
  btns[0].classList.toggle('active', t === 'panel');
  btns[1].classList.toggle('active', t === 'search');
}

function searchLevel() {
  const v = parseFloat(document.getElementById('s-val').value);
  const wrap = document.getElementById('search-results-wrap');
  const tbody = document.getElementById('s-tbody');
  if (isNaN(v)) { wrap.style.display = 'none'; return; }
  
  const res = data.filter(r => v >= r.min && v <= r.max);
  wrap.style.display = 'block';
  
  if (!res.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No se encontraron días que contengan ese nivel de precio</td></tr>';
    return;
  }
  
  tbody.innerHTML = res.sort((a,b) => b.ts - a.ts).map(r => {
    const pct = ((r.max - r.min) / r.min * 100).toFixed(2);
    const al = alerts(r.min, r.max);
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

function goPage(d) { page += d; render(); }

function drawCandles(slice) {
  const W = 540, H = 280, padL = 58, padR = 16, padT = 18, padB = 36;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = slice.length;

  const allVals = slice.flatMap(r => [r.min, r.max]).concat([A1, A2]);
  const dMin = Math.min(...allVals), dMax = Math.max(...allVals);
  const span = dMax - dMin || 1;
  const yBuf = span * 0.08;
  const yMin = dMin - yBuf, yMax = dMax + yBuf;

  function yPx(v) { return padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }

  const colW = plotW / Math.max(n, 1);
  const cw = Math.min(colW * 0.45, 30);

  let parts = [];

  // Fondo
  parts.push(`<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="#fafaf8" rx="4"/>`);

  // Grilla
  for (let i = 0; i <= 4; i++) {
    const v = yMin + (yMax - yMin) * i / 4;
    const y = yPx(v);
    parts.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#e8e6de" stroke-width="0.5"/>`);
    parts.push(`<text x="${padL - 4}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="9" fill="#888780">${Math.round(v).toLocaleString('es-AR')}</text>`);
  }

  // Líneas de alerta
  [[A1, '#BA7517'], [A2, '#A32D2D']].forEach(([lvl, col]) => {
    const y = yPx(lvl);
    parts.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="${col}" stroke-width="1.2" stroke-dasharray="5,3"/>`);
    parts.push(`<text x="${(W - padR - 2).toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="end" font-size="9" font-weight="bold" fill="${col}">${lvl.toLocaleString('es-AR')}</text>`);
  });

  // Velas
  slice.forEach((r, i) => {
    const cx = padL + colW * i + colW / 2;
    const yTop = yPx(r.max), yBot = yPx(r.min);
    const rectH = Math.max(yBot - yTop, 2);
    const hasAlert = alerts(r.min, r.max).length > 0;
    const col = hasAlert ? '#D85A30' : '#1D9E75';

    parts.push(`<line x1="${cx.toFixed(1)}" y1="${(yTop - 5).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yTop.toFixed(1)}" stroke="${col}" stroke-width="1.5"/>`);
    parts.push(`<line x1="${cx.toFixed(1)}" y1="${yBot.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(yBot + 5).toFixed(1)}" stroke="${col}" stroke-width="1.5"/>`);
    parts.push(`<rect x="${(cx - cw / 2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${cw.toFixed(1)}" height="${rectH.toFixed(1)}" fill="${col}" rx="3"/>`);

    if (hasAlert) {
      parts.push(`<circle cx="${cx.toFixed(1)}" cy="${(yTop - 12).toFixed(1)}" r="5" fill="#A32D2D"/>`);
      parts.push(`<text x="${cx.toFixed(1)}" y="${(yTop - 8.5).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="bold" fill="#fff">!</text>`);
    }

    // Etiquetas eje X
    const fp = r.fecha.split('/');
    const lbl = fp.length === 3 ? fp[0] + '/' + fp[1] : r.fecha;
    const yr = fp[2] ? fp[2].slice(2) : '';
    parts.push(`<text x="${cx.toFixed(1)}" y="${(H - padB + 13).toFixed(1)}" text-anchor="middle" font-size="9" fill="#5f5e5a">${lbl}</text>`);
    parts.push(`<text x="${cx.toFixed(1)}" y="${(H - padB + 23).toFixed(1)}" text-anchor="middle" font-size="8" fill="#b4b2a9">${yr}</text>`);
  });

  document.getElementById('csvg').innerHTML = parts.join('');
}

function renderTable(slice) {
  const tb = document.getElementById('tbody');
  if (!slice || !slice.length) { tb.innerHTML = '<tr><td colspan="7" class="empty">Sin datos</td></tr>'; return; }
  tb.innerHTML = [...slice].reverse().map(r => {
    const nom = r.max - r.min;
    const pct = (nom / r.min * 100).toFixed(2);
    const al = alerts(r.min, r.max);
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

// Auto-formato de fecha
document.getElementById('f-fecha').addEventListener('input', function() {
  const digits = this.value.replace(/[^0-9]/g, '');
  let out = '';
  for (let i = 0; i < digits.length && i < 8; i++) {
    if (i === 2 || i === 4) out += '/';
    out += digits[i];
  }
  this.value = out;
});

// Enter para navegar entre campos
const fields = ['f-fecha', 'f-min', 'f-max'];
fields.forEach((id, i) => {
  document.getElementById(id).addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      if (i < fields.length - 1) document.getElementById(fields[i + 1]).focus();
      else addEntry();
    }
  });
});

render();
