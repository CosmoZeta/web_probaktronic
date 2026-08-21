// Bobinas & Vehicle Brand Selector Controller for Probaktronic
// Conexión Robusta con Cloud Firestore y Firebase Storage con Pantalla de Carga 0-100%

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

let currentSelectedBrandId = null;
let currentSelectedBrandName = null;
window.currentModelsDataStore = {};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBobinasModule);
} else {
  initBobinasModule();
}

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

  // Smart Top-Left Back Button Handler (Hierarchical Step-by-Step Navigation)
  const btnBackView = document.getElementById('btnBackView');
  if (btnBackView) {
    btnBackView.addEventListener('click', (e) => {
      const brandsView = document.getElementById('brandsViewContainer');
      const modelsView = document.getElementById('modelsViewContainer');
      const diagramView = document.getElementById('diagramViewContainer');

      // 1. If currently in Diagram Viewer (View 3), go back to Models List (View 2)
      if (diagramView && !diagramView.classList.contains('d-none')) {
        e.preventDefault();
        showModelsView();
        return;
      }

      // 2. If currently in Models List (View 2), go back to Brands Grid (View 1)
      if (modelsView && !modelsView.classList.contains('d-none')) {
        e.preventDefault();
        showBrandsView();
        return;
      }

      // 3. If currently in Brands Grid (View 1), allow normal navigation back to sensores-actuadores.html
    });
  }


  // Query Firestore collection 'bobinas'
  loadFirestoreBobinas(brandGrid);
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

  // Show Centered 0-100% Loader Card
  const loader = window.createCenteredFirebaseLoader(grid, 'Conectando con Cloud Firestore para descargar marcas...');

  const db = firebase.firestore();
  console.log('Querying Firestore collection [bobinas]...');

  db.collection('bobinas').get()
    .then(snapshot => {
      loader.finish(() => {
        if (!snapshot.empty) {
          console.log(`Loaded ${snapshot.size} brand documents from Firestore [bobinas]`);
          grid.innerHTML = ''; // Clear loader

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
      });
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
    // Show Centered 0-100% Loader Card for Models
    const loader = window.createCenteredFirebaseLoader(modelsListGrid, `Conectando con Cloud Firestore para descargar modelos de ${brandName}...`);

    const db = firebase.firestore();
    db.collection('bobinas').doc(brandDocId).collection('modelos').get()
      .then(snapshot => {
        loader.finish(() => {
          if (!snapshot.empty) {
            modelsListGrid.innerHTML = '';
            
            snapshot.forEach(doc => {
              const data = doc.data() || {};
              const docId = doc.id;
              
              window.currentModelsDataStore[docId] = data;

              const modelName = data.modelo || docId;
              const motor = data.motor || 'Estándar';

              console.log(`[Firestore Model] ${docId}:`, data);

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
        });
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

  // Dynamically update Pinout and Procedure from Firestore fields (or fallback)
  const pinoutEl = document.getElementById('diagramPinoutText');
  const procedureEl = document.getElementById('diagramProcedureText');

  const customPinout = data.pinout || data.senial || data.pinoutSenial || data.pins || 'Pin 1: +12V Batería | Pin 2: Tierra Chasis | Pin 3: Pulso ECU';
  const customProcedure = data.procedimiento || data.descripcion || data.procedimientoDiagnostico || data.notas || 'Medir señal PWM con osciloscopio o punta lógica Probaktronic';

  if (pinoutEl) pinoutEl.textContent = customPinout;
  if (procedureEl) procedureEl.textContent = customProcedure;

  if (!imgContainer) return;

  // Show Centered 0-100% Loader Card for Diagram Image
  const loader = window.createCenteredFirebaseLoader(imgContainer, `Conectando con Firebase Storage para obtener el esquema de ${docId}...`);

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

  // Render Image directly with Protection + Multi-level Click & Hover Zoom System
  loader.finish(() => {
    imgContainer.innerHTML = `
      <div class="protected-image-wrapper position-relative text-center w-100" id="zoomWrapper" oncontextmenu="return false;" ondragstart="return false;">
        <span class="badge bg-dark opacity-75 position-absolute top-0 end-0 m-2" id="zoomLevelBadge" style="z-index: 15; pointer-events: none; font-size: 0.75rem;">Sutil Hover (1.35x) • Clic para +Zoom</span>
        <img src="${finalImageUrl}" alt="${modelTitle}" id="zoomImage" class="diagram-viewer-modal-img unselectable-image" referrerpolicy="no-referrer"
             oncontextmenu="return false;" ondragstart="return false;" draggable="false">
        <div class="security-shield-overlay" id="zoomShield" oncontextmenu="return false;" ondragstart="return false;"></div>
      </div>
    `;

    // Multi-level Zoom System:
    // State 0 = Slight Hover (1.35x)
    // State 1 = 1st Click (Medium 2.0x)
    // State 2 = 2nd Click (Max 3.0x)
    // State 3 = 3rd Click (Reset 1.0x)
    let zoomLevelState = 0; // 0 = default hover mode, 1 = med, 2 = high

    const shield = document.getElementById('zoomShield');
    const img = document.getElementById('zoomImage');
    const wrapper = document.getElementById('zoomWrapper');
    const badge = document.getElementById('zoomLevelBadge');

    if (shield && img && wrapper) {
      // Mouse move tracks cursor position dynamically
      shield.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        img.style.transformOrigin = `${x}% ${y}%`;

        if (zoomLevelState === 0) {
          img.style.transform = 'scale(1.35)'; // Slight hover zoom
        } else if (zoomLevelState === 1) {
          img.style.transform = 'scale(2.0)'; // 1st click medium zoom
        } else if (zoomLevelState === 2) {
          img.style.transform = 'scale(3.0)'; // 2nd click max zoom
        }
      });

      // Sequential Click handler (1st click -> 2.0x, 2nd click -> 3.0x, 3rd click -> Reset)
      shield.addEventListener('click', (e) => {
        e.preventDefault();

        zoomLevelState = (zoomLevelState + 1) % 3; // Cycles: 0 -> 1 -> 2 -> 0

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

      // Mouse leave resets to normal 1.0x
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
