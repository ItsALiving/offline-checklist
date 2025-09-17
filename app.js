
// PWA: register service worker (safe)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      console.log('SW registered', reg.scope);
      const s = document.getElementById('status');
      if (s) s.textContent = 'Ready (offline-enabled)';
    }).catch(err => {
      console.warn('SW registration failed', err);
      const s = document.getElementById('status');
      if (s) s.textContent = 'Ready (no SW)';
    });
  });
}


document.addEventListener('DOMContentLoaded', () => {
const STORAGE_KEY = "server_checklist_v1";

const SECTIONS = [
  {
    title: "Parts Shopping",
    items: [
      {t:"CPU: AMD Ryzen 5 5600G (iGPU, cooler included)"},
      {t:"Motherboard: B550 mATX (e.g., ASUS B550M‑A Prime WiFi II)"},
      {t:"RAM: 32 GB (2×16 GB) DDR4‑3200 CL16"},
      {t:"Storage: 1 TB NVMe SSD (PCIe 3.0/4.0)"},
      {t:"PSU: 550–650 W 80+ Bronze (semi‑modular preferred)"},
      {t:"Case: micro‑ATX tower with good airflow"},
      {t:"(Optional) Extra case fan(s)"}
    ]
  },
  {
    title: "Hardware Assembly",
    items: [
      {t:"Install CPU on motherboard (triangle alignment)"},
      {t:"Apply cooler (Wraith Stealth) & plug CPU_FAN"},
      {t:"Install RAM in the recommended slots (A2/B2)"},
      {t:"Insert NVMe SSD into M.2 slot & secure screw"},
      {t:"Mount motherboard into case (use standoffs)"},
      {t:"Install PSU; route 24‑pin ATX, 8‑pin CPU cables"},
      {t:"Connect case front‑panel (PWR SW, RESET, LEDs)"},
      {t:"Connect front I/O (USB, audio)"},
      {t:"Add case fans & set airflow (front intake, rear exhaust)"}
    ]
  },
  {
    title: "First Boot / BIOS",
    items: [
      {t:"Enter BIOS (DEL/F2)"},
      {t:"Enable XMP/DOCP for RAM speed"},
      {t:"Set USB installer as first boot device"},
      {t:"Check temps & fan speeds; save & exit"}
    ]
  },
  {
    title: "Windows 11 Install",
    items: [
      {t:"Create Windows 11 USB installer (Media Creation Tool)"},
      {t:"Boot from USB → Install Now → Windows 11 Pro"},
      {t:"Delete partitions on NVMe → let Windows create new"},
      {t:"Create local admin account & strong password"}
    ]
  },
  {
    title: "Post‑Install Setup",
    items: [
      {t:"Install AMD chipset drivers"},
      {t:"Run Windows Update until fully patched"},
      {t:"Enable Remote Desktop (Settings → System → Remote Desktop)"},
      {t:"Install motherboard LAN/Wi‑Fi drivers if needed"},
      {t:"Set power plan to High Performance (for servers)"}
    ]
  },
  {
    title: "Game Servers",
    items: [
      {t:"Install Java (for Minecraft server version)"},
      {t:"Download MC server .jar → run once → accept EULA"},
      {t:"Edit server.properties (port, whitelist, RAM)"},
      {t:"Install Satisfactory Dedicated Server (SteamCMD/Epic)"},
      {t:"Test local start for each server"}
    ]
  },
  {
    title: "Networking & Hardening",
    items: [
      {t:"Reserve static IP in router or set static on Windows"},
      {t:"Forward necessary ports (e.g., 25565 for Minecraft)"},
      {t:"Add Windows Firewall rules for required ports"},
      {t:"Create non‑admin user to run servers"},
      {t:"Set up backups for world data (script or scheduled task)"}
    ]
  },
  {
    title: "Optional Quality‑of‑Life",
    items: [
      {t:"Auto‑start servers on boot (Task Scheduler / Service)"},
      {t:"Install monitoring (e.g., HWInfo, OpenHardwareMonitor)"},
      {t:"Enable automatic Windows maintenance & updates window"},
      {t:"Document admin creds, ports, and backup locations"}
    ]
  }
];

// --- State ---
let state = load() || defaultState();
render();
updateProgress();

// --- Functions ---
function defaultState(){
  return {
    sections: SECTIONS.map(sec => ({
      title: sec.title,
      open: true,
      items: sec.items.map(it => ({t: it.t, done:false}))
    }))
  };
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const obj = JSON.parse(raw);
    // Simple migration guard
    if(!obj.sections) return null;
    return obj;
  }catch(e){ return null; }
}

function render(){
  const root = document.getElementById('list');
  root.innerHTML = '';
  state.sections.forEach((sec, si)=>{
    const card = document.createElement('div');
    card.className = 'card';
    const h = document.createElement('h2');
    h.textContent = sec.title;
    h.style.display='flex'; h.style.justifyContent='space-between'; h.style.alignItems='center';
    const toggle = document.createElement('button');
    toggle.textContent = sec.open ? 'Collapse' : 'Expand';
    toggle.className = 'btn-clear';
    toggle.onclick = ()=>{ sec.open = !sec.open; save(); render(); };
    h.appendChild(toggle);
    card.appendChild(h);

    const container = document.createElement('div');
    container.style.display = sec.open ? 'block' : 'none';

    sec.items.forEach((it, ii)=>{
      const row = document.createElement('div');
      row.className = 'item' + (it.done ? ' done' : '');

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = it.done;
      cb.onchange = ()=>{
        it.done = cb.checked;
        if(it.done){ row.classList.add('done'); } else { row.classList.remove('done'); }
        save(); updateProgress();
      };
      const label = document.createElement('label');
      label.textContent = it.t;

      row.appendChild(cb);
      row.appendChild(label);
      container.appendChild(row);
    });

    card.appendChild(container);
    root.appendChild(card);
  });
}

function updateProgress(){
  const all = state.sections.flatMap(s=>s.items);
  const done = all.filter(i=>i.done).length;
  const pct = all.length ? Math.round(done * 100 / all.length) : 0;
  const pg = document.getElementById('progress');
  const pt = document.getElementById('progressText');
  pg.value = pct;
  pt.textContent = `${pct}% • ${done}/${all.length}`;
}

// Controls
document.getElementById('expandAll').onclick = ()=>{
  state.sections.forEach(s=>s.open=true); save(); render();
};
document.getElementById('collapseAll').onclick = ()=>{
  state.sections.forEach(s=>s.open=false); save(); render();
};
document.getElementById('resetBtn').onclick = ()=>{
  if(confirm('Reset all progress?')){
    state = defaultState(); save(); render(); updateProgress();
  }
};
document.getElementById('exportBtn').onclick = ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'server_checklist_progress.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
};
document.getElementById('importFile').addEventListener('change', (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const obj = JSON.parse(reader.result);
      if(obj && obj.sections){ state = obj; save(); render(); updateProgress(); }
      else alert('Invalid file');
    }catch(err){ alert('Invalid JSON'); }
  };
  reader.readAsText(file);
});
});
