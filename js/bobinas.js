// Bobinas & Vehicle Brand Selector Controller for Probaktronic
// Conexión Robusta con Cloud Firestore y Firebase Storage con Protección Anti-Descarga

const localBrandLogoMap = {
  'citroen': 'imagenes svg/ico_logo_citroen.svg',
  'dacia': 'imagenes svg/ico_logo_dacia.svg',
  'daihatsu': 'imagenes svg/ico_logo_daihatsu.svg',
  'fiat': 'imagenes svg/ico_logo_fiat.svg',
  'ford': 'imagenes svg/ico_logo_ford.svg',
  'gmc': 'imagenes svg/ico_logo_gmc.svg',
  'honda': 'imagenes svg/ico_logo_honda.svg',
  'hummer': 'imagenes svg/ico_logo_hummer.svg',
  'hyundai': 'imagenes svg/ico_logo_hyundai.svg',
  'infiniti': 'imagenes svg/ico_logo_infiniti.svg',
  'isuzu': 'imagenes svg/ico_logo_isuzu.svg',
  'kia': 'imagenes svg/ico_logo_kia.svg',
  'lada': 'imagenes svg/ico_logo_lada.svg',
  'lancia': 'imagenes svg/ico_logo_lancia.svg',
  'lotus': 'imagenes svg/ico_logo_lotus.svg',
  'mahindra': 'imagenes svg/ico_logo_mahindra.svg',
  'maruti': 'imagenes svg/ico_logo_maruti.svg',
  'mazda': 'imagenes svg/ico_logo_mazda.svg',
  'mercedes': 'imagenes svg/ico_logo_mercedes_benz.svg',
  'mercedes-benz': 'imagenes svg/ico_logo_mercedes_benz.svg',
  'mercedes_benz': 'imagenes svg/ico_logo_mercedes_benz.svg',
  'mini': 'imagenes svg/ico_logo_mini.svg',
  'mitsubishi': 'imagenes svg/ico_logo_mitsubishi.svg',
  'opel': 'imagenes svg/ico_logo_opel.svg',
  'peugeot': 'imagenes svg/ico_logo_peugeot.svg',
  'pontiac': 'imagenes svg/ico_logo_pontiac.svg',
  'porsche': 'imagenes svg/ico_logo_porsche.svg',
  'renault': 'imagenes svg/ico_logo_renault.svg',
  'seat': 'imagenes svg/ico_logo_seat.svg',
  'skoda': 'imagenes svg/ico_logo_skoda.svg',
  'subaru': 'imagenes svg/ico_logo_subaru.svg',
  'suzuki': 'imagenes svg/ico_logo_suzuki.svg',
  'toyota': 'imagenes svg/ico_logo_toyota.svg',
  'volkswagen': 'imagenes svg/ico_logo_volkswagen.svg',
  'vw': 'imagenes svg/ico_logo_volkswagen.svg',
  'wuling': 'imagenes svg/ico_logo_wuling.png',
  'zotye': 'imagenes svg/ico_logo_zotye.svg'
};

let currentSelectedBrandId = null;
let currentSelectedBrandName = null;
window.currentModelsDataStore = {};

document.addEventListener('DOMContentLoaded', () => {
  initBobinasModule();
});

function initBobinasModule() {
  const searchInput = document.getElementById('brandSearchInput');
  const alphabetLetters = document.querySelectorAll('.alphabet-letter');
  const brandGrid = document.getElementById('bobinasBrandGrid');
  const tabs = document.querySelectorAll('.section-tab-item');

  if (!brandGrid) return;

  // Search input filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const cards = brandGrid.querySelectorAll('.brand-card');

      cards.forEach(card => {
        const brand = (card.getAttribute('data-brand') || card.textContent).toLowerCase();
        card.style.display = brand.includes(query) ? 'flex' : 'none';
      });
    });
  }

  // Alphabetical Index Filter
  alphabetLetters.forEach(letterEl => {
    letterEl.addEventListener('click', () => {
      alphabetLetters.forEach(l => l.classList.remove('active'));
      letterEl.classList.add('active');

      const selectedLetter = letterEl.getAttribute('data-letter');
      const cards = brandGrid.querySelectorAll('.brand-card');

      cards.forEach(card => {
        const brand = (card.getAttribute('data-brand') || card.textContent).trim();
        if (selectedLetter === 'all') {
          card.style.display = 'flex';
        } else {
          card.style.display = brand.toUpperCase().startsWith(selectedLetter) ? 'flex' : 'none';
        }
      });
    });
  });

  // Tab switcher
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Query Firestore collection 'bobinas'
  loadFirestoreBobinas(brandGrid);
}

