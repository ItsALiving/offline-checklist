// app.js (registration bit)
if ('serviceWorker' in navigator) {
  const swUrl = 'sw.js'; // same folder as index.html on GitHub Pages
  navigator.serviceWorker.register(swUrl).then((reg) => {
    // Poll occasionally for updates
    setInterval(() => reg.update(), 60 * 60 * 1000); // hourly

    // When a new worker is found…
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', () => {
        // When it finishes installing and there is an existing controller,
        // tell it to activate immediately and then reload the page.
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          newSW.postMessage('SKIP_WAITING');
        }
      });
    });
  });

  // Reload the page when the new SW becomes the active controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
