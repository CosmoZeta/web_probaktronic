// Global JavaScript for Probaktronic Dashboard Platform - Master Controller

document.addEventListener('DOMContentLoaded', () => {
  console.log('Probaktronic Dashboard System Loaded.');

  const sidebar = document.querySelector('.sidebar');
  const btnMinimize = document.querySelector('.btn-sidebar-minimize');

  // Check state memory
  const isMinimized = sessionStorage.getItem('sidebar_locked') === 'true';

  if (sidebar) {
    // Restore user preference state
    if (isMinimized) {
      sidebar.classList.add('minimized');
      document.documentElement.classList.add('sidebar-minimized-init');
      updateSidebarToggleUI(true);
    } else {
      sidebar.classList.remove('minimized');
      document.documentElement.classList.remove('sidebar-minimized-init');
      updateSidebarToggleUI(false);
    }

    // Handle Manual Click Toggle
    if (btnMinimize) {
      btnMinimize.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isCurrentlyMinimized = sidebar.classList.contains('minimized');
        if (isCurrentlyMinimized) {
          sidebar.classList.remove('minimized');
          document.documentElement.classList.remove('sidebar-minimized-init');
          sessionStorage.setItem('sidebar_locked', 'false');
          updateSidebarToggleUI(false);
        } else {
          sidebar.classList.add('minimized');
          document.documentElement.classList.add('sidebar-minimized-init');
          sessionStorage.setItem('sidebar_locked', 'true');
          updateSidebarToggleUI(true);
        }
      });
    }
  }

  function updateSidebarToggleUI(minimized) {
    if (!btnMinimize) return;
    const icon = btnMinimize.querySelector('i');
    const label = btnMinimize.querySelector('span');
    
    if (icon) {
      icon.className = minimized ? 'bi bi-chevron-double-right' : 'bi bi-chevron-double-left';
    }
    if (label) {
      label.textContent = minimized ? 'Expandir' : 'Minimizar';
    }
    btnMinimize.setAttribute('title', minimized ? 'Expandir menú' : 'Minimizar menú');
  }

  // Highlight Active Link
  updateActiveNavLink();

  // Mobile Drawer Setup
  setupMobileDrawer();

  // Handle Sidebar Navigation Links
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link-item');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Close mobile drawer on navigation
      const sidebar = document.querySelector('.sidebar');
      const backdrop = document.getElementById('sidebarBackdrop');
      if (window.innerWidth < 768 && sidebar) {
        sidebar.classList.remove('mobile-open');
        if (backdrop) backdrop.classList.remove('active');
      }
    });
  });

  // Initialize features on initial load
  initCurrentPageFeatures();

  // Intercept clicks to Vehiculos section for Premium/Admin verification
  document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a[href*="vehiculos.html"], .action-card-vehicle');
    if (targetLink) {
      if (typeof window.handleVehiculosNavigation === 'function') {
        const allowed = window.handleVehiculosNavigation(e);
        if (!allowed) {
          e.preventDefault();
          e.stopPropagation();
        }
      } else {
        try {
          const raw = localStorage.getItem('probaktronic_cached_user');
          let isAuthOk = false;
          if (raw) {
            const u = JSON.parse(raw);
            const isAdmin = (u.email === 'prueba@probak.com' || u.email === 'jhanzeta@gmail.com' || u.rol === 'admin' || u.isAdmin === true);
            isAuthOk = isAdmin || (u.esPremium === true || u.esPremium === 'true' || u.tipo === 'premium');
          }
          if (!isAuthOk) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'login.html';
          }
        } catch (err) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = 'login.html';
        }
      }
    }
  }, true);

  // Protección Global: Desactivar menú contextual (clic derecho) y arrastre sobre imágenes de diagramas
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.console-diagram-img, .console-diagram-canvas, .console-watermark-overlay, #consoleImgViewerWrap, .vehicle-viewer-container, .diagram-img-secure, .protection-glass-shield')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  document.addEventListener('dragstart', (e) => {
    if (e.target.closest('.console-diagram-img, .console-diagram-canvas, .console-watermark-overlay, #consoleImgViewerWrap, .vehicle-viewer-container, .diagram-img-secure, .protection-glass-shield')) {
      e.preventDefault();
      return false;
    }
  }, true);

  // Protección Global Anti-DevTools y Bloqueo de Atajos de Descarga/Inspección
  document.addEventListener('keydown', (e) => {
    // 1. Bloquear F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // 2. Bloquear Ctrl + Shift + I (Inspeccionar)
    // 3. Bloquear Ctrl + Shift + J (Consola)
    // 4. Bloquear Ctrl + Shift + C (Selector de Elementos)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // 5. Bloquear Ctrl + U (Ver Código Fuente)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // 6. Bloquear Ctrl + S (Guardar Página Web Completa)
    if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
});

