// Global JavaScript for Probaktronic Dashboard Platform - Master Controller

document.addEventListener('DOMContentLoaded', () => {
  console.log('Probaktronic Dashboard System Loaded.');

  const sidebar = document.querySelector('.sidebar');
  const btnMinimize = document.querySelector('.btn-sidebar-minimize');

  // Check state memory
  let isManualLocked = sessionStorage.getItem('sidebar_locked') === 'true';
  let isHovered = sessionStorage.getItem('sidebar_hovered') === 'true';

  if (sidebar) {
    // Restore user preference state (Fixed state, no hover auto-expansion)
    if (isManualLocked) {
      sidebar.classList.add('minimized');
      updateSidebarToggleUI(true);
    } else {
      sidebar.classList.remove('minimized');
      updateSidebarToggleUI(false);
    }

    // Handle Manual Click Toggle Only
    if (btnMinimize) {
      btnMinimize.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const isCurrentlyMinimized = sidebar.classList.contains('minimized');
        if (isCurrentlyMinimized) {
          sidebar.classList.remove('minimized');
          sessionStorage.setItem('sidebar_locked', 'false');
          updateSidebarToggleUI(false);
        } else {
          sidebar.classList.add('minimized');
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
      sessionStorage.setItem('sidebar_hovered', 'true');

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
      }
    })
    .catch(err => {
      window.location.href = url;
    });
}

// Initialize Page Features Dynamically
function initCurrentPageFeatures() {
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

