/* 
  app.js – checklist behavior
  ----------------------------------------------------
  - Persists checkbox states in localStorage by item key
  - Lets you add sections/items dynamically
  - Calculates progress
  - Export/Import the current state (keys + checked)
  - Collapsible sections
*/

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// ---- Storage helpers --------------------------------------------------------
const LS_PREFIX = 'chk_'; // prefix so your keys don't collide with other apps

function save(key, val){ localStorage.setItem(LS_PREFIX + key, val); }
function load(key){ return localStorage.getItem(LS_PREFIX + key); }
function remove(key){ localStorage.removeItem(LS_PREFIX + key); }

// Persist a list of all known item keys (so export can be complete)
const INDEX_KEY = '__index';
function indexGet(){
  try { return JSON.parse(load(INDEX_KEY) || '[]'); } catch { return []; }
}
function indexAdd(key){
  const idx = new Set(indexGet());
  idx.add(key);
  save(INDEX_KEY, JSON.stringify([...idx]));
}
function indexClear(){
  save(INDEX_KEY, JSON.stringify([]));
}

// ---- Checkbox wiring --------------------------------------------------------
function wireCheckbox(cb){
  const key = cb.dataset.key;
  if (!key) return;

  // On first load, restore checked state
  const saved = load(key);
  if (saved !== null) cb.checked = saved === '1';

  // Update styling for "done"
  reflectDone(cb);

  // Save on change
  cb.addEventListener('change', () => {
    save(key, cb.checked ? '1' : '0');
    reflectDone(cb);
    updateProgress();
  });

  // Track this key so exports include it even if currently unchecked
  indexAdd(key);
}

function reflectDone(cb){
  const row = cb.closest('.check');
  if (!row) return;
  row.classList.toggle('done', cb.checked);
}

// Wire all current checkboxes
function wireAll(){
  $$('#list input[type="checkbox"]').forEach(wireCheckbox);
}

// ---- Progress bar -----------------------------------------------------------
function updateProgress(){
  const boxes = $$('#list input[type="checkbox"]');
  const total = boxes.length;
  const done = boxes.filter(b => b.checked).length;
  const pct = total ? Math.round((done/total)*100) : 0;

  $('#progress').style.width = pct + '%';
  $('#count').textContent = `${done}/${total} completed (${pct}%)`;
}

// ---- Collapse/expand sections ----------------------------------------------
function wireCollapsers(){
  $$('#list .collapse').forEach(btn => {
    btn.onclick = () => {
      const card = btn.closest('.card');
      card.classList.toggle('collapsed');
    };
  });
}

// ---- Add item / section -----------------------------------------------------
function makeItemRow(key, labelText){
  // Create a labeled checkbox row
  const label = document.createElement('label');
  label.className = 'check';

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.dataset.key = key;

  const span = document.createElement('span');
  span.textContent = labelText;

  label.appendChild(cb);
  label.appendChild(span);

  // Enable persistence & events
  wireCheckbox(cb);

  return label;
}

function slugify(s){
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'_')
    .replace(/^_+|_+$/g,'')
    .slice(0,60);
}

function randomSuffix(){
  return Math.random().toString(36).slice(2,7);
}

function addItemToSection(card){
  const name = prompt('Item label (e.g., "Install RAM")');
  if (!name) return;

  // Build a stable, unique key for storage
  const sectionKey = card.dataset.sectionKey || 'section';
  const key = `${sectionKey}_${slugify(name)}_${randomSuffix()}`;

  const row = makeItemRow(key, name);
  card.querySelector('.items').appendChild(row);

  updateProgress();
}

function addSection(){
  const title = prompt('Section title (e.g., "Networking")');
  if (!title) return;

  // Unique section slug
  const sectionKey = slugify(title) || `section_${randomSuffix()}`;
  const card = document.createElement('section');
  card.className = 'card';
  card.dataset.sectionKey = sectionKey;

  card.innerHTML = `
    <div class="card-head">
      <h2>${title}</h2>
      <div class="card-actions">
        <button class="add-item" title="Add item">+ Item</button>
        <button class="collapse" title="Collapse/Expand">▾</button>
      </div>
    </div>
    <div class="items"></div>
  `;

  $('#list').appendChild(card);

  // Wire the new section’s buttons
  card.querySelector('.add-item').addEventListener('click', () => addItemToSection(card));
  card.querySelector('.collapse').addEventListener('click', (e) => {
    card.classList.toggle('collapsed');
  });
}

// ---- Export / Import --------------------------------------------------------
function exportData(){
  // Build a simple { key: 0|1 } map of all known items
  const keys = indexGet();
  const out = {};
  keys.forEach(k => { out[k] = load(k) === '1' ? 1 : 0; });

  const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'server-checklist.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      // Write into localStorage then reflect in UI
      Object.entries(data).forEach(([k,v])=>{
        save(k, v ? '1' : '0');
        // If the item exists in the DOM, update its checked state
        const box = $(`#list input[type="checkbox"][data-key="${CSS.escape(k)}"]`);
        if (box){
          box.checked = !!v;
          reflectDone(box);
        }
        // Track key in index (in case this key didn’t exist before)
        indexAdd(k);
      });
      updateProgress();
      alert('Import complete.');
    }catch(e){
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
}

// ---- Clear all --------------------------------------------------------------
function clearAll(){
  if (!confirm('Clear all saved check states?')) return;
  // Remove just our indexed keys
  indexGet().forEach(k => remove(k));
  indexClear();
  // Uncheck UI
  $$('#list input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    reflectDone(cb);
  });
  updateProgress();
}

// ---- Wire page controls -----------------------------------------------------
function wireControls(){
  // Existing “Add item” buttons on initial sections
  $$('.add-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      addItemToSection(card);
    });
  });

  $('#add-section').addEventListener('click', addSection);
  $('#export').addEventListener('click', exportData);
  $('#clear').addEventListener('click', clearAll);

  $('#import').addEventListener('change', (e)=>{
    const file = e.target.files?.[0];
    if (file) importData(file);
    e.target.value = '';
  });
}

// ---- Init -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ app.js loaded and DOM ready");

  try {
    wireAll();
    wireControls();
    wireCollapsers();
    updateProgress();
  } catch (err) {
    console.error("❌ Error during init:", err);
  }
});

