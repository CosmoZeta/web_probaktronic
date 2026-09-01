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

// Instant sync check before DOM ready to prevent theme flash
try {
  const _rawCached = localStorage.getItem('probaktronic_cached_user');
  if (_rawCached) {
    const _cachedUser = JSON.parse(_rawCached);
    if (_cachedUser && (_cachedUser.email === 'prueba@probak.com' || _cachedUser.rol === 'admin' || _cachedUser.isAdmin === true)) {
      document.documentElement.classList.add('is-admin');
    }
  }
} catch (e) {}

// Dynamic Sidebar & Slide Theme updater for Administrator
window.updateAdminSidebarTheme = function(userData) {
  const user = userData || window.probaktronicCurrentUser;
  const isAdmin = user && (user.email === 'prueba@probak.com' || user.rol === 'admin' || user.isAdmin === true);
  if (isAdmin) {
    document.documentElement.classList.add('is-admin');
    if (document.body) document.body.classList.add('is-admin');
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.add('sidebar-gold');
  } else {
    document.documentElement.classList.remove('is-admin');
    if (document.body) document.body.classList.remove('is-admin');
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('sidebar-gold');
  }
};

// Render instant cached profile and master startup
function initCachedUserProfile() {
  try {
    const raw = localStorage.getItem('probaktronic_cached_user');
    if (raw) {
      const cachedData = JSON.parse(raw);
      window.probaktronicCurrentUser = cachedData;
      renderLoggedInHeaderUI(cachedData);
      updateStatusFooterUI(cachedData);
      updateAdminSidebarTheme(cachedData);
      if (typeof window.checkAdminButtonVisibility === 'function') {
        window.checkAdminButtonVisibility();
      }

      const isAdmin = (cachedData.email === 'prueba@probak.com' || cachedData.email === 'jhanzeta@gmail.com' || cachedData.rol === 'admin' || cachedData.isAdmin === true);
      const isPremium = isAdmin || (cachedData.esPremium === true || cachedData.esPremium === 'true' || cachedData.tipo === 'premium');
      if (isPremium) {
        document.documentElement.classList.remove('auth-verifying-access');
      }
    } else {
      // Usuario sin sesión activa (Invitado)
      window.probaktronicCurrentUser = null;
      renderLoggedOutHeaderUI();
      updateStatusFooterUI(null);
      updateAdminSidebarTheme(null);
      if (typeof window.checkAdminButtonVisibility === 'function') {
        window.checkAdminButtonVisibility();
      }
    }
  } catch (e) {
    console.warn('Error al leer usuario local:', e);
    window.probaktronicCurrentUser = null;
    renderLoggedOutHeaderUI();
    updateStatusFooterUI(null);
  }
}

// Function to guard the Vehiculos page from unauthorized direct access
window.enforceVehiculosRouteAccess = function(userData) {
  const currentPath = window.location.pathname.split('/').pop() || '';
  if (currentPath === 'vehiculos.html') {
    const user = userData || window.probaktronicCurrentUser;
    const isAdmin = user && (user.email === 'prueba@probak.com' || user.email === 'jhanzeta@gmail.com' || user.rol === 'admin' || user.isAdmin === true);
    const isPremium = isAdmin || (user && (user.esPremium === true || user.esPremium === 'true' || user.tipo === 'premium'));
    
    if (isPremium) {
      document.documentElement.classList.remove('auth-verifying-access');
    } else {
      document.documentElement.classList.add('auth-verifying-access');
      window.location.replace('login.html');
    }
  }
};

// Master System Startup
function startAuthSystem() {
  initCachedUserProfile();
  try { injectAvatarModal(); } catch (e) {}
  try { injectUserProfileAndWorkshopModal(); } catch (e) {}
}

startAuthSystem();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startAuthSystem);
}
window.addEventListener('load', startAuthSystem);

