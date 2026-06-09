import { PAGE } from './config.js';
import { loadData } from './storage.js';
import { initData, addEntry, deleteEntry, clearAllEntries } from './dataService.js';
import { exportData, importData, handleImport } from './importExport.js';
import { render, goPage, switchTab, setPage } from './ui.js';
import { searchLevel, searchLowestMin, searchHighestMax } from './searchRenderer.js';
import { sanitizeFecha, sanitizePrecio, parsePrecio } from './validator.js';

// Inicialización
initData(loadData());

// Exponer funciones al scope global para los onclick del HTML
window.switchTab = switchTab;
window.addEntry = function() {
  const fel = document.getElementById('f-fecha');
  const fv = sanitizeFecha(fel.value);
  const minv = parsePrecio(document.getElementById('f-min').value);
  const maxv = parsePrecio(document.getElementById('f-max').value);
  const errEl = document.getElementById('err');
  errEl.textContent = '';
  
  const res = addEntry(fv, minv, maxv);
  if (res.ok) {
    fel.value = '';
    document.getElementById('f-min').value = '';
    document.getElementById('f-max').value = '';
    setPage(Math.floor(res.index / PAGE));
    render();
  } else {
    errEl.textContent = res.error;
  }
};

window.delEntry = function(ts) {
  if (!confirm('¿Eliminar este registro?')) return;
  deleteEntry(ts);
  render();
};

window.clearAll = function() {
  if (!confirm('¿Estás seguro de que quieres borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
  clearAllEntries();
  render();
};

window.exportData = exportData;
window.importData = importData;
window.handleImport = function(e) {
  handleImport(e, (addedCount, error) => {
    if (error) {
      alert(error);
    } else {
      render();
      alert(`Importación completada. Se añadieron ${addedCount} nuevos registros.`);
    }
  });
};

window.goPage = goPage;
window.searchLevel = function() {
  const raw = document.getElementById('s-val').value;
  const v = parsePrecio(raw);
  searchLevel(v !== null ? v : NaN);
};
window.searchLowestMin = searchLowestMin;
window.searchHighestMax = searchHighestMax;

// Listeners: auto-formato de fecha y sanitización de precios
document.getElementById('f-fecha').addEventListener('input', function() {
  this.value = sanitizeFecha(this.value);
});

['f-min', 'f-max', 's-val'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', function() {
      this.value = sanitizePrecio(this.value);
    });
  }
});

// Enter para navegar entre campos
const fields = ['f-fecha', 'f-min', 'f-max'];
fields.forEach((id, i) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        if (i < fields.length - 1) document.getElementById(fields[i + 1]).focus();
        else window.addEntry();
      }
    });
  }
});

// Arranque inicial
render();
