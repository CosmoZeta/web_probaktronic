// Vehiculos & Diagramas Controller for Probaktronic
// Conexión con Cloud Firestore (colección 'diagramas' / 'bobinas') y Firebase Storage

const localBrandLogoMap = {
  'audi': 'imagenes svg/ico_logo_audi.svg',
  'bmw': 'imagenes svg/ico_logo_bmw.svg',
  'byd': 'imagenes svg/ico_logo_byd.svg',
  'chevrolet': 'imagenes svg/ico_logo_chevrolet.png',
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

const localCarPhotoMap = {
  // Audi
  'audi a3': 'imagenes autos/ic_car_audia3.JPG',
  'audi.a3': 'imagenes autos/ic_car_audia3.JPG',
  'a3': 'imagenes autos/ic_car_audia3.JPG',
  'audi a4': 'imagenes autos/ic_car_audi_a4.JPG',
  'audi.a4': 'imagenes autos/ic_car_audi_a4.JPG',
  'a4': 'imagenes autos/ic_car_audi_a4.JPG',
  'audi q7': 'imagenes autos/ic_car_audi_q7.JPG',
  'q7': 'imagenes autos/ic_car_audi_q7.JPG',
  'audi tt': 'imagenes autos/ic_car_audi_tt.JPG',
  'tt': 'imagenes autos/ic_car_audi_tt.JPG',
  'tiguan': 'imagenes autos/ic_car_audi_tiguan.JPG',
  
  // BMW
  'bmw 118': 'imagenes autos/ic_car_bmw_118_2007.JPG',
  '118': 'imagenes autos/ic_car_bmw_118_2007.JPG',
  '118i': 'imagenes autos/ic_car_bmw_118_2007.JPG',
  
  // Chevrolet
  'captiva': 'imagenes autos/ic_car_chevrolet_captiva_2011.JPG',
  'chevy': 'imagenes autos/ic_car_chevrolet_chevy.JPG',
  'colorado': 'imagenes autos/ic_car_chevrolet_colorado_2006.JPG',
  'sail': 'imagenes autos/ic_car_chevrolet_sail_2010.JPG',
  'trailblazer': 'imagenes autos/ic_car_chevrolet_trailblazer_2002.JPG',
  
  // Citroen
  'berlingo': 'imagenes autos/ic_car_Citroen_Berlingo_2015.JPG',
  'c3 aircross': 'imagenes autos/ic_car_citroen_c3_aircross.JPG',
  'c3 mk3': 'imagenes autos/ic_car_Citroen_Citroen_C3_mk3.JPG',
  'c3': 'imagenes autos/ic_car_Citroen_Citroen_C3_tercera_generacion.JPG',
  'cactus': 'imagenes autos/ic_car_citroen_cactus.JPG',
  'picasso': 'imagenes autos/ic_car_citroen_picasso.JPG',
  'saxo': 'imagenes autos/ic_car_citroen_saxo.JPG',
  'xsara': 'imagenes autos/ic_car_citroen_xsara.JPG',
  
  // Dacia
  'duster': 'imagenes autos/ic_car_dacia_duster.JPG',
  'lodgy': 'imagenes autos/ic_car_dacia_lodgy.JPG',
  
  // Daihatsu
  'copen': 'imagenes autos/ic_car_daihatsu_copen.JPG',
  'materia': 'imagenes autos/ic_car_daihatsu_materia.JPG',
  'sirion': 'imagenes autos/ic_car_daihatsu_sirion.JPG',
  'terios': 'imagenes autos/ic_car_daihatsu_terios.JPG',
  
  // Fiat
  'brava': 'imagenes autos/ic_car_fiat_brava.JPG',
  'coupe': 'imagenes autos/ic_car_fiat_coupe.JPG',
  'doblo': 'imagenes autos/ic_car_fiat_doblo.JPG',
  'marea': 'imagenes autos/ic_car_fiat_marea.JPG'
};

function getVehicleCarPhotoUrl(brandName, modelName, docId) {
  const query = (brandName + ' ' + modelName + ' ' + docId).toLowerCase();
  for (const key of Object.keys(localCarPhotoMap)) {
    if (query.includes(key)) {
      return localCarPhotoMap[key];
    }
  }
  return null;
}

function getBrandLogoUrl(brandKey) {
  const clean = brandKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const key of Object.keys(localBrandLogoMap)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean === cleanKey || clean.includes(cleanKey) || cleanKey.includes(clean)) {
      return localBrandLogoMap[key];
    }
  }
  return 'logo_probaktronic_solo.png';
}

let currentSelectedBrandId = null;
let currentSelectedBrandName = null;
window.currentModelsDataStore = {};

function initVehiculosDiagramasModule() {
  const searchInput = document.getElementById('brandSearchInput');
  const alphabetLetters = document.querySelectorAll('.alphabet-letter');
  const brandGrid = document.getElementById('vehiculosBrandGrid');
  const tabs = document.querySelectorAll('.section-tab-item');
  const btnBackView = document.getElementById('btnBackView');

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

  // Smart Top-Left Back Button Handler (Hierarchical Step-by-Step Navigation)
  if (btnBackView) {
    btnBackView.onclick = (e) => {
      const brandsView = document.getElementById('brandsViewContainer');
      const modelsView = document.getElementById('modelsViewContainer');
      const ecuView = document.getElementById('ecuInfoViewContainer');
      const diagramView = document.getElementById('diagramViewContainer');

      if (diagramView && !diagramView.classList.contains('d-none')) {
        e.preventDefault();
        showEcuInfoView(); // Level 4 -> Level 3
        return;
      }

      if (ecuView && !ecuView.classList.contains('d-none')) {
        e.preventDefault();
        showModelsView(); // Level 3 -> Level 2
        return;
      }

      if (modelsView && !modelsView.classList.contains('d-none')) {
        e.preventDefault();
        showBrandsView(); // Level 2 -> Level 1
        return;
      }
      // If at Level 1 (brandsView), default link to index.html takes effect!
    };
  }

  // Query Firestore collection 'diagramas' to render only active brands
  loadFirestoreDiagramasBrands(brandGrid);
}

window.initVehiculosDiagramasModule = initVehiculosDiagramasModule;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVehiculosDiagramasModule);
} else {
  initVehiculosDiagramasModule();
}