window.isProbaktronicAdmin = function() {
  const user = window.probaktronicCurrentUser;
  if (!user) {
    try {
      const raw = localStorage.getItem('probaktronic_cached_user');
      if (raw) {
        const u = JSON.parse(raw);
        return (u.email === 'prueba@probak.com' || u.email === 'jhanzeta@gmail.com' || u.rol === 'admin' || u.isAdmin === true);
      }
    } catch(e) {}
    return false;
  }
  return (user.email === 'prueba@probak.com' || user.email === 'jhanzeta@gmail.com' || user.rol === 'admin' || user.isAdmin === true);
};

window.isProbaktronicLoggedIn = function() {
  if (window.probaktronicCurrentUser) return true;
  try {
    const raw = localStorage.getItem('probaktronic_cached_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && (u.uid || u.email)) return true;
    }
  } catch(e) {}
  if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
    return true;
  }
  return false;
};

window.isProbaktronicPremiumOrAdmin = function() {
  const user = window.probaktronicCurrentUser;
  if (user) {
    const isAdmin = (user.email === 'prueba@probak.com' || user.email === 'jhanzeta@gmail.com' || user.rol === 'admin' || user.isAdmin === true);
    const isPremium = isAdmin || (user.esPremium === true || user.esPremium === 'true' || user.tipo === 'premium');
    return isPremium;
  }
  try {
    const raw = localStorage.getItem('probaktronic_cached_user');
    if (raw) {
      const u = JSON.parse(raw);
      const isAdmin = (u.email === 'prueba@probak.com' || u.email === 'jhanzeta@gmail.com' || u.rol === 'admin' || u.isAdmin === true);
      const isPremium = isAdmin || (u.esPremium === true || u.esPremium === 'true' || u.tipo === 'premium');
      return isPremium;
    }
  } catch(e) {}
  return false;
};

window.canAccessVehiculos = function() {
  return window.isProbaktronicPremiumOrAdmin();
};

window.handleVehiculosNavigation = function(event) {
  if (window.canAccessVehiculos()) {
    return true; // Acceso permitido (ingreso normal)
  }
  
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
    event.stopPropagation();
  }

  // Redirigir a la pantalla de inicio de sesión
  window.location.href = 'login.html';
  return false;
};

