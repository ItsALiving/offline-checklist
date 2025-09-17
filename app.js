(function () {
  const boxes = document.querySelectorAll('input[type="checkbox"]');

  boxes.forEach(cb => {
    const key = cb.dataset.key || cb.id;
    const saved = localStorage.getItem(key);
    if (saved !== null) cb.checked = saved === '1';

    cb.addEventListener('change', () => {
      localStorage.setItem(key, cb.checked ? '1' : '0');
    });
  });

  // Clear all button
  document.getElementById('clear')?.addEventListener('click', () => {
    boxes.forEach(cb => {
      const key = cb.dataset.key || cb.id;
      cb.checked = false;
      localStorage.setItem(key, '0');
    });
  });
})();
