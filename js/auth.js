// Probaktronic Authentication & Session Manager (Firebase Auth + Firestore Integration)
console.log('--- Probaktronic Firebase Auth Manager Loaded ---');

// Firebase Configuration (Matching firebase-catalog.js)
const firebaseAuthConfig = {
  apiKey: "AIzaSyC8IUDukbyc5NlQPFUn9ZDYOir4GeeHRYY",
  authDomain: "probaktronic-app.firebaseapp.com",
  projectId: "probaktronic-app",
  storageBucket: "probaktronic-app.firebasestorage.app",
  messagingSenderId: "373953615206",
  appId: "1:373953615206:web:6ccca21cefcb6100ee4a7"
};

// Ensure Firebase is initialized safely
function ensureFirebaseInitialized() {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseAuthConfig);
  }
}

ensureFirebaseInitialized();

// Current User State in Window Context
window.probaktronicCurrentUser = null;

// Render instant cached profile if available before network response
function initCachedUserProfile() {
  try {
    const raw = localStorage.getItem('probaktronic_cached_user');
    if (raw) {
      const cachedData = JSON.parse(raw);
      window.probaktronicCurrentUser = cachedData;
      renderLoggedInHeaderUI(cachedData);
      updateStatusFooterUI(cachedData);
    }
  } catch (e) {
    console.warn('Error al leer caché de usuario local:', e);
  }
}

// Master System Startup
function startAuthSystem() {
  initCachedUserProfile();
  initAuthObserver();
  injectAvatarModal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startAuthSystem);
} else {
  startAuthSystem();
}

function initAuthObserver() {
  ensureFirebaseInitialized();

  if (typeof firebase === 'undefined' || typeof firebase.auth !== 'function') {
    console.warn('Firebase Auth SDK not loaded.');
    return;
  }

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      console.log('Usuario detectado en Firebase Auth:', user.email, user.uid);
      try {
        const db = firebase.firestore();
        const userDocRef = db.collection('usuarios').doc(user.uid);
        let docRef = await userDocRef.get();

        // If user document does not exist in Firestore, create it automatically
        if (!docRef.exists) {
          console.log('Documento de usuario no encontrado en Firestore, creando:', user.email);
          const newUserData = {
            nombre: user.displayName || user.email.split('@')[0],
            email: user.email,
            esPremium: (user.email === 'prueba@probak.com'),
            aprobado: true,
            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
          };
          try {
            await userDocRef.set(newUserData, { merge: true });
            docRef = await userDocRef.get();
          } catch (writeErr) {
            console.warn('Error al escribir en Firestore (Revise Reglas de Seguridad en Firebase Console):', writeErr);
          }
        }

        let userData = {
          uid: user.uid,
          email: user.email,
          nombre: user.displayName || user.email.split('@')[0],
          esPremium: (user.email === 'prueba@probak.com'),
          aprobado: true
        };

        if (docRef && docRef.exists) {
          const data = docRef.data();
          const isPremium = (data.esPremium === true || data.esPremium === 'true' || data.tipo === 'premium' || user.email === 'prueba@probak.com');
          userData = {
            ...userData,
            ...data,
            esPremium: isPremium
          };
        }

        window.probaktronicCurrentUser = userData;
        try {
          localStorage.setItem('probaktronic_cached_user', JSON.stringify(userData));
        } catch (e) {}

        renderLoggedInHeaderUI(userData);
        updateStatusFooterUI(userData);

      } catch (err) {
        console.warn('Aviso al obtener Firestore user doc:', err);
        const fallbackUser = {
          uid: user.uid,
          email: user.email,
          nombre: user.displayName || user.email.split('@')[0],
          esPremium: (user.email === 'prueba@probak.com'),
          aprobado: true
        };
        window.probaktronicCurrentUser = fallbackUser;
        try {
          localStorage.setItem('probaktronic_cached_user', JSON.stringify(fallbackUser));
        } catch (e) {}

        renderLoggedInHeaderUI(fallbackUser);
        updateStatusFooterUI(fallbackUser);
      }
    } else {
      console.log('Sin usuario activo en el sistema.');
      window.probaktronicCurrentUser = null;
      try {
        localStorage.removeItem('probaktronic_cached_user');
      } catch (e) {}

      renderLoggedOutHeaderUI();
      updateStatusFooterUI(null);
    }
  });
}