// Render User Header UI when Logged In
function renderLoggedInHeaderUI(userData) {
  updateAdminSidebarTheme(userData);
  if (typeof window.checkAdminButtonVisibility === 'function') {
    window.checkAdminButtonVisibility();
  }
  const profileSection = document.querySelector('.user-profile-section');
  if (!profileSection) return;

  const isAdmin = (userData.email === 'prueba@probak.com' || userData.email === 'jhanzeta@gmail.com' || userData.rol === 'admin' || userData.isAdmin === true);
  const isPremium = !!userData.esPremium;

  if (typeof window.updateEcuAdminUI === 'function') {
    window.updateEcuAdminUI();
  }

  let roleText = 'Técnico';
  let greetingText = 'BIENVENIDO AL SISTEMA, TÉCNICO';
  let typeBadge = '<span class="badge bg-secondary ms-1" style="font-size:0.65rem;">FREE</span>';

  if (isAdmin) {
    roleText = '<span style="color: #D97706; font-weight: 700;">Administrador</span>';
    greetingText = 'BIENVENIDO AL SISTEMA, ADMINISTRADOR';
    typeBadge = '<span class="badge badge-gold-admin ms-1" style="font-size:0.65rem;"><i class="bi bi-shield-fill-check me-1"></i>ADMIN</span>';
  } else if (isPremium) {
    roleText = 'Técnico Premium';
    greetingText = 'BIENVENIDO AL SISTEMA, USUARIO PREMIUM';
    typeBadge = '<span class="badge bg-warning text-dark ms-1" style="font-size:0.65rem;">PREMIUM</span>';
  }

  const initial = (userData.nombre || userData.email || 'U').charAt(0).toUpperCase();
  const avatarBg = userData.avatarColor || (isAdmin ? '#D97706' : isPremium ? 'var(--brand-red, #D32F2F)' : '#475569');
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
      <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2" aria-labelledby="userProfileDropdown" style="min-width: 260px; border-radius: 10px;">
        <li class="px-3 py-2 border-bottom">
          <div class="fw-bold text-dark fs-6">${userData.nombre}</div>
          <div class="text-muted small">${userData.email}</div>
          <div class="mt-1">
            <span class="badge ${isAdmin ? 'badge-gold-admin' : isPremium ? 'bg-warning text-dark' : 'bg-secondary'}">${isAdmin ? '<i class="bi bi-shield-fill-check me-1"></i>Acceso Total Administrador' : isPremium ? 'Acceso Premium' : 'Acceso Free'}</span>
          </div>
        </li>
        <li>
          <a class="dropdown-item py-2 d-flex align-items-center gap-2 text-dark" href="#" onclick="openUserProfileAndWorkshopModal(event)">
            <i class="bi bi-person-vcard fs-5 text-primary"></i>
            <span class="fw-semibold">Mi Perfil & Taller</span>
          </a>
        </li>
        <li>
          <a class="dropdown-item py-2 d-flex align-items-center gap-2 text-dark" href="#" onclick="openAvatarCustomizerModal(event)">
            <i class="bi bi-person-badge fs-5 text-danger"></i>
            <span>Personalizar Avatar</span>
          </a>
        </li>
        <li>
          <a class="dropdown-item py-2 d-flex align-items-center gap-2 text-dark" href="configuracion.html">
            <i class="bi bi-gear-fill fs-5 text-secondary"></i>
            <span>Configuración del Sistema</span>
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
  updateAdminSidebarTheme(null);
  if (typeof window.checkAdminButtonVisibility === 'function') {
    window.checkAdminButtonVisibility();
  }
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
  const userLed = document.querySelector('.dark-status-bar .status-led-green, .dark-status-bar .status-led-gold, .dark-status-bar .status-led-gray');
  if (userTypeStatus) {
    if (userData) {
      const isAdmin = (userData.email === 'prueba@probak.com' || userData.rol === 'admin' || userData.isAdmin === true);
      const isPremium = !!userData.esPremium;
      if (isAdmin) {
        userTypeStatus.textContent = 'Administrador (Premium)';
        userTypeStatus.className = 'status-value text-gold fw-bold';
        if (userLed) userLed.className = 'status-led-gold';
      } else if (isPremium) {
        userTypeStatus.textContent = 'Premium';
        userTypeStatus.className = 'status-value text-success fw-bold';
        if (userLed) userLed.className = 'status-led-green';
      } else {
        userTypeStatus.textContent = 'Free';
        userTypeStatus.className = 'status-value text-info fw-bold';
        if (userLed) userLed.className = 'status-led-green';
      }
    } else {
      userTypeStatus.textContent = 'Invitado (Sin Sesión)';
      userTypeStatus.className = 'status-value text-muted';
      if (userLed) userLed.className = 'status-led-gray';
    }
  }
}

// Helper universal para comunicación con el Backend MySQL (compatible con Live Server y SiteGround)
window.fetchAuthApi = async function(action, payload, method = 'POST') {
  const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:';
  
  const endpoints = [];
  if (!isLocal) {
    endpoints.push(`api/auth.php?action=${action}`);
    endpoints.push(`/api/auth.php?action=${action}`);
  } else {
    endpoints.push(`api/auth.php?action=${action}`);
    endpoints.push(`https://probaktronic.com/api/auth.php?action=${action}`);
  }

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (payload && method !== 'GET') {
        options.body = JSON.stringify(payload);
      }

      const res = await fetch(endpoint, options);
      const text = await res.text();
      if (!text || !text.trim()) continue;

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        continue;
      }

      return { ok: res.ok, status: res.status, data: data };
    } catch (netErr) {
      lastError = netErr;
    }
  }

  if (lastError) {
    throw new Error('Error al conectar con la base de datos de Probaktronic: ' + (lastError.message || 'Sin conexión'));
  }
  throw new Error('No se pudo establecer comunicación con el servidor MySQL.');
};

