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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVehiculosDiagramasModule);
} else {
  initVehiculosDiagramasModule();
}

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
    btnBackView.addEventListener('click', (e) => {
      const brandsView = document.getElementById('brandsViewContainer');
      const modelsView = document.getElementById('modelsViewContainer');
      const diagramView = document.getElementById('diagramViewContainer');

      if (diagramView && !diagramView.classList.contains('d-none')) {
        e.preventDefault();
        showModelsView();
        return;
      }

      if (modelsView && !modelsView.classList.contains('d-none')) {
        e.preventDefault();
        showBrandsView();
        return;
      }
    });
  }

  // Bind click handlers to pre-rendered HTML cards immediately
  const initialCards = brandGrid.querySelectorAll('.brand-card');
  initialCards.forEach(card => {
    card.onclick = (e) => {
      if (e) e.stopPropagation();
      const docId = (card.getAttribute('data-doc-id') || card.getAttribute('data-brand') || '').toLowerCase().trim();
      const displayName = card.getAttribute('data-brand') || docId;
      const logoImg = card.querySelector('img');
      const logoSrc = logoImg ? logoImg.getAttribute('src') : 'logo_probaktronic_solo.png';

      console.log(`Pre-rendered brand card clicked: [${docId}] - ${displayName}`);
      window.openBrandDiagramModels(docId, displayName, logoSrc, 'diagramas');
    };
  });

  // Query Firestore collection 'diagramas' (or 'bobinas' fallback)
  loadFirestoreDiagramasBrands(brandGrid);
}

function ensureFirebaseInitialized() {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp({
      apiKey: "AIzaSyC8IUDukbyc5NlQPFUn9ZDYOiR4GeeHRYY",
      authDomain: "probaktronic-app.firebaseapp.com",
      projectId: "probaktronic-app",
      storageBucket: "probaktronic-app.firebasestorage.app",
      messagingSenderId: "373953615206",
      appId: "1:373953615206:android:6ccca21cefcb6100ee4a7"
    });
  }
}

function safeCreateCenteredLoader(container, text) {
  if (typeof window.createCenteredFirebaseLoader === 'function') {
    return window.createCenteredFirebaseLoader(container, text);
  }
  return { finish: (cb) => { if (cb) cb(); } };
}

function loadFirestoreDiagramasBrands(grid) {
  if (!grid) return;

  ensureFirebaseInitialized();

  const loader = safeCreateCenteredLoader(grid, 'Conectando con Cloud Firestore para descargar diagramas de marcas...');

  const all38Brands = [
    { id: 'audi', name: 'Audi' },
    { id: 'bmw', name: 'BMW' },
    { id: 'byd', name: 'BYD' },
    { id: 'chevrolet', name: 'Chevrolet' },
    { id: 'citroen', name: 'Citroën' },
    { id: 'dacia', name: 'Dacia' },
    { id: 'daihatsu', name: 'Daihatsu' },
    { id: 'fiat', name: 'Fiat' },
    { id: 'ford', name: 'Ford' },
    { id: 'gmc', name: 'GMC' },
    { id: 'honda', name: 'Honda' },
    { id: 'hummer', name: 'Hummer' },
    { id: 'hyundai', name: 'Hyundai' },
    { id: 'infiniti', name: 'Infiniti' },
    { id: 'isuzu', name: 'Isuzu' },
    { id: 'kia', name: 'Kia' },
    { id: 'lada', name: 'Lada' },
    { id: 'lancia', name: 'Lancia' },
    { id: 'lotus', name: 'Lotus' },
    { id: 'mahindra', name: 'Mahindra' },
    { id: 'maruti', name: 'Maruti' },
    { id: 'mazda', name: 'Mazda' },
    { id: 'mercedes', name: 'Mercedes-Benz' },
    { id: 'mini', name: 'Mini' },
    { id: 'mitsubishi', name: 'Mitsubishi' },
    { id: 'opel', name: 'Opel' },
    { id: 'peugeot', name: 'Peugeot' },
    { id: 'pontiac', name: 'Pontiac' },
    { id: 'porsche', name: 'Porsche' },
    { id: 'renault', name: 'Renault' },
    { id: 'seat', name: 'Seat' },
    { id: 'skoda', name: 'Škoda' },
    { id: 'subaru', name: 'Subaru' },
    { id: 'suzuki', name: 'Suzuki' },
    { id: 'toyota', name: 'Toyota' },
    { id: 'volkswagen', name: 'Volkswagen' },
    { id: 'wuling', name: 'Wuling' },
    { id: 'zotye', name: 'Zotye' }
  ];

  if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
    renderAllBrandsGrid(grid, loader, all38Brands, {});
    return;
  }

  const db = firebase.firestore();
  console.log('Querying Firestore collection [diagramas]...');

  db.collection('diagramas').get()
    .then(snapshot => {
      const firestoreBrandsMap = {};
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          firestoreBrandsMap[doc.id.toLowerCase()] = doc.data() || {};
        });
      }
      renderAllBrandsGrid(grid, loader, all38Brands, firestoreBrandsMap);
    })
    .catch(err => {
      console.warn('Error querying diagramas:', err);
      renderAllBrandsGrid(grid, loader, all38Brands, {});
    });
}

