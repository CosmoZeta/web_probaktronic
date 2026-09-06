/**
 * Lógica interactiva para el Dashboard y Recuperación de Tableros (Probaktronic)
 * Soporta modo Usuario Premium (solo lectura y descargas) y Administrador (gestión y eliminación)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const BRAND_LOGOS = {
    'CHANGAN': 'imagenes svg/ico_logo_changan.svg',
    'CHEVROLET': 'imagenes svg/ico_logo_chevrolet.png',
    'HYUNDAI': 'imagenes svg/ico_logo_hyundai.svg',
    'KIA': 'imagenes svg/ico_logo_kia.svg',
    'MITSUBISHI': 'imagenes svg/ico_logo_mitsubishi.svg',
    'NISSAN': 'imagenes svg/ico_logo_nissan.svg',
    'PEUGEOT': 'imagenes svg/ico_logo_peugeot.svg',
    'RENAULT': 'imagenes svg/ico_logo_renault.svg',
    'TOYOTA': 'imagenes svg/ico_logo_toyota.svg',
    'VW': 'imagenes svg/ico_logo_volkswagen.svg'
  };

  // State
  let currentBrand = 'ALL';
  let currentSearch = '';
  let currentChipGroup = 'ALL';

  // Modifications state (server synced)
  let hiddenItemIds = new Set(JSON.parse(localStorage.getItem('probak_hidden_recovery_items') || '[]'));
  let hiddenBrandNames = new Set(JSON.parse(localStorage.getItem('probak_hidden_recovery_brands') || '[]'));

  // Elements
  const $statTotalFiles = document.getElementById('statTotalFiles');
  const $statTotalBrands = document.getElementById('statTotalBrands');
  const $statTotalModels = document.getElementById('statTotalModels');
  const $brandsContainer = document.getElementById('brandsContainer');
  const $chipFilterContainer = document.getElementById('chipFilterContainer');
  const $searchInput = document.getElementById('searchInput');
  const $btnResetFilters = document.getElementById('btnResetFilters');
  const $filesGridContainer = document.getElementById('filesGridContainer');
  const $resultsCountBadge = document.getElementById('resultsCountBadge');

  // Detail Modal elements
  let infoModal = null;
  const modalEl = document.getElementById('fileInfoModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    infoModal = new bootstrap.Modal(modalEl);
  }
  const modalModelTitle = document.getElementById('modalModelTitle');
  const modalBrandName = document.getElementById('modalBrandName');
  const modalChipType = document.getElementById('modalChipType');
  const modalYearRange = document.getElementById('modalYearRange');
  const modalFileSize = document.getElementById('modalFileSize');
  const modalFileName = document.getElementById('modalFileName');
  const modalDownloadBtn = document.getElementById('modalDownloadBtn');

  // Sync modifications from Server
  await fetchServerModifications();

  // Init UI
  initStats();
  renderBrandsGrid();
  renderChipPills();
  renderFilesGrid();
  injectAdminToolbar();

  // Search input event
  if ($searchInput) {
    $searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderFilesGrid();
    });
  }

  // Reset button event
  if ($btnResetFilters) {
    $btnResetFilters.addEventListener('click', () => {
      currentBrand = 'ALL';
      currentSearch = '';
      currentChipGroup = 'ALL';
      if ($searchInput) $searchInput.value = '';
      renderBrandsGrid();
      renderChipPills();
      renderFilesGrid();
    });
  }

  function isAdminUser() {
    if (typeof window.isProbaktronicAdmin === 'function') {
      return window.isProbaktronicAdmin();
    }
    const raw = localStorage.getItem('probaktronic_cached_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        return (u.email === 'prueba@probak.com' || u.email === 'jhanzeta@gmail.com' || u.rol === 'admin' || u.isAdmin === true);
      } catch (e) {}
    }
    return false;
  }

  async function fetchServerModifications() {
    try {
      const res = await fetch('api/recuperacion.php?action=modificaciones&t=' + Date.now());
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          if (Array.isArray(json.data.hidden_items)) {
            json.data.hidden_items.forEach(id => hiddenItemIds.add(id));
            localStorage.setItem('probak_hidden_recovery_items', JSON.stringify(Array.from(hiddenItemIds)));
          }
          if (Array.isArray(json.data.hidden_brands)) {
            json.data.hidden_brands.forEach(b => hiddenBrandNames.add(b.toUpperCase()));
            localStorage.setItem('probak_hidden_recovery_brands', JSON.stringify(Array.from(hiddenBrandNames)));
          }
        }
      }
    } catch (e) {}
  }

  function getActiveData() {
    if (!Array.isArray(RECUPERACION_DATA)) return [];
    return RECUPERACION_DATA.filter(item => {
      if (hiddenItemIds.has(item.id)) return false;
      if (hiddenBrandNames.has(item.brand.toUpperCase())) return false;
      return true;
    });
  }

  function initStats() {
    const active = getActiveData();
    const totalFiles = active.length;
    const brandsSet = new Set(active.map(d => d.brand));
    const modelsSet = new Set(active.map(d => `${d.brand}-${d.model}`));

    if ($statTotalFiles) $statTotalFiles.textContent = totalFiles;
    if ($statTotalBrands) $statTotalBrands.textContent = brandsSet.size;
    if ($statTotalModels) $statTotalModels.textContent = modelsSet.size;
  }

  function injectAdminToolbar() {
    if (!isAdminUser()) return;
    const section = document.getElementById('recoveryFilesSection');
    if (!section || document.getElementById('adminRecoveryToolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'adminRecoveryToolbar';
    toolbar.className = 'admin-recovery-toolbar';
    toolbar.innerHTML = `
      <div class="d-flex align-items-center gap-2 small fw-bold text-dark">
        <i class="bi bi-shield-fill-check text-warning fs-5"></i>
        <span>Panel de Control Administrador: Puedes eliminar archivos individuales o tarjetas de marcas que no deseas mostrar.</span>
      </div>
      <button type="button" class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold" id="btnRestoreAllModifications">
        <i class="bi bi-arrow-counterclockwise me-1"></i> Restaurar Ocultos
      </button>
    `;

    section.insertBefore(toolbar, section.firstChild);

    document.getElementById('btnRestoreAllModifications')?.addEventListener('click', async () => {
      if (confirm('¿Deseas restaurar todos los archivos y marcas de tableros que fueron eliminados u ocultados?')) {
        hiddenItemIds.clear();
        hiddenBrandNames.clear();
        localStorage.removeItem('probak_hidden_recovery_items');
        localStorage.removeItem('probak_hidden_recovery_brands');

        try {
          await fetch('api/recuperacion.php?action=restaurar_todo', { method: 'POST' });
        } catch(e) {}

        if (typeof window.showGlobalToast === 'function') {
          window.showGlobalToast('Todos los respaldos y marcas han sido restaurados.');
        }
        initStats();
        renderBrandsGrid();
        renderFilesGrid();
      }
    });
  }

  function renderBrandsGrid() {
    if (!$brandsContainer) return;

    const active = getActiveData();
    const brandCounts = {};
    active.forEach(item => {
      brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
    });

    const sortedBrands = Object.keys(BRAND_LOGOS)
      .filter(brand => !hiddenBrandNames.has(brand.toUpperCase()))
      .sort();

    const isAdmin = isAdminUser();

    let html = `
      <div class="brand-card-button ${currentBrand === 'ALL' ? 'active' : ''}" data-brand="ALL">
        <i class="bi bi-grid-3x3-gap-fill text-danger fs-3"></i>
        <span class="brand-card-name">TODAS</span>
        <span class="brand-card-count">${active.length}</span>
      </div>
    `;

    sortedBrands.forEach(brand => {
      const count = brandCounts[brand] || 0;
      const logoUrl = BRAND_LOGOS[brand];
      const isActive = currentBrand === brand ? 'active' : '';

      html += `
        <div class="brand-card-button ${isActive}" data-brand="${brand}">
          ${isAdmin ? `<button type="button" class="btn-delete-brand-card" data-delete-brand="${brand}" title="Eliminar tarjeta de marca ${brand}"><i class="bi bi-x-lg"></i></button>` : ''}
          <img src="${logoUrl}" alt="${brand}" class="brand-card-logo" onerror="this.src='logo_probaktronic_solo.png'">
          <span class="brand-card-name">${brand}</span>
          <span class="brand-card-count">${count}</span>
        </div>
      `;
    });

    $brandsContainer.innerHTML = html;

    // Brand click events
    $brandsContainer.querySelectorAll('.brand-card-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-brand-card')) return;
        currentBrand = btn.dataset.brand;
        renderBrandsGrid();
        renderFilesGrid();
      });
    });

    // Admin Delete Brand Card Event
    if (isAdmin) {
      $brandsContainer.querySelectorAll('.btn-delete-brand-card').forEach(delBtn => {
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const targetBrand = delBtn.dataset.deleteBrand;
          if (!targetBrand) return;

          if (confirm(`¿Estás seguro de que deseas ELIMINAR la tarjeta de marca "${targetBrand}" y todos sus respaldos asociados del Dashboard?`)) {
            hiddenBrandNames.add(targetBrand.toUpperCase());
            localStorage.setItem('probak_hidden_recovery_brands', JSON.stringify(Array.from(hiddenBrandNames)));

            // Sincronizar eliminación en el servidor
            try {
              await fetch('api/recuperacion.php?action=eliminar_marca', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brand: targetBrand })
              });
            } catch (err) {}

            if (currentBrand === targetBrand) {
              currentBrand = 'ALL';
            }

            if (typeof window.showGlobalToast === 'function') {
              window.showGlobalToast(`Tarjeta de marca "${targetBrand}" eliminada correctamente.`);
            }

            initStats();
            renderBrandsGrid();
            renderFilesGrid();
          }
        });
      });
    }
  }

  function renderChipPills() {
    if (!$chipFilterContainer) return;

    const chipFamilies = ['ALL', '24C (EEPROM)', '93C (EEPROM)', '95/25 (EEPROM)', '9S12 (Motorola/NXP)', 'MB91F (Fujitsu)', 'S6J (Cypress/Spansion)', 'R7F (Renesas)'];

    let html = '<span class="chip-pill-title"><i class="bi bi-cpu"></i> Memoria / Chip:</span>';

    chipFamilies.forEach(fam => {
      const isActive = currentChipGroup === fam ? 'active' : '';
      html += `<button type="button" class="chip-pill ${isActive}" data-chipfam="${fam}">${fam}</button>`;
    });

    $chipFilterContainer.innerHTML = html;

    $chipFilterContainer.querySelectorAll('.chip-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        currentChipGroup = btn.dataset.chipfam;
        renderChipPills();
        renderFilesGrid();
      });
    });
  }

  function matchesChipFamily(chipStr, family) {
    if (family === 'ALL') return true;
    const c = (chipStr || '').toUpperCase();
    if (family.startsWith('24C')) return c.includes('24C');
    if (family.startsWith('93C')) return c.includes('93C');
    if (family.startsWith('95/25')) return c.includes('95') || c.includes('25');
    if (family.startsWith('9S12')) return c.includes('9S12') || c.includes('MC9S12');
    if (family.startsWith('MB91F')) return c.includes('MB91F');
    if (family.startsWith('S6J')) return c.includes('S6J');
    if (family.startsWith('R7F')) return c.includes('R7F');
    return true;
  }

  function renderFilesGrid() {
    if (!$filesGridContainer) return;

    const active = getActiveData();
    const isAdmin = isAdminUser();

    const filtered = active.filter(item => {
      // Brand filter
      if (currentBrand !== 'ALL' && item.brand !== currentBrand) return false;

      // Chip family filter
      if (!matchesChipFamily(item.chip, currentChipGroup)) return false;

      // Search filter
      if (currentSearch) {
        const query = currentSearch;
        const matchModel = item.model.toLowerCase().includes(query);
        const matchBrand = item.brand.toLowerCase().includes(query);
        const matchChip = item.chip.toLowerCase().includes(query);
        const matchYears = item.years.toLowerCase().includes(query);
        const matchFileName = item.fileName.toLowerCase().includes(query);
        if (!matchModel && !matchBrand && !matchChip && !matchYears && !matchFileName) {
          return false;
        }
      }

      return true;
    });

    if ($resultsCountBadge) {
      $resultsCountBadge.textContent = `${filtered.length} archivo${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
      $filesGridContainer.innerHTML = `
        <div class="empty-results-box">
          <i class="bi bi-search empty-results-icon"></i>
          <h5>No se encontraron archivos de respaldo</h5>
          <p class="mb-3">Intenta cambiar los términos de búsqueda o restablecer los filtros de marca y chip.</p>
          <button class="btn btn-outline-danger btn-sm rounded-pill px-4" id="emptyResetBtn">
            <i class="bi bi-arrow-counterclockwise"></i> Restablecer Filtros
          </button>
        </div>
      `;

      const emptyReset = document.getElementById('emptyResetBtn');
      if (emptyReset) {
        emptyReset.addEventListener('click', () => {
          if ($btnResetFilters) $btnResetFilters.click();
        });
      }
      return;
    }

    let html = '';
    filtered.forEach(item => {
      const logoUrl = BRAND_LOGOS[item.brand] || 'logo_probaktronic_solo.png';
      const isBin = item.ext === 'bin';

      html += `
        <div class="file-card-item" id="card_item_${item.id}">
          <div>
            <div class="file-card-top">
              <div class="file-brand-badge">
                <img src="${logoUrl}" alt="${item.brand}" class="file-brand-logo" onerror="this.src='logo_probaktronic_solo.png'">
                <span class="file-brand-name">${item.brand}</span>
              </div>
              <span class="file-ext-tag ${isBin ? 'bin' : ''}">${item.ext}</span>
            </div>

            <div class="file-card-title">${escapeHtml(item.model)}</div>

            <div class="file-card-meta">
              <span class="meta-pill meta-chip" title="Tipo de Memoria / Chip">
                <i class="bi bi-cpu-fill text-danger"></i> ${escapeHtml(item.chip)}
              </span>
              <span class="meta-pill meta-year" title="Rango de Años">
                <i class="bi bi-calendar-range"></i> ${escapeHtml(item.years)}
              </span>
              <span class="meta-pill meta-size" title="Tamaño del Archivo">
                <i class="bi bi-file-earmark-binary"></i> ${escapeHtml(item.fileSize)}
              </span>
            </div>
          </div>

          <div class="file-card-bottom">
            <a href="${encodeURI(item.filePath)}" download="${escapeHtml(item.fileName)}" class="btn-download-file" title="Descargar respaldo ${escapeHtml(item.fileName)}">
              <i class="bi bi-download fs-6"></i> Descargar Archivo
            </a>
            <button type="button" class="btn-info-file" data-id="${item.id}" title="Ver Detalles del Chip">
              <i class="bi bi-info-circle"></i>
            </button>
            ${isAdmin ? `
              <button type="button" class="btn-delete-file-card" data-delete-id="${item.id}" data-delete-name="${escapeHtml(item.model)}" title="Eliminar este archivo de respaldo">
                <i class="bi bi-trash3-fill"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });

    $filesGridContainer.innerHTML = html;

    // Attach modal info click listeners
    $filesGridContainer.querySelectorAll('.btn-info-file').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.id;
        const item = RECUPERACION_DATA.find(d => d.id === itemId);
        if (item) {
          showFileDetails(item);
        }
      });
    });

    // Attach Admin Delete File Event
    if (isAdmin) {
      $filesGridContainer.querySelectorAll('.btn-delete-file-card').forEach(delBtn => {
        delBtn.addEventListener('click', async () => {
          const itemId = delBtn.dataset.deleteId;
          const itemName = delBtn.dataset.deleteName || 'este archivo';

          if (confirm(`¿Estás seguro de que deseas ELIMINAR el archivo de respaldo para "${itemName}"?`)) {
            hiddenItemIds.add(itemId);
            localStorage.setItem('probak_hidden_recovery_items', JSON.stringify(Array.from(hiddenItemIds)));

            // Sincronizar eliminación en el servidor
            try {
              await fetch('api/recuperacion.php?action=eliminar_archivo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: itemId })
              });
            } catch (err) {}

            if (typeof window.showGlobalToast === 'function') {
              window.showGlobalToast(`Archivo "${itemName}" eliminado con éxito.`);
            }

            initStats();
            renderBrandsGrid();
            renderFilesGrid();
          }
        });
      });
    }
  }

  function showFileDetails(item) {
    if (modalModelTitle) modalModelTitle.textContent = `${item.brand} ${item.model}`;
    if (modalBrandName) modalBrandName.textContent = item.brand;
    if (modalChipType) modalChipType.textContent = item.chip;
    if (modalYearRange) modalYearRange.textContent = item.years;
    if (modalFileSize) modalFileSize.textContent = `${item.fileSize} (${item.bytes.toLocaleString()} bytes)`;
    if (modalFileName) modalFileName.textContent = item.fileName;
    if (modalDownloadBtn) {
      modalDownloadBtn.href = encodeURI(item.filePath);
      modalDownloadBtn.setAttribute('download', item.fileName);
    }
    if (infoModal) infoModal.show();
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
});