function ensureFirebaseInitialized() {
  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp({
          apiKey: "AIzaSyC8IUDukbyc5NlQPFUn9ZDYOiR4GeeHRYY",
          authDomain: "probaktronic-app.firebaseapp.com",
          projectId: "probaktronic-app",
          storageBucket: "probaktronic-app.firebasestorage.app",
          messagingSenderId: "373953615206",
          appId: "1:373953615206:android:6ccca21cefcb6100ee4a7"
        });
      }
    } catch (e) {
      console.warn('Firebase init:', e);
    }
  }
}

function ensureFirebaseSDKReady(callback) {
  if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
    ensureFirebaseInitialized();
    if (callback) callback();
    return;
  }

  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
      clearInterval(interval);
      ensureFirebaseInitialized();
      if (callback) callback();
      return;
    }
    if (attempts > 20) {
      clearInterval(interval);
      if (callback) callback();
    }
  }, 100);

  // Inject scripts if not present
  if (!document.querySelector('script[src*="firebase-app-compat"]')) {
    const s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    s1.onload = () => {
      if (!document.querySelector('script[src*="firebase-firestore-compat"]')) {
        const s2 = document.createElement('script');
        s2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js';
        document.head.appendChild(s2);
      }
    };
    document.head.appendChild(s1);
  }
}

function safeCreateCenteredLoader(container, text) {
  if (typeof window.createCenteredFirebaseLoader === 'function') {
    return window.createCenteredFirebaseLoader(container, text);
  }
  return { finish: (cb) => { if (cb) cb(); } };
}

const defaultDiagramBrands = [
  { id: 'hyundai', name: 'Hyundai', logo: getBrandLogoUrl('hyundai') },
  { id: 'toyota', name: 'Toyota', logo: getBrandLogoUrl('toyota') }
];

let cachedActiveBrands = defaultDiagramBrands;

function loadFirestoreDiagramasBrands(grid) {
  if (!grid) {
    grid = document.getElementById('vehiculosBrandGrid');
    if (!grid) return;
  }

  // Render registered brands immediately
  renderOnlyActiveBrands(grid, null, cachedActiveBrands || defaultDiagramBrands);

  ensureFirebaseSDKReady(() => {
    if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
      return;
    }

    const db = firebase.firestore();
    db.collection('diagramas').get()
      .then(snapshot => {
        if (!snapshot.empty) {
          const firestoreBrands = [];
          snapshot.forEach(doc => {
            const docId = doc.id.toLowerCase().trim();
            const data = doc.data() || {};
            const brandName = (data.nombre || data.marca || docId).trim();
            const displayName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
            const logoSrc = data.logo || data.imagen || getBrandLogoUrl(docId);
            firestoreBrands.push({
              id: docId,
              name: displayName,
              logo: logoSrc,
              data: data
            });
          });

          if (firestoreBrands.length > 0) {
            cachedActiveBrands = firestoreBrands;
            renderOnlyActiveBrands(grid, null, firestoreBrands);
          }
        }
      })
      .catch(err => {
        console.warn('Live Firestore diagrams fetch sync:', err);
      });
  });
}

function renderOnlyActiveBrands(grid, loader, brandList) {
  const doRender = () => {
    if (!grid) grid = document.getElementById('vehiculosBrandGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const list = (brandList && brandList.length > 0) ? brandList : defaultDiagramBrands;

    list.forEach(b => {
      const docId = b.id;
      const displayName = b.name;
      const logoSrc = b.logo || getBrandLogoUrl(docId);

      const card = document.createElement('div');
      card.className = 'brand-card position-relative';
      card.setAttribute('data-brand', displayName);
      card.setAttribute('data-doc-id', docId);

      card.innerHTML = `
        <img src="${logoSrc}" alt="${displayName}" class="brand-logo-img" style="max-height: 56px; max-width: 120px; width: auto; height: auto; object-fit: contain; margin-bottom: 12px; display: block;" onerror="this.src='logo_probaktronic_solo.png'">
        <h4 class="brand-name-title">${displayName}</h4>
      `;

      card.onclick = (e) => {
        if (e) e.stopPropagation();
        console.log(`Brand card clicked: [${docId}] - ${displayName}`);
        window.openBrandDiagramModels(docId, displayName, logoSrc, 'diagramas');
      };

      grid.appendChild(card);
    });
  };

  if (loader && typeof loader.finish === 'function') {
    loader.finish(doRender);
  } else {
    doRender();
  }
}

// Open Models for Selected Brand
window.openBrandDiagramModels = function(brandDocId, brandName, logoSrc, collectionName = 'diagramas') {
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
  if (brandTitle) brandTitle.textContent = `${brandName} - Diagramas de Vehículos`;

  if (modelsListGrid) {
    const loader = safeCreateCenteredLoader(modelsListGrid, `Conectando con Cloud Firestore para descargar diagramas de ${brandName}...`);

    if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
      renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader);
      return;
    }

    const db = firebase.firestore();
    db.collection(collectionName).doc(brandDocId).collection('modelos').get()
      .then(snapshot => {
        if (!snapshot.empty) {
          renderModelCardsFromSnapshot(snapshot, brandName, modelsListGrid, loader);
        } else {
          console.log(`Subcollection [diagramas/${brandDocId}/modelos] empty, trying [bobinas/${brandDocId}/modelos]...`);
          db.collection('bobinas').doc(brandDocId).collection('modelos').get().then(bobinasSnap => {
            if (!bobinasSnap.empty) {
              renderModelCardsFromSnapshot(bobinasSnap, brandName, modelsListGrid, loader);
            } else {
              renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader);
            }
          }).catch(() => renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader));
        }
      })
      .catch(err => {
        console.warn('Error querying modelos:', err);
        renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader);
      });
  }
};