function getBrandLogoUrl(brandKey) {
  const clean = brandKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const key of Object.keys(localBrandLogoMap)) {
    if (clean.includes(key.replace(/[^a-z0-9]/g, '')) || key.replace(/[^a-z0-9]/g, '').includes(clean)) {
      return localBrandLogoMap[key];
    }
  }
  return 'logo_probaktronic_solo.png';
}

function loadFirestoreBobinas(grid) {
  if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function' || !grid) return;

  const db = firebase.firestore();
  console.log('Querying Firestore collection [bobinas]...');

  db.collection('bobinas').get()
    .then(snapshot => {
      if (!snapshot.empty) {
        console.log(`Loaded ${snapshot.size} brand documents from Firestore [bobinas]`);
        grid.innerHTML = ''; // Clear spinner

        snapshot.forEach(doc => {
          const docId = doc.id;
          const data = doc.data() || {};
          const brandName = (data.nombre || data.marca || docId).trim();
          const displayName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
          const logoSrc = data.logo || data.imagen || getBrandLogoUrl(docId);

          const card = document.createElement('div');
          card.className = 'brand-card';
          card.setAttribute('data-brand', displayName);
          card.setAttribute('data-doc-id', docId);
          card.innerHTML = `
            <img src="${logoSrc}" alt="${displayName}" class="brand-logo-img" onerror="this.src='logo_probaktronic_solo.png'">
            <h4 class="brand-name-title">${displayName}</h4>
          `;
          card.onclick = () => openBrandModels(docId, displayName, logoSrc);

          grid.appendChild(card);
        });
      } else {
        grid.innerHTML = `
          <div class="w-100 text-center py-4" style="grid-column: 1 / -1;">
            <p class="text-muted">No se encontraron marcas en la colección bobinas.</p>
          </div>
        `;
      }
    })
    .catch(err => {
      console.error('Error querying bobinas:', err);
    });
}

// Open Models for Selected Brand
window.openBrandModels = function(brandDocId, brandName, logoSrc) {
  currentSelectedBrandId = brandDocId;
  currentSelectedBrandName = brandName;
  window.currentModelsDataStore = {};

  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');
  const modelsListGrid = document.getElementById('modelsListGrid');
  const brandLogo = document.getElementById('selectedBrandLogo');
  const brandTitle = document.getElementById('selectedBrandTitle');

  if (brandsView) brandsView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');
  if (modelsView) modelsView.classList.remove('d-none');

  if (brandLogo) brandLogo.src = logoSrc || 'logo_probaktronic_solo.png';
  if (brandTitle) brandTitle.textContent = `${brandName} - Modelos de Bobinas`;

  if (modelsListGrid) {
    modelsListGrid.innerHTML = `
      <div class="w-100 text-center py-4" style="grid-column: 1 / -1;">
        <div class="spinner-border text-danger" role="status"></div>
        <p class="text-muted small mt-2">Cargando modelos de ${brandName} desde Firestore...</p>
      </div>
    `;

    const db = firebase.firestore();
    db.collection('bobinas').doc(brandDocId).collection('modelos').get()
      .then(snapshot => {
        if (!snapshot.empty) {
          modelsListGrid.innerHTML = '';
          
          snapshot.forEach(doc => {
            const data = doc.data() || {};
            const docId = doc.id;
            
            window.currentModelsDataStore[docId] = data;

            const modelName = data.modelo || docId;
            const motor = data.motor || 'Estándar';

            console.log(`[Firestore Model] ${docId}:`, data);

            const card = document.createElement('div');
            card.className = 'model-item-card';
            card.innerHTML = `
              <div>
                <span class="badge bg-danger mb-2">Bobina COP / DIS</span>
                <h5 class="fw-bold fs-6 mb-1 text-dark">${docId}</h5>
                <p class="text-muted small mb-2">${modelName}</p>
              </div>
              <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                <span class="small text-muted">Motor / Parte: <strong>${motor}</strong></span>
                <i class="bi bi-chevron-right text-danger"></i>
              </div>
            `;

            card.onclick = () => openDiagramViewer(docId);
            modelsListGrid.appendChild(card);
          });
        } else {
          modelsListGrid.innerHTML = `
            <div class="w-100 text-center py-4" style="grid-column: 1 / -1;">
              <p class="text-muted">No se encontraron modelos para ${brandName}.</p>
            </div>
          `;
        }
      })
      .catch(err => {
        console.error('Error querying subcollection modelos:', err);
      });
  }
};