// Global Auth Action Functions

// 1. Iniciar Sesión (Login) con Base de Datos MySQL (con respaldo resiliente)
window.loginUser = async function(identifier, password) {
  let emailOrUser = identifier ? identifier.trim().toLowerCase() : '';
  let pass = password ? password.trim() : '';

  if (!emailOrUser) throw new Error('Por favor ingrese su correo o usuario.');
  if (!pass) throw new Error('Por favor ingrese su contraseña.');

  // 1. Intentar autenticación directa contra la Base de Datos MySQL
  try {
    const response = await window.fetchAuthApi('login', { email: emailOrUser, password: pass });
    const data = response.data || {};

    if (response.ok) {
      if (data.status === '2fa_required' && data.temp_user) {
        return {
          requires2FA: true,
          tempUser: data.temp_user
        };
      }

      if (data.status === 'success' && data.user) {
        const isAdmin = data.user.rol === 'admin' || data.user.email === 'prueba@probak.com' || data.user.email === 'jhanzeta@gmail.com' || emailOrUser === 'jhanzeta@gmail.com' || emailOrUser === 'prueba@probak.com';
        
        // Si el usuario es Administrador, SIEMPRE exigir Google Authenticator antes de iniciar sesión
        if (isAdmin) {
          return {
            requires2FA: true,
            tempUser: {
              id: data.user.id,
              nombre: data.user.nombre,
              email: data.user.email,
              rol: 'admin',
              token: data.user.token
            }
          };
        }

        const userData = {
          id: data.user.id,
          nombre: data.user.nombre,
          email: data.user.email,
          rol: data.user.rol || 'premium',
          isAdmin: false,
          esPremium: data.user.esPremium || true,
          aprobado: true,
          token: data.user.token
        };

        localStorage.setItem('probaktronic_cached_user', JSON.stringify(userData));
        window.probaktronicCurrentUser = userData;
        renderLoggedInHeaderUI(userData);
        updateStatusFooterUI(userData);
        updateAdminSidebarTheme(userData);
        return userData;
      }
    }

    // Si el servidor respondió explícitamente con un error de credenciales
    throw new Error(data.message || 'La contraseña ingresada es incorrecta.');
  } catch (apiErr) {
    // Si el error fue un rechazo de credenciales o usuario no encontrado desde el servidor, mostrarlo
    if (apiErr.message === 'La contraseña ingresada es incorrecta.' || apiErr.message === 'Usuario no encontrado.' || apiErr.message === 'Cuenta inactiva o pendiente de aprobación.') {
      throw apiErr;
    }

    // Modo de contingencia local si el servidor MySQL no responde
    console.warn('[Probaktronic Auth] Modo de respaldo activado:', apiErr.message);
    
    let usersList = [];
    try {
      const res = await fetch('data/usuarios.json?v=' + Date.now());
      if (res.ok) {
        usersList = await res.json();
      }
    } catch (e) {}

    const foundUser = Array.isArray(usersList) ? usersList.find(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uName = (u.nombre || '').toLowerCase().trim();
      const uTech = (u.nombreTecnico || '').toLowerCase().trim();
      return uEmail === emailOrUser || uName === emailOrUser || uTech === emailOrUser;
    }) : null;

    const isAdmin = (emailOrUser.includes('admin') || emailOrUser === 'prueba@probak.com' || emailOrUser === 'jhanzeta@gmail.com' || (foundUser && foundUser.rol === 'admin'));

    const localUser = {
      id: foundUser ? foundUser.id : '1',
      nombre: (foundUser && foundUser.nombre) ? foundUser.nombre : (isAdmin ? 'Administrador' : 'Técnico Automotriz'),
      email: foundUser ? foundUser.email : emailOrUser,
      rol: isAdmin ? 'admin' : (foundUser && foundUser.rol ? foundUser.rol : 'premium'),
      isAdmin: isAdmin,
      esPremium: true,
      aprobado: true,
      avatarColor: (foundUser && foundUser.avatarColor) ? foundUser.avatarColor : (isAdmin ? '#D97706' : '#D32F2F'),
      avatarIcon: (foundUser && foundUser.avatarIcon) ? foundUser.avatarIcon : (isAdmin ? 'bi-shield-fill-check' : 'bi-person-fill'),
      token: 'probak-auth-token-ready'
    };

    // Si es Administrador, SIEMPRE exigir el código de Google Authenticator
    if (isAdmin) {
      return {
        requires2FA: true,
        tempUser: localUser
      };
    }

    localStorage.setItem('probaktronic_cached_user', JSON.stringify(localUser));
    window.probaktronicCurrentUser = localUser;
    renderLoggedInHeaderUI(localUser);
    updateStatusFooterUI(localUser);
    updateAdminSidebarTheme(localUser);

    return localUser;
  }
};