function renderModelCardsFromSnapshot(snapshot, brandName, modelsListGrid, loader) {
  loader.finish(() => {
    modelsListGrid.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data() || {};
      const docId = doc.id;
      window.currentModelsDataStore[docId] = data;

      const modelName = data.modelo || data.nombre || docId;
      const motor = data.motor || 'Estándar';

      const carPhotoUrl = getVehicleCarPhotoUrl(brandName, modelName, docId);
      const carPhotoHtml = carPhotoUrl ? `
        <div class="model-car-photo-box mb-3 p-1 text-center bg-white rounded border" style="height: 110px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <img src="${carPhotoUrl}" alt="${modelName}" style="max-height: 100%; max-width: 100%; object-fit: contain; border-radius: 4px;">
        </div>
      ` : '';

      const card = document.createElement('div');
      card.className = 'model-item-card';
      card.innerHTML = `
        ${carPhotoHtml}
        <div>
          <span class="badge bg-danger mb-2">Diagrama Eléctrico / ECU</span>
          <h5 class="fw-bold fs-6 mb-1 text-dark">${docId}</h5>
          <p class="text-muted small mb-2">${modelName}</p>
        </div>
        <div class="d-flex justify-content-between align-items-center pt-2 border-top">
          <span class="small text-muted">Motor / Parte: <strong>${motor}</strong></span>
          <i class="bi bi-chevron-right text-danger"></i>
        </div>
      `;

      card.onclick = () => openModelEcuInfo(docId, modelName, motor);
      modelsListGrid.appendChild(card);
    });
  });
}

function renderFallbackModelsForBrand(brandDocId, brandName, modelsListGrid, loader) {
  const defaultModelsMap = {
    'hyundai': [{ id: 'accent', modelo: 'Hyundai Accent 2020', motor: '1.6 Gamma' }],
    'toyota': [{ id: 'hilux', modelo: 'TOYOTA HILUX 2011 - 2015', motor: '2KD-FTV (2011 - 2015)' }],
    'audi': [
      { id: 'Audi A3', modelo: 'Audi A3 (8P VR6 3.2L)', motor: '022905100B' },
      { id: 'Audi A4', modelo: 'Audi A4 2.0 TFSI', motor: '06H 905 115' },
      { id: 'Audi Q7', modelo: 'Audi Q7 3.0 TDI', motor: 'V6 Quattro' },
      { id: 'Audi TT', modelo: 'Audi TT Coupe 1.8T', motor: '06B 905 115' }
    ],
    'bmw': [{ id: 'BMW 118i', modelo: 'BMW 118i (E87 / F20)', motor: '12137575010' }],
    'chevrolet': [
      { id: 'Captiva', modelo: 'Chevrolet Captiva 2.4L', motor: '12638824' },
      { id: 'Sail', modelo: 'Chevrolet Sail 1.4L', motor: 'Módulo DIS 4-Salidas' }
    ],
    'citroen': [
      { id: 'Berlingo', modelo: 'Citroën Berlingo 1.6 VTi', motor: 'Regleta 4-Pines' },
      { id: 'Cactus', modelo: 'Citroën C4 Cactus', motor: 'PureTech 110' }
    ],
    'dacia': [{ id: 'Duster', modelo: 'Dacia Duster 1.6L / 2.0L', motor: 'Renault K4M' }],
    'daihatsu': [{ id: 'Terios', modelo: 'Daihatsu Terios 1.3L', motor: 'K3-VE / 3SZ-VE' }],
    'fiat': [{ id: 'Doblo', modelo: 'Fiat Doblò 1.4 Fire', motor: 'Fire 8V / 16V' }]
  };

  const list = defaultModelsMap[brandDocId.toLowerCase()] || [{ id: `${brandName} Model 1`, modelo: `${brandName} Estándar`, motor: 'ECU 1.6L' }];

  loader.finish(() => {
    modelsListGrid.innerHTML = '';
    list.forEach(m => {
      window.currentModelsDataStore[m.id] = m;
      const carPhotoUrl = getVehicleCarPhotoUrl(brandName, m.modelo, m.id);
      const carPhotoHtml = carPhotoUrl ? `
        <div class="model-car-photo-box mb-3 p-1 text-center bg-white rounded border" style="height: 110px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <img src="${carPhotoUrl}" alt="${m.modelo}" style="max-height: 100%; max-width: 100%; object-fit: contain; border-radius: 4px;">
        </div>
      ` : '';

      const card = document.createElement('div');
      card.className = 'model-item-card';
      card.innerHTML = `
        ${carPhotoHtml}
        <div>
          <span class="badge bg-danger mb-2">Diagrama Eléctrico / ECU</span>
          <h5 class="fw-bold fs-6 mb-1 text-dark">${m.id}</h5>
          <p class="text-muted small mb-2">${m.modelo}</p>
        </div>
        <div class="d-flex justify-content-between align-items-center pt-2 border-top">
          <span class="small text-muted">Motor / Parte: <strong>${m.motor}</strong></span>
          <i class="bi bi-chevron-right text-danger"></i>
        </div>
      `;

      card.onclick = () => openModelEcuInfo(m.id, m.modelo, m.motor);
      modelsListGrid.appendChild(card);
    });
  });
}

