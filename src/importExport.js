import { getData, mergeEntries } from './dataService.js';

export function exportData() {
  const data = getData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  a.href = url;
  a.download = `eth-history-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData() {
  document.getElementById('import-file').click();
}

export function handleImport(e, onDone) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw new Error();
      
      const addedCount = mergeEntries(imported);
      if (onDone) onDone(addedCount);
    } catch(err) {
      if (onDone) onDone(null, 'Error: El archivo no tiene un formato válido.');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}