// Setup Mobile Menu Drawer & Backdrop
function setupMobileDrawer() {
  const btnMobileToggle = document.getElementById('btnMobileMenuToggle');
  const backdrop = document.getElementById('sidebarBackdrop');
  const sidebar = document.querySelector('.sidebar');

  if (btnMobileToggle && sidebar) {
    btnMobileToggle.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
      if (backdrop) backdrop.classList.toggle('active');
    };
  }

  if (backdrop && sidebar) {
    backdrop.onclick = () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
    };
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('active');
    }
  });

  // Handle window resize / device orientation changes
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (window.innerWidth >= 768 && sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        if (backdrop) backdrop.classList.remove('active');
      }
    }, 150);
  });
}

function updateActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link-item');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === 'bobinas.html' && href === 'sensores-actuadores.html')) {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

// Seamless Dynamic Page Loader
function loadPageContent(url, pushHistory = true) {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Network error');
      return res.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const newMain = doc.querySelector('.main-content');
      const currentMain = document.querySelector('.main-content');

      if (newMain && currentMain) {
        currentMain.innerHTML = newMain.innerHTML;
        document.title = doc.title;

        if (pushHistory) {
          history.pushState({ url }, doc.title, url);
        }

        updateActiveNavLink();
        initCurrentPageFeatures();
      }
    })
    .catch(err => {
      window.location.href = url;
    });
}

// Helper to load missing scripts on the fly
function loadScriptDynamically(src, callback) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    if (callback) callback();
    return;
  }
  const script = document.createElement('script');
  script.src = src;
  script.onload = () => {
    if (callback) callback();
  };
  document.body.appendChild(script);
}

// Initialize Page Features Dynamically
function initCurrentPageFeatures() {
  // Setup Mobile Drawer for current page
  setupMobileDrawer();

  // Check if Vehiculos page loaded
  if (document.getElementById('vehiculosBrandGrid')) {
    if (typeof window.initVehiculosDiagramasModule === 'function') {
      window.initVehiculosDiagramasModule();
    } else {
      loadScriptDynamically('js/vehiculos-diagramas.js', () => {
        if (typeof window.initVehiculosDiagramasModule === 'function') {
          window.initVehiculosDiagramasModule();
        }
      });
    }
  }

  // Check if Catalogo page loaded
  if (document.getElementById('catalogLoaderContainer') && typeof window.fetchFirestoreProducts === 'function') {
    window.fetchFirestoreProducts();
  }

  // Process vehicle illustration to remove gray background
  cleanVehicleImageBackground('.vehicle-half-img, .card-illustration-img');

  // Update date & time display in real time (Live Clock)
  function startLiveSystemClock() {
    const dateEl = document.getElementById('firmwareDateValue');
    if (!dateEl) return;

    function update() {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const month = months[now.getMonth()];
      const year = now.getFullYear();

      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
      const hours12 = String(hours % 12 || 12).padStart(2, '0');

      dateEl.textContent = `${day} ${month} ${year}, ${hours12}:${minutes}:${seconds} ${ampm}`;
    }

    update();
    setInterval(update, 1000);
  }

  startLiveSystemClock();

  // Vehiculos Filters
  const brandChips = document.querySelectorAll('.brand-chip');
  const vehicleCards = document.querySelectorAll('.vehicle-card');
  const vehicleSearchInput = document.getElementById('vehicleSearchInput');

  if (brandChips.length > 0) {
    brandChips.forEach(chip => {
      chip.addEventListener('click', () => {
        brandChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const selectedBrand = chip.dataset.brand;
        filterVehicles(selectedBrand, vehicleSearchInput ? vehicleSearchInput.value.toLowerCase() : '');
      });
    });
  }

  if (vehicleSearchInput) {
    vehicleSearchInput.addEventListener('input', (e) => {
      const activeChip = document.querySelector('.brand-chip.active');
      const selectedBrand = activeChip ? activeChip.dataset.brand : 'all';
      filterVehicles(selectedBrand, e.target.value.toLowerCase());
    });
  }

  function filterVehicles(brand, searchText) {
    vehicleCards.forEach(card => {
      const cardBrand = card.dataset.brand;
      const vehicleModelEl = card.querySelector('.vehicle-model');
      const cardTitle = vehicleModelEl ? vehicleModelEl.textContent.toLowerCase() : '';
      const matchesBrand = (brand === 'all' || cardBrand === brand);
      const matchesSearch = cardTitle.includes(searchText);

      card.style.display = (matchesBrand && matchesSearch) ? 'block' : 'none';
    });
  }

  // Diagramas 3D Tools
  const toolBtns = document.querySelectorAll('.viewer-tool-btn');
  const componentItems = document.querySelectorAll('.component-item');

  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('title') || 'Herramienta';
      showGlobalToast(`Modo 3D seleccionado: ${mode}`);
    });
  });

  componentItems.forEach(item => {
    item.addEventListener('click', () => {
      componentItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const strongEl = item.querySelector('strong');
      const componentName = strongEl ? strongEl.textContent : 'Componente';
      showGlobalToast(`Componente enfocado: ${componentName}`);
    });
  });

  // Galeria Dropzone
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) showGlobalToast(`Subiendo ${e.dataTransfer.files.length} archivo(s)...`);
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) showGlobalToast(`Subiendo ${e.target.files.length} archivo(s)...`);
    });
  }

  // Catalogo Live Search Filter
  const catalogSearchInput = document.getElementById('catalogSearchInput');
  const productGridContainer = document.getElementById('productGridContainer');
  
  if (catalogSearchInput && productGridContainer) {
    catalogSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const cards = productGridContainer.querySelectorAll('.product-card');
      
      cards.forEach(card => {
        const codeEl = card.querySelector('.product-code');
        const code = codeEl ? codeEl.textContent.toLowerCase() : '';
        card.style.display = code.includes(query) ? 'flex' : 'none';
      });
    });
  }
}

