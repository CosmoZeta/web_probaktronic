// Global JavaScript for Probaktronic Dashboard Platform - Master Controller

document.addEventListener('DOMContentLoaded', () => {
  console.log('Probaktronic Dashboard System Loaded.');

  const sidebar = document.querySelector('.sidebar');
  const btnMinimize = document.querySelector('.btn-sidebar-minimize');

  // Check state memory
  let isManualLocked = sessionStorage.getItem('sidebar_locked') === 'true';
  let isHovered = sessionStorage.getItem('sidebar_hovered') === 'true';

  if (sidebar) {
    if (!isManualLocked && isHovered) {
      sidebar.classList.remove('minimized');
      document.documentElement.classList.add('sidebar-expanded-init');
      updateSidebarToggleUI(false);
    } else if (isManualLocked) {
      sidebar.classList.add('minimized');
      document.documentElement.classList.remove('sidebar-expanded-init');
      updateSidebarToggleUI(true);
    } else {
      sidebar.classList.add('minimized');
      document.documentElement.classList.remove('sidebar-expanded-init');
      updateSidebarToggleUI(true);
    }

    // Expand on Mouse Enter (Hover)
    sidebar.addEventListener('mouseenter', () => {
      if (!isManualLocked) {
        sidebar.classList.remove('minimized');
        document.documentElement.classList.add('sidebar-expanded-init');
        sessionStorage.setItem('sidebar_hovered', 'true');
        updateSidebarToggleUI(false);
      }
    });

    // Collapse ONLY on Mouse Leave (When user moves pointer outside sidebar)
    sidebar.addEventListener('mouseleave', () => {
      if (!isManualLocked) {
        sidebar.classList.add('minimized');
        document.documentElement.classList.remove('sidebar-expanded-init');
        sessionStorage.setItem('sidebar_hovered', 'false');
        updateSidebarToggleUI(true);
      }
    });

    // Handle Manual Click Toggle
    if (btnMinimize) {
      btnMinimize.addEventListener('click', (e) => {
        e.stopPropagation();
        
        isManualLocked = !isManualLocked;
        sessionStorage.setItem('sidebar_locked', isManualLocked ? 'true' : 'false');

        if (isManualLocked) {
          sidebar.classList.add('minimized');
          document.documentElement.classList.remove('sidebar-expanded-init');
          sessionStorage.setItem('sidebar_hovered', 'false');
          updateSidebarToggleUI(true);
        } else {
          sidebar.classList.remove('minimized');
          document.documentElement.classList.add('sidebar-expanded-init');
          sessionStorage.setItem('sidebar_hovered', 'true');
          updateSidebarToggleUI(false);
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
    if (href === currentPath) {
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
      const cardTitle = card.querySelector('.vehicle-model').textContent.toLowerCase();
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
      const componentName = item.querySelector('strong').textContent;
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
        const code = card.querySelector('.product-code').textContent.toLowerCase();
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