function renderAllBrandsGrid(grid, loader, brandList, firestoreBrandsMap) {
  loader.finish(() => {
    grid.innerHTML = '';
    brandList.forEach(b => {
      const docId = b.id;
      const displayName = b.name;
      const logoSrc = getBrandLogoUrl(docId);
      const isOnlineInFirestore = !!firestoreBrandsMap[docId];

      const card = document.createElement('div');
      card.className = 'brand-card' + (isOnlineInFirestore ? ' position-relative' : '');
      card.setAttribute('data-brand', displayName);
      card.setAttribute('data-doc-id', docId);

      const statusBadge = isOnlineInFirestore ? `
        <span class="badge bg-success position-absolute top-0 end-0 m-2" style="font-size: 0.65rem;" title="Conectado en vivo con Firestore">En Vivo</span>
      ` : '';

      card.innerHTML = `
        ${statusBadge}
        <img src="${logoSrc}" alt="${displayName}" class="brand-logo-img" onerror="this.src='logo_probaktronic_solo.png'">
        <h4 class="brand-name-title">${displayName}</h4>
      `;

      card.onclick = (e) => {
        if (e) e.stopPropagation();
        console.log(`Brand card clicked: [${docId}] - ${displayName}`);
        window.openBrandDiagramModels(docId, displayName, logoSrc, 'diagramas');
      };

      grid.appendChild(card);
    });
  });
}

function renderBrandsFromSnapshot(snapshot, grid, loader, activeCollectionName) {
  loader.finish(() => {
    if (!snapshot.empty) {
      grid.innerHTML = '';
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
        card.onclick = () => openBrandDiagramModels(docId, displayName, logoSrc, activeCollectionName);

        grid.appendChild(card);
      });
    } else {
      grid.innerHTML = `
        <div class="w-100 text-center py-4" style="grid-column: 1 / -1;">
          <p class="text-muted">No se encontraron marcas registradas en Firestore.</p>
        </div>
      `;
    }
  });
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