// Render User Header UI when Logged In
function renderLoggedInHeaderUI(userData) {
  const profileSection = document.querySelector('.user-profile-section');
  if (!profileSection) return;

  const isAdmin = (userData.email === 'prueba@probak.com');
  const isPremium = !!userData.esPremium;

  let roleText = 'Técnico';
  let greetingText = 'BIENVENIDO AL SISTEMA, TÉCNICO';
  let typeBadge = '<span class="badge bg-secondary ms-1" style="font-size:0.65rem;">FREE</span>';

  if (isAdmin) {
    roleText = 'Administrador';
    greetingText = 'BIENVENIDO AL SISTEMA, ADMINISTRADOR';
    typeBadge = '<span class="badge bg-danger ms-1" style="font-size:0.65rem;">ADMIN</span>';
  } else if (isPremium) {
    roleText = 'Técnico Premium';
    greetingText = 'BIENVENIDO AL SISTEMA, USUARIO PREMIUM';
    typeBadge = '<span class="badge bg-warning text-dark ms-1" style="font-size:0.65rem;">PREMIUM</span>';
  }

  const initial = (userData.nombre || userData.email || 'U').charAt(0).toUpperCase();
  const avatarBg = userData.avatarColor || (isAdmin || isPremium ? 'var(--brand-red, #D32F2F)' : '#475569');
  const avatarIcon = userData.avatarIcon || 'bi-person-fill';
  const avatarPhoto = userData.avatarPhotoURL || '';
  const avatarSvg = userData.avatarSvg || '';

  let avatarInnerHtml = `<i class="bi ${avatarIcon}"></i>`;
  if (avatarPhoto) {
    avatarInnerHtml = `<img src="${avatarPhoto}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
  } else if (avatarSvg) {
    avatarInnerHtml = `<img src="${avatarSvg}" alt="Avatar SVG" style="width:65%; height:65%; object-fit:contain;">`;
  } else if (!userData.avatarIcon && initial) {
    avatarInnerHtml = initial;
  }

  profileSection.innerHTML = `
    <div class="dropdown me-2" id="notificationDropdownContainer">
      <button class="notification-bell-btn position-relative border-0 bg-transparent p-0 dropdown-toggle" id="notificationBellBtn" data-bs-toggle="dropdown" aria-expanded="false" title="Notificaciones de nuevos diagramas" onclick="markNotificationsAsRead()">
        <i class="bi bi-bell-fill fs-5" style="color: #64748B;"></i>
        <span class="notification-badge-dot d-none" id="notifBadgeDot" style="position: absolute; top: 0; right: 0; width: 10px; height: 10px; background-color: #EF4444; border-radius: 50%; border: 2px solid #FFF;"></span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 p-0" aria-labelledby="notificationBellBtn" style="min-width: 320px; max-width: 360px; border-radius: 12px; overflow: hidden; z-index: 1050;">
        <li class="bg-dark text-white px-3 py-2 d-flex align-items-center justify-content-between">
          <div class="fw-bold font-rajdhani small d-flex align-items-center gap-2">
            <i class="bi bi-bell-fill text-danger"></i> NOTIFICACIONES DE DIAGRAMAS
          </div>
          <span class="badge bg-danger rounded-pill" id="notifTotalBadge">0 Nuevas</span>
        </li>
        <div id="notificationItemsContainer" style="max-height: 320px; overflow-y: auto;">
          <li class="px-3 py-3 text-center text-muted small">
            <i class="bi bi-inbox fs-4 d-block mb-1"></i>
            Buscando nuevos diagramas en tiempo real...
          </li>
        </div>
        <li class="bg-light px-3 py-2 text-center border-top">
          <a href="vehiculos.html" class="text-danger fw-bold text-decoration-none small">
            Ver Todos los Diagramas <i class="bi bi-arrow-right ms-1"></i>
          </a>
        </li>
      </ul>
    </div>

    <div class="dropdown">
      <div class="user-profile-card dropdown-toggle" id="userProfileDropdown" data-bs-toggle="dropdown" aria-expanded="false" role="button">
        <div class="user-avatar position-relative" style="background-color: ${avatarBg}; color: #FFF; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden;" title="Hacer clic para personalizar avatar" onclick="openAvatarCustomizerModal(event)">
          ${avatarInnerHtml}
          <div class="position-absolute bottom-0 end-0 bg-dark text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 14px; height: 14px; font-size: 8px; border: 1px solid #FFF;">
            <i class="bi bi-pencil-fill"></i>
          </div>
        </div>
        <div class="user-info">
          <span class="user-name fw-bold" style="color: #1E293B;">${userData.nombre} ${typeBadge}</span>
          <span class="user-role text-muted small">${roleText} <i class="bi bi-chevron-down ms-1 fs-7"></i></span>
        </div>
      </div>
      <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2" aria-labelledby="userProfileDropdown" style="min-width: 250px; border-radius: 10px;">
        <li class="px-3 py-2 border-bottom">
          <div class="fw-bold text-dark fs-6">${userData.nombre}</div>
          <div class="text-muted small">${userData.email}</div>
          <div class="mt-1">
            <span class="badge ${isAdmin ? 'bg-danger' : isPremium ? 'bg-warning text-dark' : 'bg-secondary'}">${isAdmin ? 'Acceso Administrador' : isPremium ? 'Acceso Premium' : 'Acceso Free'}</span>
          </div>
        </li>
        <li>
          <a class="dropdown-item py-2 d-flex align-items-center gap-2 text-dark" href="#" onclick="openAvatarCustomizerModal(event)">
            <i class="bi bi-person-badge fs-5 text-danger"></i>
            <span>Personalizar Avatar</span>
          </a>
        </li>
        ${isAdmin ? `
        <li>
          <a class="dropdown-item py-2 d-flex align-items-center gap-2 text-danger fw-bold" href="vehiculos.html" onclick="if(window.openAdminAddDiagramModal) { event.preventDefault(); openAdminAddDiagramModal(); }">
            <i class="bi bi-cloud-arrow-up-fill fs-5"></i>
            <span>Subir Diagrama (Admin)</span>
          </a>
        </li>
        ` : ''}
        <li><hr class="dropdown-divider my-1"></li>
        <li>
          <a class="dropdown-item py-2 d-flex align-items-center gap-2 text-danger" href="#" onclick="logoutUser(event)">
            <i class="bi bi-box-arrow-right fs-5"></i>
            <span>Cerrar Sesión</span>
          </a>
        </li>
      </ul>
    </div>
  `;

  // Initialize Real-time Notification Listener
  initRealtimeDiagramNotifications();

  // Dynamic Header Greeting Update
  const greetingEl = document.querySelector('.header-greeting');
  if (greetingEl) {
    greetingEl.textContent = greetingText;
  }
}

// Render User Header UI when Logged Out
function renderLoggedOutHeaderUI() {
  const profileSection = document.querySelector('.user-profile-section');
  if (!profileSection) return;

  profileSection.innerHTML = `
    <div class="d-flex align-items-center gap-2">
      <a href="login.html" class="btn btn-outline-danger btn-sm px-3 fw-semibold">
        <i class="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión
      </a>
      <a href="registro.html" class="btn btn-danger btn-sm px-3 fw-semibold">
        <i class="bi bi-person-plus-fill me-1"></i> Registrarse
      </a>
    </div>
  `;

  const greetingEl = document.querySelector('.header-greeting');
  if (greetingEl) {
    greetingEl.textContent = 'BIENVENIDO AL SISTEMA';
  }
}

// Update bottom footer bar status dynamically
function updateStatusFooterUI(userData) {
  const userTypeStatus = document.querySelector('.dark-status-bar .status-value');
  if (userTypeStatus) {
    if (userData) {
      const isAdmin = (userData.email === 'prueba@probak.com');
      const isPremium = !!userData.esPremium;
      if (isAdmin) {
        userTypeStatus.textContent = 'Administrador (Premium)';
        userTypeStatus.className = 'status-value text-success fw-bold';
      } else if (isPremium) {
        userTypeStatus.textContent = 'Premium';
        userTypeStatus.className = 'status-value text-success fw-bold';
      } else {
        userTypeStatus.textContent = 'Free';
        userTypeStatus.className = 'status-value text-info fw-bold';
      }
    } else {
      userTypeStatus.textContent = 'Invitado (Sin Sesión)';
      userTypeStatus.className = 'status-value text-muted';
    }
  }
}

// Global Auth Action Functions

// 1. Login User Function
window.loginUser = async function(identifier, password) {
  ensureFirebaseInitialized();
  if (typeof firebase === 'undefined' || typeof firebase.auth !== 'function') {
    throw new Error('El servicio de autenticación no está disponible.');
  }

  let email = identifier ? identifier.trim() : '';
  const db = firebase.firestore();

  // Resolve username to email if identifier does not contain '@'
  if (email && !email.includes('@')) {
    try {
      const snap = await db.collection('usuarios').where('nombre', '==', email).get();
      if (!snap.empty) {
        email = snap.docs[0].data().email || email;
      }
    } catch (e) {
      console.warn('Nota: No se pudo resolver nombre de usuario sin previa sesión:', e);
    }
  }

  const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
  return userCredential.user;
};

// 2. Register User Function (Immediate Free Account Creation)
window.registerUser = async function(nombre, email, password) {
  ensureFirebaseInitialized();
  if (typeof firebase === 'undefined' || typeof firebase.auth !== 'function') {
    throw new Error('El servicio de autenticación no está disponible.');
  }

  const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  await user.updateProfile({
    displayName: nombre
  });

  try {
    const db = firebase.firestore();
    await db.collection('usuarios').doc(user.uid).set({
      nombre: nombre,
      email: email,
      esPremium: (email === 'prueba@probak.com'),
      aprobado: true,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.warn('No se pudo escribir en Firestore (Reglas de Firestore), cuenta creada en Auth:', err);
  }

  return user;
};

// 3. Logout User Function
window.logoutUser = async function(e) {
  if (e) e.preventDefault();
  ensureFirebaseInitialized();
  try {
    localStorage.removeItem('probaktronic_cached_user');
    await firebase.auth().signOut();
    showAuthToast('Sesión cerrada correctamente.', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
  }
};

// --- AVATAR CUSTOMIZER MODAL SYSTEM ---

let selectedAvatarColor = '#D32F2F';
let selectedAvatarIcon = 'bi-person-fill';
let selectedAvatarPhoto = '';
let selectedAvatarSvg = '';

window.openAvatarCustomizerModal = function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const user = window.probaktronicCurrentUser;
  if (!user) {
    showAuthToast('Inicie sesión para personalizar su avatar', 'warning');
    return;
  }

  selectedAvatarColor = user.avatarColor || '#D32F2F';
  selectedAvatarIcon = user.avatarIcon || 'bi-person-fill';
  selectedAvatarPhoto = user.avatarPhotoURL || '';
  selectedAvatarSvg = user.avatarSvg || '';

  updateAvatarPreview();

  const modalEl = document.getElementById('avatarCustomizerModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }
};

function injectAvatarModal() {
  if (document.getElementById('avatarCustomizerModal')) return;

  const brandSvgs = [
    { name: 'Toyota', file: 'ico_logo_toyota.svg' },
    { name: 'Nissan', file: 'ico_logo_nissan.svg' },
    { name: 'Ford', file: 'ico_logo_ford.svg' },
    { name: 'Volkswagen', file: 'ico_logo_volkswagen.svg' },
    { name: 'BMW', file: 'ico_logo_bmw.svg' },
    { name: 'Audi', file: 'ico_logo_audi.svg' },
    { name: 'Mercedes', file: 'ico_logo_mercedes_benz.svg' },
    { name: 'Chevrolet/GMC', file: 'ico_logo_gmc.svg' },
    { name: 'Honda', file: 'ico_logo_honda.svg' },
    { name: 'Hyundai', file: 'ico_logo_hyundai.svg' },
    { name: 'Kia', file: 'ico_logo_kia.svg' },
    { name: 'Mazda', file: 'ico_logo_mazda.svg' },
    { name: 'Mitsubishi', file: 'ico_logo_mitsubishi.svg' },
    { name: 'Peugeot', file: 'ico_logo_peugeot.svg' },
    { name: 'Porsche', file: 'ico_logo_porsche.svg' },
    { name: 'Renault', file: 'ico_logo_renault.svg' },
    { name: 'Subaru', file: 'ico_logo_subaru.svg' },
    { name: 'Suzuki', file: 'ico_logo_suzuki.svg' },
    { name: 'Citroen', file: 'ico_logo_citroen.svg' },
    { name: 'Fiat', file: 'ico_logo_fiat.svg' }
  ];

  const brandButtonsHtml = brandSvgs.map(b => `
    <button type="button" class="btn btn-outline-light border btn-svg-choice p-1 bg-white" data-svg="imagenes svg/${b.file}" title="${b.name}" style="width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
      <img src="imagenes svg/${b.file}" alt="${b.name}" style="max-width: 28px; max-height: 28px; object-fit: contain;">
    </button>
  `).join('');

  const modalHtml = `
    <div class="modal fade" id="avatarCustomizerModal" tabindex="-1" aria-labelledby="avatarCustomizerModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden;">
          <div class="modal-header bg-dark text-white border-0 py-3">
            <h5 class="modal-title font-rajdhani fw-bold d-flex align-items-center gap-2" id="avatarCustomizerModalLabel">
              <i class="bi bi-person-badge text-danger fs-4"></i> PERSONALIZAR AVATAR
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4" style="max-height: 80vh; overflow-y: auto;">
            
            <!-- Live Preview -->
            <div class="text-center mb-4">
              <div id="avatarLivePreview" class="mx-auto shadow-sm" style="width: 90px; height: 90px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2.5rem; font-weight: bold; border: 3px solid #E2E8F0; overflow: hidden;">
                <i class="bi bi-person-fill"></i>
              </div>
              <div class="small text-muted mt-2 fw-semibold">Vista previa en tiempo real</div>
            </div>

            <!-- Color Palette Selector -->
            <div class="mb-4">
              <label class="form-label font-rajdhani fw-bold text-dark mb-2">1. Color de Fondo</label>
              <div class="d-flex align-items-center justify-content-center gap-2 flex-wrap" id="colorPaletteContainer">
                <button type="button" class="btn-color-swatch border-0 rounded-circle" data-color="#D32F2F" style="width: 36px; height: 36px; background-color: #D32F2F;" title="Rojo Probaktronic"></button>
                <button type="button" class="btn-color-swatch border-0 rounded-circle" data-color="#1E293B" style="width: 36px; height: 36px; background-color: #1E293B;" title="Azul Noche"></button>
                <button type="button" class="btn-color-swatch border-0 rounded-circle" data-color="#0284C7" style="width: 36px; height: 36px; background-color: #0284C7;" title="Azul Técnico"></button>
                <button type="button" class="btn-color-swatch border-0 rounded-circle" data-color="#059669" style="width: 36px; height: 36px; background-color: #059669;" title="Verde Esmeralda"></button>
                <button type="button" class="btn-color-swatch border-0 rounded-circle" data-color="#7C3AED" style="width: 36px; height: 36px; background-color: #7C3AED;" title="Púrpura"></button>
                <button type="button" class="btn-color-swatch border-0 rounded-circle" data-color="#EA580C" style="width: 36px; height: 36px; background-color: #EA580C;" title="Naranja"></button>
                <button type="button" class="btn-color-swatch border-0 rounded-circle" data-color="#0F766E" style="width: 36px; height: 36px; background-color: #0F766E;" title="Teal"></button>
              </div>
            </div>

            <!-- Icon Selector Grid -->
            <div class="mb-4">
              <label class="form-label font-rajdhani fw-bold text-dark mb-2">2. Iconos Técnicos y Diagnóstico (Bootstrap Icons)</label>
              <div class="d-flex align-items-center justify-content-center gap-2 flex-wrap" id="iconGridContainer">
                <button type="button" class="btn btn-outline-secondary btn-icon-choice p-2" data-icon="bi-person-fill" title="Usuario"><i class="bi bi-person-fill fs-4"></i></button>
                <button type="button" class="btn btn-outline-secondary btn-icon-choice p-2" data-icon="bi-cpu-fill" title="ECU / Chip"><i class="bi bi-cpu-fill fs-4"></i></button>
                <button type="button" class="btn btn-outline-secondary btn-icon-choice p-2" data-icon="bi-tools" title="Herramientas"><i class="bi bi-tools fs-4"></i></button>
                <button type="button" class="btn btn-outline-secondary btn-icon-choice p-2" data-icon="bi-car-front-fill" title="Vehículo"><i class="bi bi-car-front-fill fs-4"></i></button>
                <button type="button" class="btn btn-outline-secondary btn-icon-choice p-2" data-icon="bi-speedometer2" title="Tablero / Scanner"><i class="bi bi-speedometer2 fs-4"></i></button>
                <button type="button" class="btn btn-outline-secondary btn-icon-choice p-2" data-icon="bi-activity" title="Osciloscopio / Señal"><i class="bi bi-activity fs-4"></i></button>
                <button type="button" class="btn btn-outline-secondary btn-icon-choice p-2" data-icon="bi-lightning-charge-fill" title="Voltaje / Chispa"><i class="bi bi-lightning-charge-fill fs-4"></i></button>
                <button type="button" class="btn btn-outline-secondary btn-icon-choice p-2" data-icon="bi-shield-check" title="Seguridad"><i class="bi bi-shield-check fs-4"></i></button>
                <button type="button" class="btn btn-outline-secondary btn-icon-choice p-2" data-icon="bi-motherboard" title="Tarjeta Electrónica"><i class="bi bi-motherboard fs-4"></i></button>
                <button type="button" class="btn btn-outline-secondary btn-icon-choice p-2" data-icon="bi-star-fill" title="Favorito"><i class="bi bi-star-fill fs-4"></i></button>
              </div>
            </div>

            <!-- Automotive Brand Vector SVG Section -->
            <div class="mb-4">
              <label class="form-label font-rajdhani fw-bold text-dark mb-2">3. Marcas Automotrices (Vectores SVG)</label>
              <div class="d-flex align-items-center justify-content-center gap-2 flex-wrap" id="svgBrandGridContainer">
                ${brandButtonsHtml}
              </div>
            </div>

            <!-- Upload Custom Image Input -->
            <div class="mb-2">
              <label for="avatarFileInput" class="form-label font-rajdhani fw-bold text-dark mb-1">4. O subir foto de perfil personalizada</label>
              <input type="file" class="form-control form-control-sm" id="avatarFileInput" accept="image/*">
              <div class="form-text text-muted" style="font-size: 0.75rem;">Soporta imágenes de computadora en formato PNG, JPG, WEBP.</div>
            </div>

          </div>
          <div class="modal-footer bg-light border-0 py-3 px-4 d-flex justify-content-between">
            <button type="button" class="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger rounded-pill px-4 fw-bold" onclick="saveAvatarPreferences()">
              <i class="bi bi-check-lg me-1"></i> Guardar Avatar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Setup Event Listeners for Modal
  const modalEl = document.getElementById('avatarCustomizerModal');
  if (!modalEl) return;

  // Color Swatches
  modalEl.querySelectorAll('.btn-color-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedAvatarColor = btn.dataset.color;
      updateAvatarPreview();
    });
  });

  // Icon Choices
  modalEl.querySelectorAll('.btn-icon-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedAvatarIcon = btn.dataset.icon;
      selectedAvatarSvg = '';
      selectedAvatarPhoto = '';
      updateAvatarPreview();
    });
  });

  // SVG Choices
  modalEl.querySelectorAll('.btn-svg-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedAvatarSvg = btn.dataset.svg;
      selectedAvatarPhoto = '';
      updateAvatarPreview();
    });
  });

  // File Upload Input
  const fileInput = document.getElementById('avatarFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          selectedAvatarPhoto = event.target.result;
          selectedAvatarSvg = '';
          updateAvatarPreview();
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function updateAvatarPreview() {
  const previewEl = document.getElementById('avatarLivePreview');
  if (!previewEl) return;

  previewEl.style.backgroundColor = selectedAvatarColor;

  if (selectedAvatarPhoto) {
    previewEl.innerHTML = `<img src="${selectedAvatarPhoto}" alt="Preview" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
  } else if (selectedAvatarSvg) {
    previewEl.innerHTML = `<img src="${selectedAvatarSvg}" alt="SVG Brand" style="width:65%; height:65%; object-fit:contain; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.2));">`;
  } else {
    previewEl.innerHTML = `<i class="bi ${selectedAvatarIcon}"></i>`;
  }
}

window.saveAvatarPreferences = async function() {
  const user = window.probaktronicCurrentUser;
  if (!user) return;

  user.avatarColor = selectedAvatarColor;
  user.avatarIcon = selectedAvatarIcon;
  user.avatarPhotoURL = selectedAvatarPhoto;
  user.avatarSvg = selectedAvatarSvg;

  // Save to Local Cache
  try {
    localStorage.setItem('probaktronic_cached_user', JSON.stringify(user));
  } catch (e) {}

  // Update DOM header instantly
  renderLoggedInHeaderUI(user);

  // Save to Firestore
  try {
    const db = firebase.firestore();
    await db.collection('usuarios').doc(user.uid).set({
      avatarColor: selectedAvatarColor,
      avatarIcon: selectedAvatarIcon,
      avatarPhotoURL: selectedAvatarPhoto,
      avatarSvg: selectedAvatarSvg
    }, { merge: true });

    showAuthToast('¡Avatar actualizado correctamente!', 'success');
  } catch (err) {
    console.warn('Nota: Avatar guardado en caché local:', err);
    showAuthToast('Avatar personalizado correctamente', 'info');
  }

  // Close Modal
  const modalEl = document.getElementById('avatarCustomizerModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();
  }
};

// Helper Notification Toast
function showAuthToast(message, type = 'info') {
  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast(message);
    return;
  }
  alert(message);
}

// --- REAL-TIME FIRESTORE DIAGRAM NOTIFICATIONS SYSTEM ---

let currentNotificationList = [];
let isInitialNotificationLoad = true;

function initRealtimeDiagramNotifications() {
  ensureFirebaseInitialized();
  if (typeof firebase === 'undefined' || !firebase.firestore) return;

  try {
    const db = firebase.firestore();

    // Listen in real-time to 'diagramas' collection
    db.collection('diagramas').onSnapshot((snapshot) => {
      const items = [];
      const currentIds = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data() || {};
        const docId = doc.id;
        currentIds.push(docId);
        items.push({
          id: docId,
          titulo: data.titulo || data.nombre || data.modelo || 'Nuevo Diagrama de Diagnóstico',
          marca: data.marca || 'Sistema Automotriz',
          tipo: data.tipo || 'Esquema / Pinout ECU',
          fecha: data.fechaRegistro ? data.fechaRegistro.toDate() : new Date()
        });
      });

      // Retrieve seen & read notification IDs from localStorage
      let seenIds = [];
      try {
        seenIds = JSON.parse(localStorage.getItem('probaktronic_seen_diagram_ids') || '[]');
      } catch (e) {}

      // On initial load, mark all existing diagram IDs as seen so NO toast pops up on page load/refresh
      if (isInitialNotificationLoad) {
        const allKnown = Array.from(new Set([...seenIds, ...currentIds]));
        try {
          localStorage.setItem('probaktronic_seen_diagram_ids', JSON.stringify(allKnown));
        } catch (e) {}
        isInitialNotificationLoad = false;
      } else {
        // Detect truly new diagram added in real time
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' && !seenIds.includes(change.doc.id)) {
            const addedData = change.doc.data() || {};
            const addedTitle = addedData.titulo || addedData.nombre || 'Nuevo Diagrama';
            showAuthToast(`🔔 ¡NUEVO DIAGRAMA DISPONIBLE! Se agregó: ${addedTitle}`, 'success');

            // Add to seen so it NEVER repeats
            seenIds.push(change.doc.id);
            try {
              localStorage.setItem('probaktronic_seen_diagram_ids', JSON.stringify(seenIds));
            } catch (e) {}
          }
        });
      }

      currentNotificationList = items;
      renderNotificationItemsUI(items);
    }, (err) => {
      console.warn('Listener de diagramas:', err);
    });
  } catch (err) {
    console.warn('Aviso en inicio de notificaciones:', err);
  }
}

function renderNotificationItemsUI(items) {
  const container = document.getElementById('notificationItemsContainer');
  const badgeDot = document.getElementById('notifBadgeDot');
  const badgeTotal = document.getElementById('notifTotalBadge');
  if (!container) return;

  // Retrieve read IDs from localStorage
  let readIds = [];
  try {
    readIds = JSON.parse(localStorage.getItem('probaktronic_read_diagram_ids') || '[]');
  } catch (e) {}

  // Filter only unread items
  const unreadItems = (items || []).filter(item => !readIds.includes(item.id));

  if (unreadItems.length === 0) {
    if (badgeDot) badgeDot.classList.add('d-none');
    if (badgeTotal) badgeTotal.textContent = '0 Nuevas';

    container.innerHTML = `
      <li class="px-3 py-4 text-center text-muted small bg-light">
        <i class="bi bi-check2-all text-success fs-3 d-block mb-1"></i>
        <div class="fw-bold text-dark">No hay notificaciones pendientes</div>
        <div class="text-muted" style="font-size: 0.75rem;">Estás al día con todos los diagramas del sistema.</div>
      </li>
    `;
    return;
  }

  // Show red dot badge and count
  if (badgeDot) badgeDot.classList.remove('d-none');
  if (badgeTotal) badgeTotal.textContent = `${unreadItems.length} Nuevas`;

  const itemsHtml = unreadItems.map(item => `
    <li class="px-3 py-2 border-bottom text-decoration-none d-flex align-items-start gap-2 dropdown-item bg-white" style="white-space: normal; cursor: pointer;" onclick="window.location.href='vehiculos.html'">
      <div class="bg-danger-subtle text-danger rounded-circle p-2 d-flex align-items-center justify-content-center mt-1" style="width: 34px; height: 34px; flex-shrink: 0;">
        <i class="bi bi-file-earmark-code-fill fs-6"></i>
      </div>
      <div class="flex-grow-1">
        <div class="d-flex align-items-center justify-content-between">
          <span class="fw-bold text-dark small">${item.titulo}</span>
          <span class="badge bg-danger" style="font-size: 0.6rem;">NUEVO</span>
        </div>
        <div class="text-muted" style="font-size: 0.75rem;">${item.marca} • ${item.tipo}</div>
      </div>
    </li>
  `).join('');

  container.innerHTML = itemsHtml;
}

window.markNotificationsAsRead = function() {
  const badgeDot = document.getElementById('notifBadgeDot');
  const badgeTotal = document.getElementById('notifTotalBadge');
  if (badgeDot) badgeDot.classList.add('d-none');
  if (badgeTotal) badgeTotal.textContent = '0 Nuevas';

  // Mark all current notification IDs as read
  const allIds = currentNotificationList.map(item => item.id);
  try {
    localStorage.setItem('probaktronic_read_diagram_ids', JSON.stringify(allIds));
  } catch (e) {}

  // Update dropdown content to "all caught up"
  const container = document.getElementById('notificationItemsContainer');
  if (container) {
    container.innerHTML = `
      <li class="px-3 py-4 text-center text-muted small bg-light">
        <i class="bi bi-check2-all text-success fs-3 d-block mb-1"></i>
        <div class="fw-bold text-dark">No hay notificaciones pendientes</div>
        <div class="text-muted" style="font-size: 0.75rem;">Estás al día con todos los diagramas del sistema.</div>
      </li>
    `;
  }
};
