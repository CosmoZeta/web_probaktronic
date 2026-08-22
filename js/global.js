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

  // Intercept Sidebar Clicks for Instant Seamless Navigation
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link-item');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) return;

      e.preventDefault();
      // Seamlessly load target content
      loadPageContent(href);
    });
  });

  // Handle Browser Back / Forward Buttons
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.url) {
      loadPageContent(e.state.url, false);
    } else {
      const currentUrl = window.location.pathname.split('/').pop() || 'index.html';
      loadPageContent(currentUrl, false);
    }
  });

  // Initialize features on initial load
  initCurrentPageFeatures();
});

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

        // If switching to catalog, trigger Firestore load directly
        if (url.includes('catalogo.html') && typeof window.fetchFirestoreProducts === 'function') {
          window.fetchFirestoreProducts();
        }

        // If switching to vehiculos, trigger diagramas/vehiculos module directly
        if (url.includes('vehiculos.html')) {
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

  // Update date display
  const dateEl = document.getElementById('firmwareDateValue');
  if (dateEl) {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    dateEl.textContent = now.toLocaleDateString('es-ES', options);
  }

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

// Remove gray background from vehicle illustration
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

          // Check if pixel is background gray / off-white
          const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          if (diff < 36 || (r > 215 && g > 215 && b > 215 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10)) {
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