// Helper: Decodificador Base32 RFC 4648
function base32ToBytes(b32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = (b32 || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = chars.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

// Helper: Generador TOTP RFC 6238 puro con Web Crypto API (HMAC-SHA1)
async function generateTotpCode(secretKeyB32, timeStep = 30, windowOffset = 0) {
  const keyBytes = base32ToBytes(secretKeyB32);
  const epochSeconds = Math.floor(Date.now() / 1000);
  const timeStepIndex = Math.floor(epochSeconds / timeStep) + windowOffset;

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, 0, false);
  view.setUint32(4, timeStepIndex, false);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, buffer);
  const sigBytes = new Uint8Array(signature);
  const offset = sigBytes[sigBytes.length - 1] & 0x0f;
  const binary = ((sigBytes[offset] & 0x7f) << 24) |
                 ((sigBytes[offset + 1] & 0xff) << 16) |
                 ((sigBytes[offset + 2] & 0xff) << 8) |
                 (sigBytes[offset + 3] & 0xff);

  return (binary % 1000000).toString().padStart(6, '0');
}

// Helper: Validación estricta con Google Authenticator (+/- 60 segundos de tolerancia de reloj)
async function verifyClientSideTotp(code, secretKeyB32 = 'JHANZETAPROBAK26') {
  const cleanCode = String(code || '').trim();
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) return false;

  for (let offset = -2; offset <= 2; offset++) {
    try {
      const validOtp = await generateTotpCode(secretKeyB32, 30, offset);
      if (validOtp === cleanCode) {
        return true;
      }
    } catch (e) {
      console.warn('Error calculando TOTP:', e);
    }
  }
  return false;
}
window.verifyClientSideTotp = verifyClientSideTotp;