// Helper Toast Notification System
function showGlobalToast(message) {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '1100';
    document.body.appendChild(toastContainer);
  }

  const toastId = 'toast-' + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-bg-dark border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi bi-info-circle-fill text-danger fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  const toastEl = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
  bsToast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

// Universal Helper: Render Centered 0-100% Firebase Loader Card
window.createCenteredFirebaseLoader = function(container, subtitleText = 'Conectando con Cloud Firestore...') {
  if (!container) return null;

  container.innerHTML = `
    <div class="catalog-loader-container w-100 py-4" style="grid-column: 1 / -1;">
      <div class="loader-card mx-auto">
        <img src="logo_probaktronic_solo.png" alt="Probaktronic" height="52" class="pulse-animation mb-3">
        <h4 class="font-rajdhani fw-bold text-uppercase mb-1 text-dark">CARGANDO DESDE FIREBASE</h4>
        <p class="text-muted small mb-3">${subtitleText}</p>
        <div class="progress w-100 mb-2" style="height: 8px; border-radius: 4px; background-color: #E2E8F0;">
          <div class="loader-progress-bar progress-bar progress-bar-striped progress-bar-animated bg-danger" style="width: 0%;"></div>
        </div>
        <div class="loader-progress-percent fw-bold fs-4 text-danger font-rajdhani">0%</div>
      </div>
    </div>
  `;

  const bar = container.querySelector('.loader-progress-bar');
  const percentEl = container.querySelector('.loader-progress-percent');

  let currentPercent = 0;
  const timer = setInterval(() => {
    if (currentPercent < 90) {
      currentPercent += Math.floor(Math.random() * 15) + 10;
      if (currentPercent > 90) currentPercent = 90;
      if (bar) bar.style.width = currentPercent + '%';
      if (percentEl) percentEl.textContent = currentPercent + '%';
    }
  }, 80);

  return {
    finish: (callback) => {
      clearInterval(timer);
      if (bar) bar.style.width = '100%';
      if (percentEl) percentEl.textContent = '100%';
      setTimeout(() => {
        if (callback) callback();
      }, 200);
    }
  };
};

// Remove solid/gray backgrounds from card illustrations and make them transparent
function cleanVehicleImageBackground(selector) {
  const images = document.querySelectorAll(selector);
  images.forEach(img => {
    if (img.dataset.bgCleaned === 'true') return;

    const process = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        if (!canvas.width || !canvas.height) return;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Sample background color near top-left
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Check if pixel matches sampled background or is off-white / light gray / white background
          const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          const isLightNeutral = (r > 208 && g > 208 && b > 208 && Math.abs(r - g) < 16 && Math.abs(g - b) < 16);
          if (diff < 42 || isLightNeutral) {
            data[i + 3] = 0; // Transparent
          }
        }

        ctx.putImageData(imgData, 0, 0);
        img.src = canvas.toDataURL('image/png');
        img.dataset.bgCleaned = 'true';
      } catch (e) {
        console.warn('Canvas background removal error:', e);
      }
    };

    if (img.complete && (img.naturalWidth || img.width)) {
      process();
    } else {
      img.addEventListener('load', process, { once: true });
    }
  });
}