// Open Diagram Viewer for Selected Model (Protected View)
window.openDiagramViewer = async function(docId) {
  const data = window.currentModelsDataStore[docId] || {};
  console.log(`Displaying diagram for [${docId}]:`, data);

  const modelsView = document.getElementById('modelsViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (modelsView) modelsView.classList.add('d-none');
  if (diagramView) diagramView.classList.remove('d-none');

  const titleEl = document.getElementById('diagramModelTitle');
  const motorEl = document.getElementById('diagramMotorCode');
  const imgContainer = document.getElementById('diagramImgContainer');

  const modelTitle = data.modelo || docId;
  const motorCode = data.motor || 'N/A';

  if (titleEl) titleEl.textContent = `${currentSelectedBrandName} - ${modelTitle}`;
  if (motorEl) motorEl.textContent = `Código de Motor / Parte: ${motorCode}`;

  if (!imgContainer) return;

  // Show loading indicator
  imgContainer.innerHTML = `
    <div class="py-4 text-center text-white">
      <div class="spinner-border text-danger" role="status"></div>
      <div class="small text-muted mt-2">Cargando esquema de conexión...</div>
    </div>
  `;

  // Find image URL or path in document fields
  let rawUrl = '';
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (typeof val === 'string' && (val.includes('firebasestorage') || val.includes('http') || val.includes('.png') || val.includes('.jpg') || val.includes('gs://'))) {
      rawUrl = val.trim();
      break;
    }
  }

  if (!rawUrl && (data.imageUrl || data.image || data.imagen || data.url)) {
    rawUrl = (data.imageUrl || data.image || data.imagen || data.url).trim();
  }

  if (!rawUrl) {
    imgContainer.innerHTML = `
      <div class="p-4 text-center text-muted">
        <i class="bi bi-image fs-1 d-block mb-2"></i>
        <p>No se encontró un esquema disponible para <code>${docId}</code>.</p>
      </div>
    `;
    return;
  }

  // Resolve storage path or gs:// URL if needed
  let finalImageUrl = rawUrl;
  if (rawUrl.startsWith('gs://') || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))) {
    try {
      if (typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
        const storage = firebase.storage();
        const ref = rawUrl.startsWith('gs://') ? storage.refFromURL(rawUrl) : storage.ref(rawUrl);
        finalImageUrl = await ref.getDownloadURL();
      }
    } catch (err) {
      console.warn('Firebase Storage ref error:', err.message);
    }
  }

  // Render Image directly with Protection (No contextmenu, no drag, no button)
  imgContainer.innerHTML = `
    <div class="protected-image-wrapper position-relative text-center w-100" oncontextmenu="return false;" ondragstart="return false;">
      <img src="${finalImageUrl}" alt="${modelTitle}" class="diagram-viewer-modal-img unselectable-image" referrerpolicy="no-referrer"
           oncontextmenu="return false;" ondragstart="return false;" draggable="false">
      <!-- Transparent security shield overlay -->
      <div class="security-shield-overlay" oncontextmenu="return false;" ondragstart="return false;"></div>
    </div>
  `;
};

window.showBrandsView = function() {
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.remove('d-none');
  if (modelsView) modelsView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');
};

window.showModelsView = function() {
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.add('d-none');
  if (modelsView) modelsView.classList.remove('d-none');
  if (diagramView) diagramView.classList.add('d-none');
};