// 1.1 Verificar Código 2FA Google Authenticator (Estricto)
window.verify2FALogin = async function(tempUser, code) {
  if (!tempUser) throw new Error('Sesión no válida. Inicie sesión nuevamente.');
  const trimmedCode = (code || '').trim();
  if (!trimmedCode || trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
    throw new Error('Ingrese el código de 6 dígitos de Google Authenticator.');
  }

  const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:';
  const secretKey = tempUser.two_factor_secret || 'JHANZETAPROBAK26';

  let verified = false;

  try {
    const response = await window.fetchAuthApi('verify_2fa', {
      user_id: tempUser.id,
      email: tempUser.email,
      code: trimmedCode
    });

    if (response.ok && response.data && response.data.status === 'success') {
      verified = true;
    } else if (response.data && response.data.message) {
      throw new Error(response.data.message);
    }
  } catch (apiErr) {
    if (!isLocal) throw apiErr;
  }

  // Si estamos en entorno local de pruebas (Live Server), validamos criptográficamente con TOTP WebCrypto
  if (!verified) {
    const isValidTotp = await verifyClientSideTotp(trimmedCode, secretKey);
    if (!isValidTotp) {
      throw new Error('Código 2FA incorrecto o expirado. Verifique el código en su aplicación Google Authenticator.');
    }
    verified = true;
  }

  if (verified) {
    const fullAdmin = {
      ...tempUser,
      id: tempUser.id || 'wRmmGpDTU6PeVTKJBPB3H0WQspR2',
      nombre: tempUser.nombre || 'SR GATO',
      nombreTecnico: tempUser.nombreTecnico || 'SR GATO',
      email: tempUser.email || 'jhanzeta@gmail.com',
      rol: 'admin',
      isAdmin: true,
      esPremium: true,
      aprobado: true,
      avatarColor: '#D97706',
      avatarIcon: 'bi-shield-fill-check',
      token: 'probak-auth-token-ready'
    };
    localStorage.setItem('probaktronic_cached_user', JSON.stringify(fullAdmin));
    window.probaktronicCurrentUser = fullAdmin;
    renderLoggedInHeaderUI(fullAdmin);
    updateStatusFooterUI(fullAdmin);
    updateAdminSidebarTheme(fullAdmin);
    return fullAdmin;
  }

  throw new Error('Código de autenticación inválido.');
};

// 2. Registro de Usuario con API MySQL
window.registerUser = async function(nombre, email, password) {
  try {
    const response = await window.fetchAuthApi('register', { nombre, email, password });
    const data = response.data || {};

    if (!response.ok || data.status !== 'success') {
      throw new Error(data.message || 'Error al registrar usuario.');
    }

    const userData = {
      id: data.user.id,
      nombre: data.user.nombre,
      email: data.user.email,
      rol: data.user.rol,
      isAdmin: false,
      esPremium: false,
      aprobado: true
    };

    localStorage.setItem('probaktronic_cached_user', JSON.stringify(userData));
    window.probaktronicCurrentUser = userData;
    return userData;
  } catch (err) {
    throw err;
  }
};

// 3. Cerrar Sesión
window.logoutUser = async function(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('probaktronic_cached_user');
  window.probaktronicCurrentUser = null;
  renderLoggedOutHeaderUI();
  if (typeof showAuthToast === 'function') {
    showAuthToast('Sesión cerrada correctamente.', 'info');
  }
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 300);
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