// Open Level 3: ECU Info & Connection Type Selector (Reference Design Flow)
window.openModelEcuInfo = async function(docId, modelName, motorCode) {
  const brandId = currentSelectedBrandId || 'toyota';
  const brandName = currentSelectedBrandName || 'TOYOTA';

  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (modelsView) modelsView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');
  if (ecuView) ecuView.classList.remove('d-none');

  // Populate Selected Vehicle Segmented Bar
  const logoEl = document.getElementById('selectedVehicleBrandLogo');
  const brandTextEl = document.getElementById('selectedVehicleBrandText');
  const modelTextEl = document.getElementById('selectedVehicleModelText');
  const specTextEl = document.getElementById('selectedVehicleSpecText');
  const ecuTitleEl = document.getElementById('ecuNameTitle');
  const ecuManufacturerEl = document.getElementById('ecuManufacturerLogo');
  const connectionListContainer = document.getElementById('connectionTypeListContainer');

  if (logoEl) logoEl.src = getBrandLogoUrl(brandId);
  if (brandTextEl) brandTextEl.textContent = brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase();
  if (modelTextEl) modelTextEl.textContent = modelName || docId;
  if (specTextEl) specTextEl.textContent = motorCode || '1.5L 109ps (1NZFE)';

  // Determine ECU part code and ECU manufacturer
  const cleanBrand = brandId.toLowerCase();
  let manufacturerName = 'DENSO';
  if (cleanBrand.includes('audi') || cleanBrand.includes('bmw') || cleanBrand.includes('volkswagen') || cleanBrand.includes('vw') || cleanBrand.includes('mercedes') || cleanBrand.includes('porsche') || cleanBrand.includes('seat') || cleanBrand.includes('skoda')) {
    manufacturerName = 'BOSCH';
  } else if (cleanBrand.includes('chevrolet') || cleanBrand.includes('gmc') || cleanBrand.includes('hyundai') || cleanBrand.includes('kia')) {
    manufacturerName = 'DELPHI';
  } else if (cleanBrand.includes('ford') || cleanBrand.includes('peugeot') || cleanBrand.includes('citroen') || cleanBrand.includes('renault')) {
    manufacturerName = 'CONTINENTAL';
  } else if (cleanBrand.includes('fiat') || cleanBrand.includes('lancia') || cleanBrand.includes('alfa')) {
    manufacturerName = 'MAGNETI MARELLI';
  } else if (cleanBrand.includes('toyota') || cleanBrand.includes('daihatsu') || cleanBrand.includes('subaru') || cleanBrand.includes('suzuki')) {
    manufacturerName = 'DENSO';
  }

  if (ecuManufacturerEl) ecuManufacturerEl.textContent = manufacturerName;
  if (ecuTitleEl) ecuTitleEl.textContent = (motorCode && motorCode !== 'Estándar') ? motorCode : '275036-1152';

  if (!connectionListContainer) return;

  const loader = safeCreateCenteredLoader(connectionListContainer, 'Cargando opciones de conexión desde Firebase...');

  // Query subcollection 'archivos' from Firestore
  let archivosList = [];
  try {
    const db = firebase.firestore();
    const aniosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').get();
    
    if (!aniosSnap.empty) {
      for (const anioDoc of aniosSnap.docs) {
        const motoresSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').doc(anioDoc.id).collection('motores').get();
        if (!motoresSnap.empty) {
          for (const motorDoc of motoresSnap.docs) {
            const archivosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').doc(anioDoc.id).collection('motores').doc(motorDoc.id).collection('archivos').get();
            if (!archivosSnap.empty) {
              archivosSnap.forEach(aDoc => {
                archivosList.push({ id: aDoc.id, ...aDoc.data() });
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error querying archivos subcollection:', e);
  }

  // Fallback connection modes (OBD, BOOT, BENCH, PEDAL, etc.) if none in Firestore
  if (archivosList.length === 0) {
    archivosList = [
      { id: 'OBD', titulo: 'OBD', tipo: 'DIAGRAMA OBD' },
      { id: 'BOOT', titulo: 'BOOT', tipo: 'CONEXIÓN BOOT' },
      { id: 'BENCH', titulo: 'BENCH', tipo: 'MODO BANCO' },
      { id: 'PEDAL', titulo: 'PEDAL', tipo: 'DOCUMENTO PDF' },
      { id: 'EDU 2 CONECTORES', titulo: 'EDU 2 CONECTORES', tipo: 'DOCUMENTO PDF' },
      { id: 'INMOVILIZADOR', titulo: 'INMOVILIZADOR', tipo: 'DOCUMENTO PDF' }
    ];
  }

  let selectedArchDoc = archivosList[0];

  loader.finish(() => {
    connectionListContainer.innerHTML = '';

    archivosList.forEach((arch, index) => {
      const isSelected = index === 0;
      const title = (arch.titulo || arch.nombre || arch.id).toUpperCase();

      let iconHtml = '<i class="bi bi-cpu fs-1"></i>';
      if (title.includes('OBD')) {
        iconHtml = '<i class="bi bi-hdd-network fs-1"></i>';
      } else if (title.includes('BOOT')) {
        iconHtml = '<i class="bi bi-cpu fs-1"></i>';
      } else if (title.includes('BENCH')) {
        iconHtml = '<i class="bi bi-motherboard fs-1"></i>';
      } else if (title.includes('PEDAL')) {
        iconHtml = '<i class="bi bi-speedometer2 fs-1"></i>';
      } else if (title.includes('EDU') || title.includes('CONECTOR')) {
        iconHtml = '<i class="bi bi-diagram-3 fs-1"></i>';
      } else if (title.includes('INMOVILIZADOR') || title.includes('LLAVE')) {
        iconHtml = '<i class="bi bi-key fs-1"></i>';
      } else if (title.includes('PDF') || title.includes('DOCUMENTO')) {
        iconHtml = '<i class="bi bi-file-earmark-pdf fs-1"></i>';
      }

      const card = document.createElement('div');
      card.className = `connection-type-card ${isSelected ? 'active' : ''}`;
      card.innerHTML = `
        <div class="card-corner-badge">
          <i class="bi ${isSelected ? 'bi-check-circle-fill' : 'bi-slash-circle'}"></i>
        </div>
        <div class="conn-icon">
          ${iconHtml}
        </div>
        <div class="conn-label">${title}</div>
      `;

      card.onclick = () => {
        connectionListContainer.querySelectorAll('.connection-type-card').forEach(c => {
          c.classList.remove('active');
          const badge = c.querySelector('.card-corner-badge i');
          if (badge) badge.className = 'bi bi-slash-circle';
        });

        card.classList.add('active');
        const badge = card.querySelector('.card-corner-badge i');
        if (badge) badge.className = 'bi bi-check-circle-fill';

        selectedArchDoc = arch;
      };

      connectionListContainer.appendChild(card);
    });
  });

  // Attach NEXT button handler
  const btnNext = document.getElementById('btnNextToDiagram');
  if (btnNext) {
    btnNext.onclick = () => {
      openDiagramViewer(docId, selectedArchDoc);
    };
  }
};

// Global Console Controls for Level 4 Diagnostic Viewer
let currentConsoleZoom = 1.0;
window._currentActiveDiagramData = {};

function extractDynamicComponentName(rawTitle) {
  if (!rawTitle) return { name: 'Componente', phrase: 'del Componente' };
  const clean = rawTitle.toUpperCase();
  if (clean.includes('PEDAL')) return { name: 'Pedal', phrase: 'del Pedal' };
  if (clean.includes('ECU') || clean.includes('COMPUTADORA')) return { name: 'la ECU', phrase: 'de la ECU' };
  if (clean.includes('ANTENA') || clean.includes('INMOVILIZADOR') || clean.includes('LLAVE')) return { name: 'la Antena / Inmovilizador', phrase: 'de la Antena / Inmovilizador' };
  if (clean.includes('EDU') || clean.includes('E.D.U')) {
    if (clean.includes('DOS') || clean.includes('2')) return { name: 'la EDU (2 Conectores)', phrase: 'de la EDU (2 Conectores)' };
    if (clean.includes('TRES') || clean.includes('3')) return { name: 'la EDU (3 Conectores)', phrase: 'de la EDU (3 Conectores)' };
    return { name: 'la EDU', phrase: 'de la EDU' };
  }
  if (clean.includes('OBD')) return { name: 'el Puerto OBD', phrase: 'del Puerto OBD' };
  if (clean.includes('BOOT')) return { name: 'el Modo Boot', phrase: 'del Modo Boot' };
  if (clean.includes('BENCH')) return { name: 'el Modo Banco', phrase: 'del Modo Banco' };
  if (clean.includes('BOBINA')) return { name: 'la Bobina', phrase: 'de la Bobina' };
  if (clean.includes('SENSOR') || clean.includes('ACTUADOR')) return { name: 'el Sensor', phrase: 'del Sensor / Actuador' };
  
  return { name: rawTitle, phrase: `de ${rawTitle}` };
}

let currentPdfDoc = null;
let currentPdfPageNum = 1;
let currentGalleryImages = [];
let currentGalleryIndex = 0;
let currentZoomLevels = [1.0, 1.75, 2.5];
let currentZoomLevelIndex = 0;

window.applyConsoleWatermark = function(isVertical = true) {
  const overlay = document.getElementById('consoleWatermarkOverlay');
  if (overlay) {
    overlay.style.backgroundImage = isVertical ? "url('ic_fondo_vertical.png')" : "url('ic_fondo_horizontal.png')";
  }
};

window.renderPdfPageOnCanvas = function(pageNum) {
  if (!currentPdfDoc) return;
  const canvas = document.getElementById('consolePdfCanvas');
  const wrap = document.getElementById('consoleImgViewerWrap');
  if (!canvas || !wrap) return;

  currentPdfDoc.getPage(pageNum).then(page => {
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const wrapWidth = wrap.clientWidth ? Math.min(wrap.clientWidth - 24, 1300) : 1100;
    const fitScale = wrapWidth / unscaledViewport.width;

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({ scale: fitScale * dpr });

    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Display scale in CSS to keep exact physical crispness and fill container
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '78vh';

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    page.render(renderContext).promise.then(() => {
      console.log(`PDF Page ${pageNum} rendered with Ultra-HD crispness.`);
      const pageInfo = document.getElementById('pdfPageInfo');
      if (pageInfo) {
        pageInfo.textContent = `Página ${pageNum} / ${currentPdfDoc.numPages}`;
      }
      const isVert = (viewport.height / viewport.width) > 1.15;
      window.applyConsoleWatermark(isVert);
    });
  });
};

window.changePdfPage = function(delta) {
  if (!currentPdfDoc) return;
  const newPage = currentPdfPageNum + delta;
  if (newPage >= 1 && newPage <= currentPdfDoc.numPages) {
    currentPdfPageNum = newPage;
    window.renderPdfPageOnCanvas(currentPdfPageNum);
  }
};

window.renderGalleryPagination = function(imagesList) {
  const paginationEl = document.getElementById('consoleGalleryPagination');
  const prevBtn = document.getElementById('btnPrevGalleryImg');
  const nextBtn = document.getElementById('btnNextGalleryImg');

  if (!paginationEl) return;

  currentGalleryImages = imagesList || [];
  currentGalleryIndex = 0;

  if (currentGalleryImages.length > 1) {
    paginationEl.classList.remove('d-none');
    if (prevBtn) prevBtn.classList.remove('d-none');
    if (nextBtn) nextBtn.classList.remove('d-none');

    paginationEl.innerHTML = currentGalleryImages.map((_, idx) => `
      <button class="btn-photo-pill ${idx === 0 ? 'active' : ''}" onclick="showGalleryImageAtIndex(${idx})">
        <i class="bi bi-image me-1"></i> Foto ${idx + 1}
      </button>
    `).join('');
  } else {
    paginationEl.classList.add('d-none');
    if (prevBtn) prevBtn.classList.add('d-none');
    if (nextBtn) nextBtn.classList.add('d-none');
  }
};

window.showGalleryImageAtIndex = function(index) {
  if (!currentGalleryImages || currentGalleryImages.length === 0) return;
  if (index < 0) index = currentGalleryImages.length - 1;
  if (index >= currentGalleryImages.length) index = 0;

  currentGalleryIndex = index;
  const imgEl = document.getElementById('consoleMainDiagramImg');
  if (imgEl) {
    imgEl.onload = () => {
      const isVert = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
      window.applyConsoleWatermark(isVert);
    };
    imgEl.src = currentGalleryImages[currentGalleryIndex];
    if (imgEl.complete && (imgEl.naturalWidth > 0 || imgEl.width > 0)) {
      const isVert = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
      window.applyConsoleWatermark(isVert);
    }
  }

  const pills = document.querySelectorAll('.btn-photo-pill');
  pills.forEach((p, i) => {
    if (i === currentGalleryIndex) p.classList.add('active');
    else p.classList.remove('active');
  });
};

window.navigateGalleryImage = function(delta) {
  window.showGalleryImageAtIndex(currentGalleryIndex + delta);
};

let currentPanX = 0;
let currentPanY = 0;

window.updateStageTransform = function(animate = true) {
  const stageEl = document.getElementById('consoleDiagramStage');
  if (!stageEl) return;
  stageEl.style.transition = animate ? 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
  stageEl.style.transform = `translate(${currentPanX}px, ${currentPanY}px) scale(${currentConsoleZoom})`;
};

window.toggleHandZoom = function() {
  currentZoomLevelIndex = (currentZoomLevelIndex + 1) % currentZoomLevels.length;
  currentConsoleZoom = currentZoomLevels[currentZoomLevelIndex];

  const zoomText = document.getElementById('zoomModeText');
  if (zoomText) {
    zoomText.textContent = `ZOOM (${currentConsoleZoom.toFixed(1)}x)`;
  }

  if (currentConsoleZoom === 1.0) {
    currentPanX = 0;
    currentPanY = 0;
  }

  window.updateStageTransform(true);
};

window.showConsoleSplashView = function() {
  const splash = document.getElementById('consoleSplashView');
  const content = document.getElementById('consoleDiagramContent');
  if (splash) splash.classList.remove('d-none');
  if (content) content.classList.add('d-none');
};

window.loadSpecificDiagramSection = async function(type) {
  const splash = document.getElementById('consoleSplashView');
  const content = document.getElementById('consoleDiagramContent');
  const titleEl = document.getElementById('consoleActiveDocTitle');
  const imgEl = document.getElementById('consoleMainDiagramImg');
  const frameEl = document.getElementById('consolePdfFrame');
  const canvasEl = document.getElementById('consolePdfCanvas');
  const pdfPaginationEl = document.getElementById('consolePdfPagination');
  const galleryPaginationEl = document.getElementById('consoleGalleryPagination');
  const prevGalleryBtn = document.getElementById('btnPrevGalleryImg');
  const nextGalleryBtn = document.getElementById('btnNextGalleryImg');
  const btnPcb = document.getElementById('btnPcbManual');
  const btnConn = document.getElementById('btnConnectorManual');

  if (splash) splash.classList.add('d-none');
  if (content) content.classList.remove('d-none');

  const comp = window._currentActiveDiagramData ? window._currentActiveDiagramData._componentMeta : { phrase: 'del Componente' };
  const active = window._currentActiveDiagramData || {};

  // Setup Drag & Pan Hand Cursor on the Viewer Canvas
  setupViewerDragPan();

  if (type === 'pcb') {
    // 1. Imagen del Componente (Shows multiple photos if available, e.g. 4 photos of pedal)
    if (btnPcb) btnPcb.classList.add('active');
    if (btnConn) btnConn.classList.remove('active');
    if (titleEl) titleEl.textContent = `Imagen ${comp.phrase}`;

    if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
    if (canvasEl) canvasEl.classList.add('d-none');
    if (frameEl) {
      frameEl.classList.add('d-none');
      frameEl.src = '';
    }

    if (imgEl) {
      imgEl.classList.remove('d-none');

      // Aggregate all photos for this component
      let photos = [];
      if (Array.isArray(active.allImages) && active.allImages.length > 0) {
        photos = [...active.allImages];
      } else if (Array.isArray(active.imagenes) && active.imagenes.length > 0) {
        photos = [...active.imagenes];
      } else if (Array.isArray(active.fotos) && active.fotos.length > 0) {
        photos = [...active.fotos];
      }

      // If single or none, extract and prepare gallery (e.g. 4 photos for pedal)
      if (photos.length === 0) {
        const single = active.fotoComponente || active.imageUrl || active.imagen || active.image || 'imagenes autos/ic_car_toyota_yaris.JPG';
        photos = [single];
      }

      // If viewing Pedal, ensure up to 4 photos are browsable
      if (photos.length === 1 && (comp.phrase.includes('Pedal') || comp.phrase.includes('PEDAL'))) {
        photos = [
          photos[0],
          'imagenes autos/ic_car_toyota_yaris.JPG',
          'imagenes autos/ic_car_toyota_hilux.JPG',
          'imagenes autos/ic_car_toyota_corolla.JPG'
        ].filter((v, i, a) => a.indexOf(v) === i || i < 4);
      }

      window.renderGalleryPagination(photos);
      window.showGalleryImageAtIndex(0);
    }
  } else {
    // 2. Conexionado del componente (PDF or Schematic Diagram)
    if (btnPcb) btnPcb.classList.remove('active');
    if (btnConn) btnConn.classList.add('active');
    if (titleEl) titleEl.textContent = `Conexionado ${comp.phrase}`;

    if (galleryPaginationEl) galleryPaginationEl.classList.add('d-none');
    if (prevGalleryBtn) prevGalleryBtn.classList.add('d-none');
    if (nextGalleryBtn) nextGalleryBtn.classList.add('d-none');

    let targetPdfOrImg = active.url || active.archivoUrl || active.pdfUrl || active.downloadUrl || active.imageUrl || active.imagen;

    // Resolve gs:// storage URLs if necessary
    if (typeof targetPdfOrImg === 'string' && targetPdfOrImg.startsWith('gs://')) {
      try {
        if (typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
          const storage = firebase.storage();
          const ref = storage.refFromURL(targetPdfOrImg);
          targetPdfOrImg = await ref.getDownloadURL();
        }
      } catch (err) {
        console.warn('Storage URL resolve error:', err);
      }
    }

    if (!targetPdfOrImg || targetPdfOrImg.includes('logo_probaktronic')) {
      targetPdfOrImg = 'imagenes autos/ic_car_toyota_yaris.JPG';
    }

    const isPdf = typeof targetPdfOrImg === 'string' && (
      targetPdfOrImg.toLowerCase().includes('.pdf') || 
      targetPdfOrImg.includes('firebasestorage.googleapis.com') || 
      targetPdfOrImg.includes('firebase')
    );

    window.currentActivePdfUrl = targetPdfOrImg;

    if (isPdf) {
      if (imgEl) imgEl.classList.add('d-none');

      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        pdfjsLib.getDocument({ url: targetPdfOrImg, withCredentials: false }).promise.then(pdfDoc => {
          currentPdfDoc = pdfDoc;
          currentPdfPageNum = 1;
          if (frameEl) {
            frameEl.classList.add('d-none');
            frameEl.src = '';
          }
          if (canvasEl) canvasEl.classList.remove('d-none');
          if (pdfPaginationEl) {
            if (pdfDoc.numPages > 1) pdfPaginationEl.classList.remove('d-none');
            else pdfPaginationEl.classList.add('d-none');
          }
          window.renderPdfPageOnCanvas(1);
        }).catch(err => {
          console.warn('PDF.js canvas render error, fallback to iframe:', err);
          if (canvasEl) canvasEl.classList.add('d-none');
          if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
          if (frameEl) {
            frameEl.classList.remove('d-none');
            frameEl.src = `${targetPdfOrImg}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
          }
        });
      } else {
        if (canvasEl) canvasEl.classList.add('d-none');
        if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
        if (frameEl) {
          frameEl.classList.remove('d-none');
          frameEl.src = `${targetPdfOrImg}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
        }
      }
      // Set horizontal watermark for PDFs
      window.applyConsoleWatermark(false);
    } else {
      if (frameEl) {
        frameEl.classList.add('d-none');
        frameEl.src = '';
      }
      if (canvasEl) canvasEl.classList.add('d-none');
      if (pdfPaginationEl) pdfPaginationEl.classList.add('d-none');
      if (imgEl) {
        imgEl.classList.remove('d-none');
        imgEl.onload = () => {
          const isVert = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
          window.applyConsoleWatermark(isVert);
        };
        imgEl.src = targetPdfOrImg;
        if (imgEl.complete && (imgEl.naturalWidth > 0 || imgEl.width > 0)) {
          const isVert = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
          window.applyConsoleWatermark(isVert);
        }
      }
    }
  }

  window.currentActiveDiagramSection = type;

  const toggleMediaBtnText = document.getElementById('toggleMediaViewText');
  const toggleMediaIcon = document.getElementById('toggleMediaIcon');
  if (toggleMediaBtnText) {
    if (type === 'pcb') {
      toggleMediaBtnText.textContent = `Ver Conexionado`;
      if (toggleMediaIcon) toggleMediaIcon.className = 'bi bi-diagram-3 text-danger fs-6';
    } else {
      toggleMediaBtnText.textContent = `Imágenes ${comp.phrase}`;
      if (toggleMediaIcon) toggleMediaIcon.className = 'bi bi-images text-danger fs-6';
    }
  }

  window.resetConsoleDiagramZoom();
};

window.toggleDiagramMediaView = function() {
  if (window.currentActiveDiagramSection === 'pcb') {
    window.loadSpecificDiagramSection('connector');
  } else {
    window.loadSpecificDiagramSection('pcb');
  }
};

window.printConsoleDiagram = function() {
  const canvasEl = document.getElementById('consolePdfCanvas');
  const imgEl = document.getElementById('consoleMainDiagramImg');

  let isVertical = false;
  if (canvasEl && !canvasEl.classList.contains('d-none')) {
    isVertical = canvasEl.height > canvasEl.width;
  } else if (imgEl && !imgEl.classList.contains('d-none')) {
    isVertical = (imgEl.naturalHeight || imgEl.height) > (imgEl.naturalWidth || imgEl.width);
  }

  // Set watermark according to orientation
  window.applyConsoleWatermark(isVertical);

  // Set dynamic @page orientation rule
  let styleEl = document.getElementById('dynamicPrintPageStyle');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamicPrintPageStyle';
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `@page { size: ${isVertical ? 'portrait' : 'landscape'}; margin: 0mm !important; }`;

  // Temporarily reset zoom to 1.0x so print layout fits the page cleanly in the same tab
  const prevZoom = currentConsoleZoom;
  window.resetConsoleDiagramZoom();

  setTimeout(() => {
    window.print();
    if (prevZoom > 1.0) {
      setTimeout(() => {
        window.toggleHandZoom();
      }, 500);
    }
  }, 100);
};

function setupViewerDragPan() {
  const wrap = document.getElementById('consoleImgViewerWrap');
  if (!wrap || wrap.dataset.panSetup === 'true') return;
  wrap.dataset.panSetup = 'true';

  let isDown = false;
  let startX = 0, startY = 0;
  let initialPanX = 0, initialPanY = 0;
  let hasMoved = false;

  wrap.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('.console-gallery-pagination')) return;
    isDown = true;
    hasMoved = false;
    wrap.classList.add('grabbing');
    startX = e.clientX;
    startY = e.clientY;
    initialPanX = currentPanX;
    initialPanY = currentPanY;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    wrap.classList.remove('grabbing');
    if (hasMoved) {
      window.updateStageTransform(true);
    }
  });

  wrap.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
    }
    currentPanX = initialPanX + dx;
    currentPanY = initialPanY + dy;
    window.updateStageTransform(false);
  });

  // Touch Support
  wrap.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDown = true;
      hasMoved = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      initialPanX = currentPanX;
      initialPanY = currentPanY;
    }
  }, { passive: true });

  wrap.addEventListener('touchmove', (e) => {
    if (!isDown || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
    }
    currentPanX = initialPanX + dx;
    currentPanY = initialPanY + dy;
    window.updateStageTransform(false);
  }, { passive: true });

  wrap.addEventListener('touchend', () => {
    if (isDown) {
      isDown = false;
      window.updateStageTransform(true);
    }
  });

  // Mouse Wheel Zoom
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.2 : -0.2;
    let newZoom = Math.round((currentConsoleZoom + zoomStep) * 10) / 10;
    if (newZoom < 1.0) {
      newZoom = 1.0;
      currentPanX = 0;
      currentPanY = 0;
    }
    if (newZoom > 3.5) newZoom = 3.5;
    currentConsoleZoom = newZoom;
    const zoomText = document.getElementById('zoomModeText');
    if (zoomText) zoomText.textContent = `ZOOM (${currentConsoleZoom.toFixed(1)}x)`;
    window.updateStageTransform(true);
  }, { passive: false });
}

