// Register the service worker (required for offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./sw.js');
      document.getElementById('status').textContent = 'Service worker registered ✅';
    } catch (e) {
      document.getElementById('status').textContent = 'Service worker failed ❌';
      console.error(e);
    }
  });
}

// Tiny realtime/persistence sample
const cb = document.getElementById('cb');
const KEY = 'cb_state_v1';
cb.checked = localStorage.getItem(KEY) === '1';
cb.addEventListener('change', () => {
  localStorage.setItem(KEY, cb.checked ? '1' : '0');
});