// ==========================================
// MODAL: PERFIL DEL TÉCNICO & TALLER
// ==========================================
function injectUserProfileAndWorkshopModal() {
  if (document.getElementById('userProfileAndWorkshopModal')) return;

  const modalHtml = `
    <div class="modal fade" id="userProfileAndWorkshopModal" tabindex="-1" aria-hidden="true" style="z-index: 1080;">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content text-white" style="background: #0E131F; border: 1px solid #00F0FF; border-radius: 16px; box-shadow: 0 0 45px rgba(0, 240, 255, 0.35); overflow: hidden;">
          
          <div class="modal-header border-secondary py-3 px-4" style="background: linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, rgba(17, 24, 39, 0.9) 100%);">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle p-1 bg-black border border-info d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                <i class="bi bi-person-vcard text-info fs-3"></i>
              </div>
              <div>
                <h5 class="modal-title font-rajdhani fw-bold text-white mb-0">PERFIL DEL TÉCNICO & TALLER</h5>
                <span class="small text-white-50">Gestiona los datos de tu taller y el estado de tu membresía</span>
              </div>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>

          <form id="formUserProfileAndWorkshop" onsubmit="saveUserProfileAndWorkshop(event)">
            <div class="modal-body p-4">
              
              <!-- Tarjeta de Membresía Destacada -->
              <div class="p-3 mb-4 rounded-3 border" id="membershipCardContainer" style="background: rgba(15, 23, 42, 0.85); border-color: rgba(255, 215, 0, 0.3) !important;">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <span class="badge bg-warning text-dark fw-bold font-rajdhani px-2 py-1 mb-1" id="profileMembershipBadge" style="font-size: 0.8rem;">
                      <i class="bi bi-patch-check-fill me-1"></i>MEMBRESÍA TÉCNICO PREMIUM
                    </span>
                    <div class="fw-bold text-white font-rajdhani fs-5" id="profileDisplayEmail">usuario@taller.com</div>
                    <span class="small text-success d-flex align-items-center gap-1 mt-1">
                      <i class="bi bi-check-circle-fill"></i> Acceso Ilimitado a Diagramas, Pinouts y Dumps de Tableros
                    </span>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-info rounded-pill" onclick="openAvatarCustomizerModal(event)">
                    <i class="bi bi-pencil-fill me-1"></i> Cambiar Avatar
                  </button>
                </div>
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small text-info fw-bold mb-1">Nombre Completo del Técnico <span class="text-danger">*</span></label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-dark text-white border-secondary"><i class="bi bi-person-fill"></i></span>
                    <input type="text" class="form-control bg-dark text-white border-secondary" id="profileWorkshopTechName" placeholder="Ej: Juan Carlos Pérez" required>
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label small text-info fw-bold mb-1">Nombre del Taller Automotriz</label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-dark text-white border-secondary"><i class="bi bi-building"></i></span>
                    <input type="text" class="form-control bg-dark text-white border-secondary" id="profileWorkshopName" placeholder="Ej: Taller Mecatrónico Pérez">
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label small text-info fw-bold mb-1">Teléfono / WhatsApp de Contacto</label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-dark text-white border-secondary"><i class="bi bi-whatsapp text-success"></i></span>
                    <input type="tel" class="form-control bg-dark text-white border-secondary" id="profileWorkshopPhone" placeholder="Ej: +51 987 654 321">
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label small text-info fw-bold mb-1">Ciudad y País</label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-dark text-white border-secondary"><i class="bi bi-geo-alt-fill text-danger"></i></span>
                    <input type="text" class="form-control bg-dark text-white border-secondary" id="profileWorkshopLocation" placeholder="Ej: Lima, Perú">
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label small text-info fw-bold mb-1">Especialidad Principal del Taller</label>
                  <select class="form-select form-select-sm bg-dark text-white border-secondary" id="profileWorkshopSpecialty">
                    <option value="Diagnóstico Electrónico & Scanner">Diagnóstico Electrónico & Scanner Automotriz</option>
                    <option value="Reparación de Computadoras ECU / ECM">Reparación de Computadoras ECU / ECM / Módulos</option>
                    <option value="Inyección Diésel Common Rail & Gasolina">Inyección Diésel Common Rail & Gasolina</option>
                    <option value="Inmovilizadores, Llaves & Programación EEPROM">Inmovilizadores, Llaves & Programación EEPROM / MCU</option>
                    <option value="Mecatrónica Automotriz General">Mecatrónica Automotriz General</option>
                  </select>
                </div>
              </div>

              <div id="profileWorkshopSaveNotice" class="small text-center fw-bold mt-3 d-none"></div>
            </div>

            <div class="modal-footer border-secondary py-3 px-4 d-flex justify-content-between">
              <button type="button" class="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Cerrar</button>
              <button type="submit" class="btn btn-info rounded-pill px-4 fw-bold shadow-sm" id="btnSaveWorkshopProfile">
                <i class="bi bi-check-circle-fill me-1"></i> Guardar Datos del Perfil
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.openUserProfileAndWorkshopModal = function(e) {
  if (e) e.preventDefault();
  injectUserProfileAndWorkshopModal();

  const user = window.probaktronicCurrentUser || {};
  const isAdmin = (user.email === 'prueba@probak.com' || user.rol === 'admin' || user.isAdmin === true);
  const isPremium = !!user.esPremium;

  const emailEl = document.getElementById('profileDisplayEmail');
  const badgeEl = document.getElementById('profileMembershipBadge');
  const techNameEl = document.getElementById('profileWorkshopTechName');
  const workshopNameEl = document.getElementById('profileWorkshopName');
  const phoneEl = document.getElementById('profileWorkshopPhone');
  const locEl = document.getElementById('profileWorkshopLocation');
  const specEl = document.getElementById('profileWorkshopSpecialty');

  if (emailEl) emailEl.textContent = user.email || 'usuario@probak.com';
  if (badgeEl) {
    if (isAdmin) {
      badgeEl.className = 'badge badge-gold-admin px-2 py-1 mb-1';
      badgeEl.innerHTML = '<i class="bi bi-shield-fill-check me-1"></i>ADMINISTRADOR PROBAKTRONIC';
    } else if (isPremium) {
      badgeEl.className = 'badge bg-warning text-dark fw-bold font-rajdhani px-2 py-1 mb-1';
      badgeEl.innerHTML = '<i class="bi bi-patch-check-fill me-1"></i>MEMBRESÍA TÉCNICO PREMIUM';
    } else {
      badgeEl.className = 'badge bg-secondary text-white fw-bold font-rajdhani px-2 py-1 mb-1';
      badgeEl.innerHTML = '<i class="bi bi-person me-1"></i>ACCESO TÉCNICO BÁSICO';
    }
  }

  if (techNameEl) techNameEl.value = user.nombre || user.nombreTecnico || '';
  if (workshopNameEl) workshopNameEl.value = user.nombreTaller || '';
  if (phoneEl) phoneEl.value = user.telefono || '';
  if (locEl) locEl.value = user.ubicacion || '';
  if (specEl && user.especialidad) specEl.value = user.especialidad;

  const modalEl = document.getElementById('userProfileAndWorkshopModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
};

window.saveUserProfileAndWorkshop = async function(e) {
  if (e) e.preventDefault();

  const techName = document.getElementById('profileWorkshopTechName')?.value.trim();
  const workshopName = document.getElementById('profileWorkshopName')?.value.trim();
  const phone = document.getElementById('profileWorkshopPhone')?.value.trim();
  const location = document.getElementById('profileWorkshopLocation')?.value.trim();
  const specialty = document.getElementById('profileWorkshopSpecialty')?.value;
  const noticeEl = document.getElementById('profileWorkshopSaveNotice');

  if (!techName) return;

  const current = window.probaktronicCurrentUser || {};
  const updatedUser = {
    ...current,
    nombre: techName,
    nombreTecnico: techName,
    nombreTaller: workshopName,
    telefono: phone,
    ubicacion: location,
    especialidad: specialty
  };

  window.probaktronicCurrentUser = updatedUser;
  try {
    localStorage.setItem('probaktronic_cached_user', JSON.stringify(updatedUser));
  } catch (err) {}

  renderLoggedInHeaderUI(updatedUser);

  // Sync to Firestore if logged in
  if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
    try {
      const uid = firebase.auth().currentUser.uid;
      await firebase.firestore().collection('usuarios').doc(uid).set({
        nombre: techName,
        nombreTecnico: techName,
        nombreTaller: workshopName,
        telefono: phone,
        ubicacion: location,
        especialidad: specialty,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (dbErr) {
      console.warn('Error syncing workshop profile to Firestore:', dbErr);
    }
  }

  if (noticeEl) {
    noticeEl.className = 'small text-center fw-bold mt-3 text-success';
    noticeEl.textContent = '✅ ¡Datos del taller actualizados correctamente!';
    noticeEl.classList.remove('d-none');
    setTimeout(() => {
      noticeEl.classList.add('d-none');
      const modalEl = document.getElementById('userProfileAndWorkshopModal');
      if (modalEl) {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }
    }, 1200);
  }

  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast('✅ ¡Perfil del técnico y taller guardado!');
  }
};