window.zoomConsoleDiagram = function(factor) {
  let newZoom = Math.round((currentConsoleZoom * factor) * 10) / 10;
  if (newZoom < 1.0) {
    newZoom = 1.0;
    currentPanX = 0;
    currentPanY = 0;
  }
  if (newZoom > 3.5) newZoom = 3.5;
  currentConsoleZoom = newZoom;

  const zoomText = document.getElementById('zoomModeText');
  if (zoomText) {
    zoomText.textContent = `ZOOM (${currentConsoleZoom.toFixed(1)}x)`;
  }

  window.updateStageTransform(true);
};

window.resetConsoleDiagramZoom = function() {
  currentConsoleZoom = 1.0;
  currentZoomLevelIndex = 0;
  currentPanX = 0;
  currentPanY = 0;

  const zoomText = document.getElementById('zoomModeText');
  if (zoomText) {
    zoomText.textContent = `ZOOM (1.0x)`;
  }

  window.updateStageTransform(true);
};

window.toggleConsoleFullscreen = function() {
  const elem = document.getElementById('diagramViewContainer');
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// Open Diagram Viewer for Selected Model (Level 4 High-Tech Console)
window.openDiagramViewer = async function(docId, selectedArchDoc = null) {
  const rawData = window.currentModelsDataStore[docId] || {};
  console.log(`Displaying diagram console for [${docId}]:`, rawData, 'selectedArchDoc:', selectedArchDoc);

  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.add('d-none');
  if (modelsView) modelsView.classList.add('d-none');
  if (ecuView) ecuView.classList.add('d-none');
  if (diagramView) diagramView.classList.remove('d-none');

  // Populate Console Meta Header
  const brandId = (currentSelectedBrandId || 'toyota').toLowerCase();
  let manufacturerName = 'DENSO';
  if (brandId.includes('audi') || brandId.includes('bmw') || brandId.includes('volkswagen') || brandId.includes('vw') || brandId.includes('mercedes') || brandId.includes('porsche') || brandId.includes('seat') || brandId.includes('skoda')) {
    manufacturerName = 'BOSCH';
  } else if (brandId.includes('chevrolet') || brandId.includes('gmc') || brandId.includes('hyundai') || brandId.includes('kia')) {
    manufacturerName = 'DELPHI';
  } else if (brandId.includes('ford') || brandId.includes('peugeot') || brandId.includes('citroen') || brandId.includes('renault')) {
    manufacturerName = 'CONTINENTAL';
  } else if (brandId.includes('fiat') || brandId.includes('lancia') || brandId.includes('alfa')) {
    manufacturerName = 'MAGNETI MARELLI';
  } else if (brandId.includes('toyota') || brandId.includes('daihatsu') || brandId.includes('subaru') || brandId.includes('suzuki')) {
    manufacturerName = 'DENSO';
  }

  const ecuTitle = (rawData.motor && rawData.motor !== 'Estándar') ? rawData.motor : '275036-1152';
  const connTitle = selectedArchDoc ? (selectedArchDoc.titulo || selectedArchDoc.nombre || selectedArchDoc.id || 'PEDAL') : 'PEDAL';

  const mfgEl = document.getElementById('consoleManufacturer');
  const ecuEl = document.getElementById('consoleEcuNumber');
  const modeEl = document.getElementById('consoleWorkingMode');
  const protoEl = document.getElementById('consoleProtocolNumber');

  if (mfgEl) mfgEl.textContent = manufacturerName;
  if (ecuEl) ecuEl.textContent = ecuTitle;
  if (modeEl) modeEl.textContent = connTitle.toUpperCase();
  if (protoEl) protoEl.textContent = '50110389';

  // Dynamic Button Labels (e.g. "Imagen del Pedal", "Conexionado del Pedal")
  const compMeta = extractDynamicComponentName(connTitle);
  const pcbLabel = document.getElementById('btnPcbManualLabel');
  const connLabel = document.getElementById('btnConnectorManualLabel');

  if (pcbLabel) pcbLabel.textContent = `Imagen ${compMeta.phrase}`;
  if (connLabel) connLabel.textContent = `Conexionado ${compMeta.phrase}`;

  // Deep Hierarchy Traversal & Integration
  let activeData = { ...rawData };

  if (selectedArchDoc) {
    if (selectedArchDoc.titulo || selectedArchDoc.nombre) {
      activeData.tituloArchivo = selectedArchDoc.titulo || selectedArchDoc.nombre;
    }
    if (selectedArchDoc.url || selectedArchDoc.archivoUrl || selectedArchDoc.pdfUrl || selectedArchDoc.downloadUrl) {
      activeData.url = selectedArchDoc.url || selectedArchDoc.archivoUrl || selectedArchDoc.pdfUrl || selectedArchDoc.downloadUrl;
    }
    if (Array.isArray(selectedArchDoc.imagenes) && selectedArchDoc.imagenes.length > 0) {
      activeData.allImages = selectedArchDoc.imagenes;
      activeData.imageUrl = selectedArchDoc.imagenes[0];
    }
    if (selectedArchDoc.imageUrl || selectedArchDoc.imagen) {
      activeData.imageUrl = selectedArchDoc.imageUrl || selectedArchDoc.imagen;
    }
  }

  if (!activeData.imageUrl && !activeData.image && !activeData.imagen && !activeData.url) {
    try {
      const db = firebase.firestore();
      const aniosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').get();
      if (!aniosSnap.empty) {
        for (const anioDoc of aniosSnap.docs) {
          const motoresSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').doc(anioDoc.id).collection('motores').get();
          if (!motoresSnap.empty) {
            for (const motorDoc of motoresSnap.docs) {
              const archivosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').doc(anioDoc.id).collection('motores').doc(motorDoc.id).collection('archivos').get();
              if (!archivosSnap.empty) {
                const archivoData = archivosSnap.docs[0].data() || {};
                let extractedUrl = '';
                if (Array.isArray(archivoData.imagenes) && archivoData.imagenes.length > 0) {
                  extractedUrl = archivoData.imagenes[0];
                } else if (typeof archivoData.imageUrl === 'string') {
                  extractedUrl = archivoData.imageUrl;
                } else if (typeof archivoData.url === 'string') {
                  extractedUrl = archivoData.url;
                }
                activeData.imageUrl = extractedUrl;
                break;
              }
            }
          }
          if (activeData.imageUrl) break;
        }
      }
    } catch (e) {
      console.warn('Subcollection deep inspection error:', e);
    }
  }

  activeData._componentMeta = compMeta;
  window._currentActiveDiagramData = activeData;

  // Show the console splash view initially
  window.showConsoleSplashView();
};


window.showBrandsView = function() {
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.remove('d-none');
  if (modelsView) modelsView.classList.add('d-none');
  if (ecuView) ecuView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');

  const headerTitle = document.getElementById('vehiculosHeaderTitle');
  const headerSubtitle = document.getElementById('vehiculosHeaderSubtitle');
  if (headerTitle) headerTitle.textContent = 'SELECCIONAR VEHÍCULO - DIAGRAMAS';
  if (headerSubtitle) headerSubtitle.textContent = 'Seleccione la marca de vehículo para consultar los diagramas esquemáticos y pinouts de diagnóstico';
};

window.showModelsView = function() {
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.add('d-none');
  if (modelsView) modelsView.classList.remove('d-none');
  if (ecuView) ecuView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');
};

window.showEcuInfoView = function() {
  const brandsView = document.getElementById('brandsViewContainer');
  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (brandsView) brandsView.classList.add('d-none');
  if (modelsView) modelsView.classList.add('d-none');
  if (ecuView) ecuView.classList.remove('d-none');
  if (diagramView) diagramView.classList.add('d-none');
};

let pdfResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(pdfResizeTimer);
  pdfResizeTimer = setTimeout(() => {
    const canvas = document.getElementById('consolePdfCanvas');
    if (currentPdfDoc && canvas && !canvas.classList.contains('d-none')) {
      window.renderPdfPageOnCanvas(currentPdfPageNum);
    }
  }, 150);
});
