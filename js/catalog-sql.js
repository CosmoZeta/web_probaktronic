// Probaktronic - Controlador Maestro de Tienda (Integrados y Drivers vs Computadoras ECUs)
console.log('--- Probaktronic Tienda & Catalog Controller Loaded ---');

window.probaktronicCatalogCache = null;
window.probaktronicEcuCache = null;
window.currentEcuBrandFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  setupCatalogSearch();
  setupEcuSearch();
  initTiendaRouting();
});

// ==========================================================================
// NAVEGACIÓN Y ENRUTAMIENTO DE CATEGORÍAS (URL HASH SUPPORT)
// ==========================================================================
function initTiendaRouting() {
  window.addEventListener('hashchange', () => {
    handleHashRouting();
  });
  handleHashRouting();
}

function handleHashRouting() {
  const hash = window.location.hash.toLowerCase();
  if (hash === '#integrados' || hash === '#drivers') {
    openStoreCategory('integrados', false);
  } else if (hash === '#ecus' || hash === '#computadoras') {
    openStoreCategory('ecus', false);
  } else {
    showTiendaCategories(false);
  }
}

window.openStoreCategory = function(category, updateHash = true) {
  const categoriesView = document.getElementById('storeCategoriesView');
  const integradosView = document.getElementById('storeIntegradosView');
  const ecusView = document.getElementById('storeEcusView');

  const headerGreeting = document.getElementById('storeHeaderGreeting');
  const headerTitle = document.getElementById('storeHeaderTitle');
  const headerSubtitle = document.getElementById('storeHeaderSubtitle');

  if (category === 'integrados') {
    if (categoriesView) categoriesView.classList.add('d-none');
    if (ecusView) ecusView.classList.add('d-none');
    if (integradosView) integradosView.classList.remove('d-none');

    if (headerGreeting) headerGreeting.textContent = 'BIBLIOTECA TÉCNICA Y REPUESTOS';
    if (headerTitle) headerTitle.textContent = 'VENTA DE INTEGRADOS Y DRIVERS ELECTRÓNICOS';
    if (headerSubtitle) headerSubtitle.textContent = 'Catálogo de circuitos integrados, microcontroladores, memorias y drivers automotrices';

    if (updateHash) window.location.hash = 'integrados';

    // Cargar productos de integrados
    fetchSqlProducts();
  } else if (category === 'ecus') {
    if (categoriesView) categoriesView.classList.add('d-none');
    if (integradosView) integradosView.classList.add('d-none');
    if (ecusView) ecusView.classList.remove('d-none');

    if (headerGreeting) headerGreeting.textContent = 'MÓDULOS Y UNIDADES DE CONTROL';
    if (headerTitle) headerTitle.textContent = 'VENTA DE COMPUTADORAS AUTOMOTRICES (ECUs)';
    if (headerSubtitle) headerSubtitle.textContent = 'Unidades de control electrónico de motor (ECU/ECM/PCM) probadas y garantizadas';

    if (updateHash) window.location.hash = 'ecus';

    // Cargar catálogo de ECUs
    fetchEcuProducts();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.showTiendaCategories = function(updateHash = true) {
  const categoriesView = document.getElementById('storeCategoriesView');
  const integradosView = document.getElementById('storeIntegradosView');
  const ecusView = document.getElementById('storeEcusView');

  const headerGreeting = document.getElementById('storeHeaderGreeting');
  const headerTitle = document.getElementById('storeHeaderTitle');
  const headerSubtitle = document.getElementById('storeHeaderSubtitle');

  if (categoriesView) categoriesView.classList.remove('d-none');
  if (integradosView) integradosView.classList.add('d-none');
  if (ecusView) ecusView.classList.add('d-none');

  if (headerGreeting) headerGreeting.textContent = 'BIBLIOTECA TÉCNICA Y TIENDA (PROBAKTRONIC)';
  if (headerTitle) headerTitle.textContent = 'TIENDA PROBAKTRONIC';
  if (headerSubtitle) headerSubtitle.textContent = 'Seleccione la categoría de productos que desea explorar';

  if (updateHash && window.location.hash) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ==========================================================================
// CARGA Y GESTIÓN DE INTEGRADOS Y DRIVERS
// ==========================================================================
function updateProgressUI(val) {
  const progressBar = document.getElementById('catalogProgressBar');
  const progressPercent = document.getElementById('catalogProgressPercent');
  if (progressBar) progressBar.style.width = `${val}%`;
  if (progressPercent) progressPercent.textContent = `${val}%`;
}

window.fetchSqlProducts = async function() {
  const container = document.getElementById('productGridContainer');
  const loaderContainer = document.getElementById('catalogLoaderContainer');

  if (!container || !loaderContainer) return;

  if (window.probaktronicCatalogCache && window.probaktronicCatalogCache.length > 0) {
    updateProgressUI(100);
    loaderContainer.style.display = 'none';
    container.classList.remove('d-none');
    renderSqlProducts(window.probaktronicCatalogCache, container);
    return;
  }

  loaderContainer.style.display = 'flex';
  container.classList.add('d-none');
  updateProgressUI(20);

  let products = [];

  // 1. Intentar cargar desde la API PHP de MySQL
  try {
    updateProgressUI(40);
    const response = await fetch('api/productos.php');
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const result = await response.json();
        products = result.data || [];
      }
    }
  } catch (e) {
    console.log('API PHP no disponible en este entorno, usando almacén local...');
  }

  // 2. Cargar desde data/productos.json si la API no devolvió datos
  if (!products || products.length === 0) {
    try {
      updateProgressUI(70);
      const localRes = await fetch('data/productos.json');
      if (localRes.ok) {
        products = await localRes.json();
      }
    } catch (e) {
      console.error('Error cargando almacén local:', e);
    }
  }

  updateProgressUI(100);
  window.probaktronicCatalogCache = products;

  setTimeout(() => {
    if (loaderContainer) loaderContainer.style.display = 'none';
    if (container) {
      container.classList.remove('d-none');
      renderSqlProducts(products, container);
    }
  }, 200);
};

function renderSqlProducts(products, container) {
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="w-100 text-center py-5" style="grid-column: 1 / -1;">
        <i class="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
        <h5 class="fw-bold font-rajdhani">0 Productos Encontrados</h5>
        <p class="text-muted small">No se encontraron registros de componentes en el catálogo.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  products.forEach(item => {
    const code = item.Codigo || item.Nombre || `Item #${item.ProductoID}`;
    const imgUrl = item.RutaLocal || item.ImagenUrl || '';
    const precio = item.Precio && parseFloat(item.Precio) > 0 ? `$${parseFloat(item.Precio).toFixed(2)}` : '';

    const waMsg = encodeURIComponent(`Hola Probaktronic, deseo consultar disponibilidad y precio del integrado/componente código: ${code}`);

    const cardHtml = `
      <div class="product-card" onclick="window.open('https://wa.me/51910697674?text=${waMsg}', '_blank')">
        <div class="product-img-container">
          ${imgUrl ? `
            <img src="${imgUrl}" alt="${code}" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'bi bi-cpu fs-1 text-muted\\'></i>';">
          ` : `
            <i class="bi bi-cpu fs-1 text-muted"></i>
          `}
        </div>
        <div class="product-code">${code}</div>
        ${precio ? `<div class="text-danger fw-bold small text-center mt-1">${precio}</div>` : `<div class="text-muted small text-center mt-1" style="font-size:0.75rem;"><i class="bi bi-whatsapp text-success me-1"></i>Consultar</div>`}
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHtml);
  });
}

function setupCatalogSearch() {
  const input = document.getElementById('catalogSearchInput');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('#productGridContainer .product-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// ==========================================================================
// CARGA Y GESTIÓN DE COMPUTADORAS AUTOMOTRICES (ECUs)
// ==========================================================================
window.fetchEcuProducts = async function() {
  const container = document.getElementById('ecuGridContainer');
  if (!container) return;

  if (window.probaktronicEcuCache && window.probaktronicEcuCache.length > 0) {
    renderEcuProducts(window.probaktronicEcuCache, container);
    return;
  }

  container.innerHTML = `
    <div class="w-100 text-center py-5" style="grid-column: 1 / -1;">
      <div class="spinner-border text-danger mb-3" role="status"></div>
      <h5 class="fw-bold font-rajdhani">Cargando Computadoras Automotrices...</h5>
    </div>
  `;

  let ecus = [];
  try {
    const res = await fetch('data/ecus.json');
    if (res.ok) {
      ecus = await res.json();
    }
  } catch (e) {
    console.error('Error cargando data/ecus.json:', e);
  }

  // Si no se pudo cargar el json, proveer respaldo por defecto
  if (!ecus || ecus.length === 0) {
    ecus = [
      {
        id: "ecu-hilux-2kd",
        marca: "Toyota",
        modelo: "Hilux 2.5L / 3.0L D-4D",
        anio: "2011 - 2015",
        motor: "2KD-FTV / 1KD-FTV",
        codigoEcu: "89661-0KP20 / Denso",
        tipo: "ECU Motor Diésel",
        estado: "Probada en Banco / Lista para Instalar",
        garantia: "6 Meses de Garantía",
        descripcion: "Computadora de motor Denso original para Toyota Hilux Turbo Diésel. Totalmente testeada en banco de pruebas.",
        imagen: "archivos_almacenamiento/diagramas_PRUEBAS/TOYOTA/hilux/2011-2015/ecu/imagen/ecu_frontal.jpg"
      },
      {
        id: "ecu-tiida-hr15",
        marca: "Nissan",
        modelo: "Tiida / Tiida Latio 1.5L / 1.6L",
        anio: "2007 - 2014",
        motor: "HR15DE / HR16DE",
        codigoEcu: "MEC90-010 / Hitachi",
        tipo: "ECU Motor Gasolina",
        estado: "Probada en Banco / Plug & Play",
        garantia: "6 Meses de Garantía",
        descripcion: "Computadora electrónica de motor Nissan Tiida. Verificada en osciloscopio y probador de banco.",
        imagen: "archivos_almacenamiento/diagramas_PRUEBAS/NISSAN/tiida_tiida_latio/hr15/ecu/fotos ecu/placa_base.png"
      },
      {
        id: "ecu-corolla-4e",
        marca: "Toyota",
        modelo: "Corolla 1.3L / 1.6L",
        anio: "1998 - 2004",
        motor: "4E-FE / 5E-FE",
        codigoEcu: "89661-1E160 / Denso",
        tipo: "ECU Motor Gasolina",
        estado: "Seminueva / 100% Operativa",
        garantia: "6 Meses de Garantía",
        descripcion: "Módulo de control de motor Denso para Toyota Corolla 4E. Revisada a nivel componentes y probada.",
        imagen: "archivos_almacenamiento/diagramas_PRUEBAS/TOYOTA/corolla/motor_4e/ecu/imagen/ecu_frontal.jpg"
      },
      {
        id: "ecu-accent-g4fa",
        marca: "Hyundai",
        modelo: "Accent 1.4L / 1.6L",
        anio: "2012 - 2018",
        motor: "G4FA / G4FC",
        codigoEcu: "ME17.9.11 / Bosch Kefico",
        tipo: "ECU Motor Gasolina",
        estado: "Inmo OFF / Lista para Programar",
        garantia: "6 Meses de Garantía",
        descripcion: "Computadora Bosch ME17.9.11 para Hyundai Accent. Opción desinmovilizada (Inmo OFF) o virgen.",
        imagen: "ecu_demo_2kd.png"
      },
      {
        id: "ecu-sail-lc4",
        marca: "Chevrolet",
        modelo: "Sail 1.4L / 1.5L",
        anio: "2010 - 2017",
        motor: "LC4 / L2B",
        codigoEcu: "Delphi MT22.1",
        tipo: "ECU Motor Gasolina",
        estado: "Probada en Banco / 100% OK",
        garantia: "6 Meses de Garantía",
        descripcion: "Unidad de control electrónico Delphi MT22.1 para Chevrolet Sail. Probada en todas sus etapas de inyección.",
        imagen: "ecu_demo_2kd.png"
      },
      {
        id: "ecu-kia-rio",
        marca: "Kia",
        modelo: "Rio 1.4L / 1.6L",
        anio: "2012 - 2017",
        motor: "G4FA / G4FD",
        codigoEcu: "Kefico MEG17.9.12 / Bosch",
        tipo: "ECU Motor Gasolina",
        estado: "Probada en Banco",
        garantia: "6 Meses de Garantía",
        descripcion: "Computadora de inyección electrónica Kefico / Bosch para Kia Rio. Diagnóstico verificado al 100%.",
        imagen: "ecu_demo_2kd.png"
      }
    ];
  }

  window.probaktronicEcuCache = ecus;
  renderEcuProducts(ecus, container);
};

function renderEcuProducts(ecus, container) {
  if (!container) return;

  if (!ecus || ecus.length === 0) {
    container.innerHTML = `
      <div class="w-100 text-center py-5" style="grid-column: 1 / -1;">
        <i class="bi bi-motherboard fs-1 text-muted d-block mb-2"></i>
        <h5 class="fw-bold font-rajdhani">0 Computadoras Encontradas</h5>
        <p class="text-muted small">No se encontraron ECUs con los filtros seleccionados.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  ecus.forEach(ecu => {
    const waText = encodeURIComponent(`Hola Probaktronic, deseo cotizar la Computadora Automotriz (ECU): ${ecu.marca} ${ecu.modelo} | Motor: ${ecu.motor} | Código: ${ecu.codigoEcu}`);
    const waUrl = `https://wa.me/51910697674?text=${waText}`;

    const cardHtml = `
      <div class="ecu-card" data-brand="${ecu.marca.toLowerCase()}" data-text="${(ecu.marca + ' ' + ecu.modelo + ' ' + ecu.motor + ' ' + ecu.codigoEcu).toLowerCase()}">
        <div class="ecu-card-img-box">
          <span class="ecu-brand-badge">${ecu.marca}</span>
          <img src="${ecu.imagen || 'ecu_demo_2kd.png'}" alt="${ecu.modelo}" loading="lazy" onerror="this.onerror=null; this.src='ecu_demo_2kd.png';">
        </div>

        <h3 class="ecu-card-title">${ecu.marca} ${ecu.modelo}</h3>
        <div class="ecu-card-code"><i class="bi bi-qr-code me-1"></i>${ecu.codigoEcu}</div>

        <div class="ecu-card-specs">
          <span class="ecu-spec-chip"><i class="bi bi-gear-fill me-1 text-danger"></i>${ecu.motor}</span>
          <span class="ecu-spec-chip"><i class="bi bi-calendar3 me-1 text-primary"></i>${ecu.anio}</span>
          <span class="ecu-spec-chip"><i class="bi bi-shield-check me-1 text-success"></i>${ecu.garantia || 'Garantía 6 Meses'}</span>
        </div>

        <p class="ecu-card-desc">${ecu.descripcion}</p>

        <div class="ecu-card-action">
          <div class="d-flex flex-column">
            <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small rounded-2">
              <i class="bi bi-check-circle-fill me-1"></i>${ecu.estado || 'Probada en Banco'}
            </span>
          </div>
          <a href="${waUrl}" target="_blank" class="btn-ecu-quote">
            <i class="bi bi-whatsapp"></i> Cotizar
          </a>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHtml);
  });
}

function setupEcuSearch() {
  const input = document.getElementById('ecuSearchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    applyEcuFilters();
  });
}

window.filterEcusByBrand = function(brand, btn) {
  window.currentEcuBrandFilter = brand.toLowerCase();

  const filterBtns = document.querySelectorAll('#ecuBrandFilters button');
  filterBtns.forEach(b => {
    b.className = 'btn btn-sm btn-outline-secondary rounded-pill px-3';
  });

  if (btn) {
    btn.className = 'btn btn-sm btn-dark rounded-pill px-3 active-filter';
  }

  applyEcuFilters();
};

function applyEcuFilters() {
  const searchInput = document.getElementById('ecuSearchInput');
  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const brand = window.currentEcuBrandFilter || 'all';

  const cards = document.querySelectorAll('#ecuGridContainer .ecu-card');
  let visibleCount = 0;

  cards.forEach(card => {
    const cardBrand = card.getAttribute('data-brand') || '';
    const cardText = card.getAttribute('data-text') || '';

    const matchesBrand = (brand === 'all' || cardBrand === brand);
    const matchesQuery = (!q || cardText.includes(q));

    if (matchesBrand && matchesQuery) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
}
