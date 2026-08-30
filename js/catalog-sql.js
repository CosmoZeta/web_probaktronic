// Probaktronic - Catálogo de Componentes conectado a Base de Datos SQL / Local
console.log('--- Probaktronic SQL Catalog Loaded ---');

window.probaktronicCatalogCache = null;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('catalogLoaderContainer')) {
    fetchSqlProducts();
  }
  setupCatalogSearch();
});

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

  // 2. Si Live Server no ejecuta PHP, cargar desde data/productos.json
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
  }, 250);
};

function renderSqlProducts(products, container) {
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="w-100 text-center py-5" style="grid-column: 1 / -1;">
        <i class="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
        <h5 class="fw-bold font-rajdhani">0 Productos Encontrados</h5>
        <p class="text-muted small">No se encontraron registros en el catálogo.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  products.forEach(item => {
    const code = item.Codigo || item.Nombre || `Item #${item.ProductoID}`;
    const imgUrl = item.RutaLocal || item.ImagenUrl || '';
    const precio = item.Precio && parseFloat(item.Precio) > 0 ? `$${parseFloat(item.Precio).toFixed(2)}` : '';

    const cardHtml = `
      <div class="product-card" onclick="if(typeof showGlobalToast === 'function') showGlobalToast('Componente: ${code}')">
        <div class="product-img-container">
          ${imgUrl ? `
            <img src="${imgUrl}" alt="${code}" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'bi bi-cpu fs-1 text-muted\\'></i>';">
          ` : `
            <i class="bi bi-cpu fs-1 text-muted"></i>
          `}
        </div>
        <div class="product-code">${code}</div>
        ${precio ? `<div class="text-danger fw-bold small text-center mt-1">${precio}</div>` : ''}
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
    const cards = document.querySelectorAll('.product-card');
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