// Open Level 3: ECU Info & Connection Type Selector (Probaktronic App Flow)
window.openModelEcuInfo = async function(docId, modelName, motorCode) {
  const brandId = currentSelectedBrandId || 'toyota';
  const brandName = currentSelectedBrandName || 'TOYOTA';

  const modelsView = document.getElementById('modelsViewContainer');
  const ecuView = document.getElementById('ecuInfoViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (modelsView) modelsView.classList.add('d-none');
  if (diagramView) diagramView.classList.add('d-none');
  if (ecuView) ecuView.classList.remove('d-none');

  // Populate Vehicle Info Card
  const logoEl = document.getElementById('selectedVehicleBrandLogo');
  const titleEl = document.getElementById('selectedVehicleTitle');
  const subEl = document.getElementById('selectedVehicleBrandSub');
  const badgeEl = document.getElementById('selectedVehicleMotorBadge');
  const ecuTitleEl = document.getElementById('ecuNameTitle');
  const connectionListContainer = document.getElementById('connectionTypeListContainer');

  if (logoEl) logoEl.src = getBrandLogoUrl(brandId);
  if (titleEl) titleEl.textContent = modelName || docId;
  if (subEl) subEl.textContent = brandName.toUpperCase();
  if (badgeEl) badgeEl.textContent = `Motor ${motorCode || '2KD-FTV'} (2011 - 2015)`;
  if (ecuTitleEl) ecuTitleEl.textContent = motorCode || '2KD-FTV';

  if (!connectionListContainer) return;

  const loader = safeCreateCenteredLoader(connectionListContainer, 'Cargando opciones de conexión y documentos PDF desde Firebase...');

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

  // Fallback if list is empty
  if (archivosList.length === 0) {
    archivosList = [
      { id: 'TOYOTA HILUX 2011 - 2015 PEDAL', titulo: 'TOYOTA HILUX 2011 - 2015  PEDAL', tipo: 'DOCUMENTO PDF' },
      { id: 'TOYOTA HILUX E.D.U DOS CONECTORES', titulo: 'TOYOTA HILUX E.D.U DOS CONECTORES', tipo: 'DOCUMENTO PDF' },
      { id: 'TOYOTA HILUX E.D.U TRES CONECTORES', titulo: 'TOYOTA HILUX E.D.U TRES CONECTORES', tipo: 'DOCUMENTO PDF' },
      { id: 'TOYOTA HILUX inmovilizador y llave antena', titulo: 'TOYOTA HILUX inmovilizador y llave antena', tipo: 'DOCUMENTO PDF' },
      { id: 'Toyota Hilux - 2KD-FTV - 2011-', titulo: 'Toyota Hilux - 2KD-FTV - 2011-', tipo: 'DOCUMENTO PDF' }
    ];
  }

  let selectedArchDoc = archivosList[0];

  loader.finish(() => {
    connectionListContainer.innerHTML = '';

    archivosList.forEach((arch, index) => {
      const isSelected = index === 0;
      const title = arch.titulo || arch.nombre || arch.id;

      const card = document.createElement('div');
      card.className = `connection-option-card rounded-4 p-3 border cursor-pointer d-flex align-items-center justify-content-between transition-all ${isSelected ? 'border-danger border-2 bg-light shadow-sm' : 'bg-white'}`;
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="d-flex align-items-center gap-3">
          <div class="bg-white p-2 rounded-3 border text-center" style="width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;">
            <i class="bi bi-file-earmark-pdf fs-3 text-danger"></i>
          </div>
          <div>
            <h6 class="font-rajdhani fw-bold text-dark mb-0 fs-6">${title}</h6>
            <span class="text-danger small font-rajdhani fw-bold">DOCUMENTO PDF</span>
          </div>
        </div>
        <div class="connection-radio-circle">
          <i class="bi ${isSelected ? 'bi-check-circle-fill text-danger fs-4' : 'bi-circle text-muted fs-4'}"></i>
        </div>
      `;

      card.onclick = () => {
        connectionListContainer.querySelectorAll('.connection-option-card').forEach(c => {
          c.classList.remove('border-danger', 'border-2', 'bg-light', 'shadow-sm');
          c.classList.add('bg-white');
          const icon = c.querySelector('.connection-radio-circle i');
          if (icon) icon.className = 'bi bi-circle text-muted fs-4';
        });

        card.classList.add('border-danger', 'border-2', 'bg-light', 'shadow-sm');
        card.classList.remove('bg-white');
        const icon = card.querySelector('.connection-radio-circle i');
        if (icon) icon.className = 'bi bi-check-circle-fill text-danger fs-4';

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

// Open Diagram Viewer for Selected Model (Protected View)
window.openDiagramViewer = async function(docId) {
  const rawData = window.currentModelsDataStore[docId] || {};
  console.log(`Displaying diagram for [${docId}]:`, rawData);

  const modelsView = document.getElementById('modelsViewContainer');
  const diagramView = document.getElementById('diagramViewContainer');

  if (modelsView) modelsView.classList.add('d-none');
  if (diagramView) diagramView.classList.remove('d-none');

  const titleEl = document.getElementById('diagramModelTitle');
  const motorEl = document.getElementById('diagramMotorCode');
  const imgContainer = document.getElementById('diagramImgContainer');

  if (!imgContainer) return;

  const loader = safeCreateCenteredLoader(imgContainer, `Conectando con Cloud Firestore y Storage para obtener el diagrama de ${docId}...`);

  // Deep Hierarchy Traversal: modelos -> {modelId} -> anios -> {anioId} -> motores -> {motorId} -> archivos -> {archivoId}
  let activeData = { ...rawData };

  // Check if rawData has array 'imagenes' or single 'imageUrl'
  if (Array.isArray(rawData.imagenes) && rawData.imagenes.length > 0) {
    activeData.imageUrl = rawData.imagenes[0];
    activeData.allImages = rawData.imagenes;
  }

  if (!activeData.imageUrl && !activeData.image && !activeData.imagen && !activeData.url) {
    try {
      const db = firebase.firestore();
      const brandId = currentSelectedBrandId;
      console.log(`Traversing deep hierarchy for brand [${brandId}] model [${docId}]...`);

      const aniosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').get();
      if (!aniosSnap.empty) {
        for (const anioDoc of aniosSnap.docs) {
          const motoresSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').doc(anioDoc.id).collection('motores').get();
          if (!motoresSnap.empty) {
            for (const motorDoc of motoresSnap.docs) {
              const motorData = motorDoc.data() || {};
              const archivosSnap = await db.collection('diagramas').doc(brandId).collection('modelos').doc(docId).collection('anios').doc(anioDoc.id).collection('motores').doc(motorDoc.id).collection('archivos').get();
              if (!archivosSnap.empty) {
                const archivoData = archivosSnap.docs[0].data() || {};
                console.log('Found deep diagram file:', archivoData);

                let extractedUrl = '';
                if (Array.isArray(archivoData.imagenes) && archivoData.imagenes.length > 0) {
                  extractedUrl = archivoData.imagenes[0];
                  activeData.allImages = archivoData.imagenes;
                } else if (typeof archivoData.imageUrl === 'string') {
                  extractedUrl = archivoData.imageUrl;
                } else if (typeof archivoData.url === 'string') {
                  extractedUrl = archivoData.url;
                } else if (typeof archivoData.imagen === 'string') {
                  extractedUrl = archivoData.imagen;
                }

                if (!extractedUrl) {
                  if (Array.isArray(motorData.imagenes) && motorData.imagenes.length > 0) {
                    extractedUrl = motorData.imagenes[0];
                  } else if (typeof motorData.imageUrl === 'string') {
                    extractedUrl = motorData.imageUrl;
                  }
                }

                activeData.imageUrl = extractedUrl;
                activeData.motor = motorData.titulo || motorDoc.id || activeData.motor;
                activeData.modelo = (rawData.nombre || rawData.modelo || docId) + (archivoData.titulo ? ` (${archivoData.titulo})` : '');
                if (archivoData.pinout) activeData.pinout = archivoData.pinout;
                if (archivoData.procedimiento) activeData.procedimiento = archivoData.procedimiento;
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

  const modelTitle = activeData.modelo || rawData.modelo || docId;
  const motorCode = activeData.motor || rawData.motor || 'N/A';

  if (titleEl) titleEl.textContent = `${currentSelectedBrandName} - ${modelTitle}`;
  if (motorEl) motorEl.textContent = `Código de Motor / Parte: ${motorCode}`;

  // Dynamically update Pinout and Procedure from Firestore fields (or fallback)
  const pinoutEl = document.getElementById('diagramPinoutText');
  const procedureEl = document.getElementById('diagramProcedureText');

  const customPinout = activeData.pinout || activeData.senial || activeData.pinoutSenial || activeData.pins || 'Pin 1: +12V Batería | Pin 2: Tierra Chasis | Pin 3: Pulso ECU';
  const customProcedure = activeData.procedimiento || activeData.descripcion || activeData.procedimientoDiagnostico || activeData.notas || 'Medir señal PWM con osciloscopio o punta lógica Probaktronic';

  if (pinoutEl) pinoutEl.textContent = customPinout;
  if (procedureEl) procedureEl.textContent = customProcedure;

  if (!imgContainer) return;

  const loader = window.createCenteredFirebaseLoader(imgContainer, `Conectando con Firebase Storage para obtener el esquema de ${docId}...`);

  let rawUrl = '';
  for (const key of Object.keys(activeData)) {
    const val = activeData[key];
    if (typeof val === 'string' && (val.includes('firebasestorage') || val.includes('http') || val.includes('.png') || val.includes('.jpg') || val.includes('gs://'))) {
      rawUrl = val.trim();
      break;
    }
  }

  if (!rawUrl && (activeData.imageUrl || activeData.image || activeData.imagen || activeData.url)) {
    rawUrl = (activeData.imageUrl || activeData.image || activeData.imagen || activeData.url).trim();
  }

  if (!rawUrl) {
    loader.finish(() => {
      imgContainer.innerHTML = `
        <div class="p-4 text-center text-muted">
          <i class="bi bi-image fs-1 d-block mb-2"></i>
          <p>No se encontró un esquema disponible para <code>${docId}</code>.</p>
        </div>
      `;
    });
    return;
  }

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

  // Render Image directly with Protection + Multi-level Click & Hover Zoom System + Multi-Page Selector
  loader.finish(() => {
    let paginationHtml = '';
    if (Array.isArray(activeData.allImages) && activeData.allImages.length > 1) {
      paginationHtml = `
        <div class="d-flex align-items-center justify-content-center flex-wrap gap-2 mb-3 p-2 bg-dark rounded-3" style="z-index: 25; position: relative;">
          <span class="small text-white fw-bold me-2"><i class="bi bi-file-earmark-slides me-1"></i>Páginas del Esquema (${activeData.allImages.length}):</span>
          ${activeData.allImages.map((imgUrl, idx) => `
            <button class="btn btn-sm ${idx === 0 ? 'btn-danger' : 'btn-outline-light'} py-1 px-3 diagram-page-btn fw-bold" data-img-url="${imgUrl}">
              Pág ${idx + 1}
            </button>
          `).join('')}
        </div>
      `;
    }

    imgContainer.innerHTML = `
      ${paginationHtml}
      <div class="protected-image-wrapper position-relative text-center w-100" id="zoomWrapper" oncontextmenu="return false;" ondragstart="return false;">
        <span class="badge bg-dark opacity-75 position-absolute top-0 end-0 m-2" id="zoomLevelBadge" style="z-index: 15; pointer-events: none; font-size: 0.75rem;">Sutil Hover (1.35x) • Clic para +Zoom</span>
        <img src="${finalImageUrl}" alt="${modelTitle}" id="zoomImage" class="diagram-viewer-modal-img unselectable-image" referrerpolicy="no-referrer"
             oncontextmenu="return false;" ondragstart="return false;" draggable="false">
        <div class="security-shield-overlay" id="zoomShield" oncontextmenu="return false;" ondragstart="return false;"></div>
      </div>
    `;

    // Multi-page selector click handlers
    const pageBtns = imgContainer.querySelectorAll('.diagram-page-btn');
    pageBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        pageBtns.forEach(b => { b.classList.remove('btn-danger'); b.classList.add('btn-outline-light'); });
        btn.classList.remove('btn-outline-light');
        btn.classList.add('btn-danger');

        const newUrl = btn.getAttribute('data-img-url');
        const zoomImg = document.getElementById('zoomImage');
        if (zoomImg && newUrl) {
          zoomImg.src = newUrl;
        }
      });
    });

    let zoomLevelState = 0;

    const shield = document.getElementById('zoomShield');
    const img = document.getElementById('zoomImage');
    const wrapper = document.getElementById('zoomWrapper');
    const badge = document.getElementById('zoomLevelBadge');

    if (shield && img && wrapper) {
      shield.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        img.style.transformOrigin = `${x}% ${y}%`;

        if (zoomLevelState === 0) {
          img.style.transform = 'scale(1.35)';
        } else if (zoomLevelState === 1) {
          img.style.transform = 'scale(2.0)';
        } else if (zoomLevelState === 2) {
          img.style.transform = 'scale(3.0)';
        }
      });

      shield.addEventListener('click', (e) => {
        e.preventDefault();

        zoomLevelState = (zoomLevelState + 1) % 3;

        const rect = wrapper.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        img.style.transformOrigin = `${x}% ${y}%`;

        if (zoomLevelState === 0) {
          img.style.transform = 'scale(1.35)';
          if (badge) {
            badge.textContent = 'Zoom Normal • Clic para +Zoom';
            badge.className = 'badge bg-dark opacity-75 position-absolute top-0 end-0 m-2';
          }
        } else if (zoomLevelState === 1) {
          img.style.transform = 'scale(2.0)';
          if (badge) {
            badge.textContent = 'Zoom Medio (2.0x) • Clic para Máximo';
            badge.className = 'badge bg-danger position-absolute top-0 end-0 m-2';
          }
        } else if (zoomLevelState === 2) {
          img.style.transform = 'scale(3.0)';
          if (badge) {
            badge.textContent = 'Zoom Máximo (3.0x) • Clic para Reiniciar';
            badge.className = 'badge bg-danger position-absolute top-0 end-0 m-2';
          }
        }
      });

      shield.addEventListener('mouseleave', () => {
        zoomLevelState = 0;
        img.style.transformOrigin = 'center center';
        img.style.transform = 'scale(1)';
        if (badge) {
          badge.textContent = 'Sutil Hover (1.35x) • Clic para +Zoom';
          badge.className = 'badge bg-dark opacity-75 position-absolute top-0 end-0 m-2';
        }
      });
    }
  });
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
