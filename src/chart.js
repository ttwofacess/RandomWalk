import { A1, A2 } from './config.js';
import { getAlerts } from './dataService.js';

export function drawCandles(slice, maSlice) {
  const W = 540, H = 280, padL = 58, padR = 16, padT = 18, padB = 36;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = slice.length;

  const allVals = slice.flatMap(r => [r.min, r.max]).concat([A1, A2]);
  if (maSlice) {
    maSlice.forEach(m => { if (m) allVals.push(m.value); });
  }
  
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

  // Línea de Media Móvil (MA)
  if (maSlice && maSlice.length > 1) {
    let points = [];
    maSlice.forEach((m, i) => {
      if (m) {
        const cx = padL + colW * i + colW / 2;
        const cy = yPx(m.value);
        points.push(`${cx.toFixed(1)},${cy.toFixed(1)}`);
      }
    });
    if (points.length > 1) {
      parts.push(`<polyline points="${points.join(' ')}" fill="none" stroke="#4A90E2" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
    }
  }

  // Velas
  slice.forEach((r, i) => {
    const cx = padL + colW * i + colW / 2;
    const yTop = yPx(r.max), yBot = yPx(r.min);
    const rectH = Math.max(yBot - yTop, 2);
    const hasAlert = getAlerts(r.min, r.max).length > 0;
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
