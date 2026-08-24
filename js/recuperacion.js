/**
 * Lógica interactiva para la pantalla de Recuperación de Tableros
 */

document.addEventListener('DOMContentLoaded', () => {
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

  // Elements
  $statTotalFiles = document.getElementById('statTotalFiles');
  $statTotalBrands = document.getElementById('statTotalBrands');
  $statTotalModels = document.getElementById('statTotalModels');
  $brandsContainer = document.getElementById('brandsContainer');
  $chipFilterContainer = document.getElementById('chipFilterContainer');
  $searchInput = document.getElementById('searchInput');
  $btnResetFilters = document.getElementById('btnResetFilters');
  $filesGridContainer = document.getElementById('filesGridContainer');
  $resultsCountBadge = document.getElementById('resultsCountBadge');

  // Detail Modal elements
  const infoModal = new bootstrap.Modal(document.getElementById('fileInfoModal'));
  const modalModelTitle = document.getElementById('modalModelTitle');
  const modalBrandName = document.getElementById('modalBrandName');
  const modalChipType = document.getElementById('modalChipType');
  const modalYearRange = document.getElementById('modalYearRange');
  const modalFileSize = document.getElementById('modalFileSize');
  const modalFileName = document.getElementById('modalFileName');
  const modalDownloadBtn = document.getElementById('modalDownloadBtn');

  // Init
  initStats();
  renderBrandsGrid();
  renderChipPills();
  renderFilesGrid();

  // Search input event
  $searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    renderFilesGrid();
  });

  // Reset button event
  $btnResetFilters.addEventListener('click', () => {
    currentBrand = 'ALL';
    currentSearch = '';
    currentChipGroup = 'ALL';
    $searchInput.value = '';
    renderBrandsGrid();
    renderChipPills();
    renderFilesGrid();
  });

  function initStats() {
    const totalFiles = RECUPERACION_DATA.length;
    const brandsSet = new Set(RECUPERACION_DATA.map(d => d.brand));
    const modelsSet = new Set(RECUPERACION_DATA.map(d => `${d.brand}-${d.model}`));

    if ($statTotalFiles) $statTotalFiles.textContent = totalFiles;
    if ($statTotalBrands) $statTotalBrands.textContent = brandsSet.size;
    if ($statTotalModels) $statTotalModels.textContent = modelsSet.size;
  }

  function renderBrandsGrid() {
    if (!$brandsContainer) return;

    // Count per brand
    const brandCounts = {};
    RECUPERACION_DATA.forEach(item => {
      brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
    });

    const sortedBrands = Object.keys(BRAND_LOGOS).sort();

    let html = `
      <div class="brand-card-button ${currentBrand === 'ALL' ? 'active' : ''}" data-brand="ALL">
        <i class="bi bi-grid-3x3-gap-fill text-danger fs-3"></i>
        <span class="brand-card-name">TODAS</span>
        <span class="brand-card-count">${RECUPERACION_DATA.length}</span>
      </div>
    `;

    sortedBrands.forEach(brand => {
      const count = brandCounts[brand] || 0;
      const logoUrl = BRAND_LOGOS[brand];
      const isActive = currentBrand === brand ? 'active' : '';

      html += `
        <div class="brand-card-button ${isActive}" data-brand="${brand}">
          <img src="${logoUrl}" alt="${brand}" class="brand-card-logo" onerror="this.src='logo_probaktronic_solo.png'">
          <span class="brand-card-name">${brand}</span>
          <span class="brand-card-count">${count}</span>
        </div>
      `;
    });

    $brandsContainer.innerHTML = html;

    // Add event listeners
    $brandsContainer.querySelectorAll('.brand-card-button').forEach(btn => {
      btn.addEventListener('click', () => {
        currentBrand = btn.dataset.brand;
        renderBrandsGrid();
        renderFilesGrid();
      });
    });
  }

  function renderChipPills() {
    if (!$chipFilterContainer) return;

    // Group chips into families
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

    const filtered = RECUPERACION_DATA.filter(item => {
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
          $btnResetFilters.click();
        });
      }
      return;
    }

    let html = '';
    filtered.forEach(item => {
      const logoUrl = BRAND_LOGOS[item.brand] || 'logo_probaktronic_solo.png';
      const isBin = item.ext === 'bin';

      html += `
        <div class="file-card-item">
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
    infoModal.show();
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
});
