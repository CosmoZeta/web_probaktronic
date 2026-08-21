// Firebase Firestore Direct Connection for Probaktronic - With In-Memory Caching & SPA Support
console.log('--- Probaktronic Firebase Firestore Loaded ---');

const firebaseConfig = {
  apiKey: "AIzaSyC8IUDukbyc5NlQPFUn9ZDYOiR4GeeHRYY",
  authDomain: "probaktronic-app.firebaseapp.com",
  projectId: "probaktronic-app",
  storageBucket: "probaktronic-app.firebasestorage.app",
  messagingSenderId: "373953615206",
  appId: "1:373953615206:android:6ccca21cefcb6100ee4a7"
};

// Global memory cache for instant 0-second re-display
window.probaktronicCatalogCache = null;

// Initialize Firebase safely
function initFirebaseApp() {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
}
initFirebaseApp();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('catalogLoaderContainer')) {
    fetchFirestoreProducts();
  }
});

function updateProgressUI(val) {
  const progressBar = document.getElementById('catalogProgressBar');
  const progressPercent = document.getElementById('catalogProgressPercent');
  if (progressBar) progressBar.style.width = `${val}%`;
  if (progressPercent) progressPercent.textContent = `${val}%`;
}

// Exported to window so SPA navigator can trigger it anytime
window.fetchFirestoreProducts = function() {
  const container = document.getElementById('productGridContainer');
  const loaderContainer = document.getElementById('catalogLoaderContainer');

  if (!container || !loaderContainer) return;

  initFirebaseApp();

  // If already in memory cache, display instantly (0ms) without showing loader
  if (window.probaktronicCatalogCache && window.probaktronicCatalogCache.length > 0) {
    updateProgressUI(100);
    loaderContainer.style.display = 'none';
    container.classList.remove('d-none');
    renderFirestoreProducts(window.probaktronicCatalogCache, container);
    return;
  }

  // Otherwise, start loading animation
  loaderContainer.style.display = 'flex';
  container.classList.add('d-none');
  updateProgressUI(20);

  if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
    console.warn('Firestore SDK not loaded yet.');
    updateProgressUI(100);
    setTimeout(() => {
      loaderContainer.style.display = 'none';
      container.classList.remove('d-none');
    }, 400);
    return;
  }

  const db = firebase.firestore();
  const targetCollections = ['tienda', 'productos'];
  let allProducts = [];
  let collectionsChecked = 0;

  targetCollections.forEach((colName) => {
    db.collection(colName).get()
      .then(snapshot => {
        collectionsChecked++;
        updateProgressUI(30 + (collectionsChecked * 35));

        if (!snapshot.empty) {
          snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
          });
        }

        if (collectionsChecked === targetCollections.length) {
          window.probaktronicCatalogCache = allProducts;
          finishLoading(allProducts, loaderContainer, container);
        }
      })
      .catch(err => {
        console.error(`Error querying [${colName}]:`, err);
        collectionsChecked++;
        if (collectionsChecked === targetCollections.length) {
          finishLoading(allProducts, loaderContainer, container);
        }
      });
  });
};

function finishLoading(products, loader, container) {
  updateProgressUI(100);

  setTimeout(() => {
    if (loader) loader.style.display = 'none';
    if (container) {
      container.classList.remove('d-none');
      renderFirestoreProducts(products, container);
    }
  }, 250);
}

function renderFirestoreProducts(products, container) {
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="w-100 text-center py-5" style="grid-column: 1 / -1;">
        <i class="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
        <h5 class="fw-bold font-rajdhani">0 Productos Encontrados</h5>
        <p class="text-muted small">No se encontraron documentos en las colecciones de Firestore.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = ''; // Clear container

  products.forEach(item => {
    const code = item.nombre || item.codigo || item.name || item.code || item.titulo || item.id || 'Componente';
    const imgUrl = item.imagen || item.imageUrl || item.foto || item.url || item.image || item.img || item.photo || '';

    const cardHtml = `
      <div class="product-card" onclick="showGlobalToast('Componente seleccionado: ${code}')">
        <div class="product-img-container">
          ${imgUrl ? `
            <img src="${imgUrl}" alt="${code}" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'bi bi-cpu fs-1 text-muted\\'></i>';">
          ` : `
            <i class="bi bi-cpu fs-1 text-muted"></i>
          `}
        </div>
        <div class="product-code">${code}</div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHtml);
  });
}
