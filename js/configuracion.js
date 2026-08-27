// Probaktronic System Configuration & User Management
console.log('--- Probaktronic Configuration & User Manager Loaded ---');

const CONFIG_STORAGE_KEY = 'probaktronic_user_settings';

const defaultConfig = {
  legendAlwaysVisible: true,
  imageQuality: 'high',
  glowEffects: true,
  appTheme: 'cyber-dark',
  notifications: true
};

window.currentProbakConfig = { ...defaultConfig };
window.allLoadedFirestoreUsers = [];

function loadConfigSettings() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      window.currentProbakConfig = { ...defaultConfig, ...JSON.parse(raw) };
    }
  } catch (e) {}

  // Populate UI inputs if on configuracion.html
  const elLegend = document.getElementById('cfgLegendAlwaysVisible');
  const elQuality = document.getElementById('cfgImageQuality');
  const elGlow = document.getElementById('cfgGlowEffects');
  const elTheme = document.getElementById('cfgAppTheme');
  const elNotif = document.getElementById('cfgNotifications');

  if (elLegend) elLegend.checked = !!window.currentProbakConfig.legendAlwaysVisible;
  if (elQuality) elQuality.value = window.currentProbakConfig.imageQuality || 'high';
  if (elGlow) elGlow.checked = !!window.currentProbakConfig.glowEffects;
  if (elTheme) elTheme.value = window.currentProbakConfig.appTheme || 'cyber-dark';
  if (elNotif) elNotif.checked = !!window.currentProbakConfig.notifications;

  checkAdminConfigVisibility();
}

window.saveConfigSettings = function() {
  const elLegend = document.getElementById('cfgLegendAlwaysVisible');
  const elQuality = document.getElementById('cfgImageQuality');
  const elGlow = document.getElementById('cfgGlowEffects');
  const elTheme = document.getElementById('cfgAppTheme');
  const elNotif = document.getElementById('cfgNotifications');

  window.currentProbakConfig = {
    legendAlwaysVisible: elLegend ? elLegend.checked : true,
    imageQuality: elQuality ? elQuality.value : 'high',
    glowEffects: elGlow ? elGlow.checked : true,
    appTheme: elTheme ? elTheme.value : 'cyber-dark',
    notifications: elNotif ? elNotif.checked : true
  };

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(window.currentProbakConfig));
    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('⚙️ Preferencias guardadas correctamente.');
    }
  } catch (e) {}
};

window.clearProbaktronicCache = function() {
  if (confirm('¿Deseas limpiar la memoria caché local de diagramas y datos temporales?')) {
    const authCache = localStorage.getItem('probaktronic_cached_user');
    const settingsCache = localStorage.getItem(CONFIG_STORAGE_KEY);
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('ecu_hotspots_') || k.startsWith('firebase_') || k.startsWith('probak_cache_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    if (authCache) localStorage.setItem('probaktronic_cached_user', authCache);
    if (settingsCache) localStorage.setItem(CONFIG_STORAGE_KEY, settingsCache);

    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('🧹 ¡Caché local limpiada con éxito!');
    } else {
      alert('🧹 ¡Caché local limpiada con éxito!');
    }
  }
};

window.resetConfigDefaults = function() {
  if (confirm('¿Restablecer todas las preferencias a sus valores predeterminados?')) {
    window.currentProbakConfig = { ...defaultConfig };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(defaultConfig));
    loadConfigSettings();
    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('🔄 Preferencias restablecidas.');
    } else {
      alert('🔄 Preferencias restablecidas.');
    }
  }
};

function checkAdminConfigVisibility() {
  const adminCard = document.getElementById('adminConfigCard');
  const usersCard = document.getElementById('usersManagementCard');
  
  const user = window.probaktronicCurrentUser;
  const isAdmin = (typeof window.isProbaktronicAdmin === 'function') ? window.isProbaktronicAdmin() : (user && (user.email === 'prueba@probak.com' || user.rol === 'admin' || user.isAdmin === true));
  const isPremium = !!(user && (user.esPremium || isAdmin));

  if (adminCard) {
    if (isAdmin) adminCard.classList.remove('d-none');
    else adminCard.classList.add('d-none');
  }

  if (usersCard) {
    if (isAdmin || isPremium) {
      usersCard.classList.remove('d-none');
      fetchFirestoreUsersList();
    } else {
      usersCard.classList.add('d-none');
    }
  }
}

// Download Backup of all LocalStorage and Firestore ECU Hotspots
window.downloadAllEcuHotspotsBackup = async function() {
  const backupData = {
    exportedAt: new Date().toISOString(),
    system: 'Probaktronic Automotive Diagnostics',
    items: {}
  };

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('ecu_hotspots_') || k.startsWith('probaktronic_ecu_hotspots_master_'))) {
      try {
        backupData.items[k] = JSON.parse(localStorage.getItem(k));
      } catch (e) {}
    }
  }

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `probaktronic_backup_hotspots_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast('📦 ¡Backup JSON descargado exitosamente!');
  }
};

// =========================================================================
// GESTIÓN DE USUARIOS Y ACCESOS (FIRESTORE)
// =========================================================================

// Real-time Firestore Users Listener
let usersUnsubscribeListener = null;

window.fetchFirestoreUsersList = function() {
  const tbody = document.getElementById('usersTableBody');
  const countBadge = document.getElementById('usersCountBadge');
  if (!tbody) return;

  if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-warning">SDK de Firebase no inicializado.</td></tr>`;
    return;
  }

  // Detach previous listener if any
  if (typeof usersUnsubscribeListener === 'function') {
    usersUnsubscribeListener();
  }

  try {
    const db = firebase.firestore();
    usersUnsubscribeListener = db.collection('usuarios').onSnapshot(snap => {
      window.allLoadedFirestoreUsers = [];
      snap.forEach(doc => {
        window.allLoadedFirestoreUsers.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort: Admins first, then Premium, then others
      window.allLoadedFirestoreUsers.sort((a, b) => {
        const aAdmin = (a.email === 'prueba@probak.com' || a.rol === 'admin');
        const bAdmin = (b.email === 'prueba@probak.com' || b.rol === 'admin');
        if (aAdmin && !bAdmin) return -1;
        if (!aAdmin && bAdmin) return 1;
        return (b.esPremium ? 1 : 0) - (a.esPremium ? 1 : 0);
      });

      if (countBadge) {
        countBadge.textContent = `${window.allLoadedFirestoreUsers.length} Usuarios (En Vivo)`;
      }

      renderUsersTable(window.allLoadedFirestoreUsers);
    }, err => {
      console.warn('Error en listener de usuarios Firestore:', err);
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-white-50">
            <i class="bi bi-shield-lock-fill text-warning fs-3 d-block mb-2"></i>
            <div class="fw-bold text-white mb-1">Permiso de lectura requerido en Firebase</div>
            <div class="small text-muted" style="max-width: 500px; margin: auto;">
              Actualiza la regla de <code>/usuarios/{userId}</code> en Firebase Console a <code>allow read: if true;</code> para listar los usuarios en tiempo real.
            </div>
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.warn('Error al iniciar listener de usuarios en Firestore:', err);
  }
};

function renderUsersTable(usersList) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (!usersList || usersList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">
          <i class="bi bi-people fs-4 d-block mb-1"></i>
          No se encontraron usuarios registrados en la base de datos.
        </td>
      </tr>
    `;
    return;
  }

  const currentUserEmail = window.probaktronicCurrentUser ? window.probaktronicCurrentUser.email : '';

  tbody.innerHTML = usersList.map(u => {
    const isUserAdmin = (u.email === 'prueba@probak.com' || u.rol === 'admin' || u.isAdmin === true);
    const isUserPremium = !!u.esPremium || isUserAdmin;
    const isSelf = (u.email === currentUserEmail);

    let roleBadge = '<span class="badge bg-secondary px-2 py-1"><i class="bi bi-person me-1"></i>Free</span>';
    if (isUserAdmin) {
      roleBadge = '<span class="badge badge-gold-admin px-2 py-1"><i class="bi bi-shield-fill-check me-1"></i>Admin Master</span>';
    } else if (isUserPremium) {
      roleBadge = '<span class="badge bg-warning text-dark fw-bold px-2 py-1"><i class="bi bi-patch-check-fill me-1"></i>Premium</span>';
    }

    const techName = u.nombre || u.nombreTecnico || 'Técnico Automotriz';
    const workshopName = u.nombreTaller || 'Taller Particular';

    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="rounded-circle p-1 d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 34px; height: 34px; background: ${isUserAdmin ? '#D97706' : isUserPremium ? '#D32F2F' : '#475569'}; color: #FFF; font-size: 0.8rem;">
              ${(techName.charAt(0) || 'U').toUpperCase()}
            </div>
            <div>
              <div class="fw-bold text-white">${techName} ${isSelf ? '<span class="badge bg-info text-dark" style="font-size: 0.62rem;">TÚ</span>' : ''}</div>
              <div class="text-muted" style="font-size: 0.75rem;"><i class="bi bi-building me-1"></i>${workshopName}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="font-monospace text-info">${u.email || 'Sin correo'}</span>
        </td>
        <td>
          ${roleBadge}
        </td>
        <td>
          <span class="badge bg-success-subtle text-success border border-success border-opacity-25" style="font-size: 0.72rem;">
            <i class="bi bi-check-circle-fill me-1"></i>Activo
          </span>
        </td>
        <td class="text-end pe-3">
          <div class="d-inline-flex align-items-center gap-1">
            <!-- Toggle Premium Access Button -->
            ${!isUserAdmin ? `
              <button class="btn btn-sm ${isUserPremium ? 'btn-outline-warning' : 'btn-warning'} py-0 px-2 fw-bold" style="font-size: 0.72rem;" onclick="toggleUserPremiumAccess('${u.id}', ${isUserPremium})" title="${isUserPremium ? 'Quitar acceso Premium' : 'Otorgar acceso Premium'}">
                <i class="bi ${isUserPremium ? 'bi-shield-x' : 'bi-patch-check-fill'} me-1"></i>
                ${isUserPremium ? 'Bajar a Free' : 'Dar Premium'}
              </button>
            ` : ''}
            
            <!-- Edit Button -->
            <button class="btn btn-sm btn-outline-info p-1 px-2" onclick="openEditUserModal('${u.id}')" title="Editar datos del usuario">
              <i class="bi bi-pencil-square"></i>
            </button>

            <!-- Delete Button (Disabled for self and master admin) -->
            ${(!isSelf && !isUserAdmin) ? `
              <button class="btn btn-sm btn-outline-danger p-1 px-2" onclick="deleteFirestoreUser('${u.id}', '${u.email}')" title="Eliminar usuario de la base de datos">
                <i class="bi bi-trash3-fill"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.filterUsersList = function() {
  const query = (document.getElementById('userSearchInput')?.value || '').toLowerCase().trim();
  const roleFilter = document.getElementById('userRoleFilter')?.value || 'all';

  let filtered = [...window.allLoadedFirestoreUsers];

  if (roleFilter === 'premium') {
    filtered = filtered.filter(u => u.esPremium === true || u.rol === 'admin' || u.email === 'prueba@probak.com');
  } else if (roleFilter === 'free') {
    filtered = filtered.filter(u => !u.esPremium && u.rol !== 'admin' && u.email !== 'prueba@probak.com');
  } else if (roleFilter === 'admin') {
    filtered = filtered.filter(u => u.rol === 'admin' || u.email === 'prueba@probak.com');
  }

  if (query) {
    filtered = filtered.filter(u => {
      const email = (u.email || '').toLowerCase();
      const name = (u.nombre || u.nombreTecnico || '').toLowerCase();
      const workshop = (u.nombreTaller || '').toLowerCase();
      return email.includes(query) || name.includes(query) || workshop.includes(query);
    });
  }

  renderUsersTable(filtered);
};

// Toggle Premium Access in Firestore
window.toggleUserPremiumAccess = async function(userId, currentIsPremium) {
  const newStatus = !currentIsPremium;
  const actionText = newStatus ? 'Otorgar Acceso Premium' : 'Cambiar a Cuenta Free';

  if (!confirm(`¿Estás seguro de ${actionText} a este usuario?`)) return;

  try {
    const db = firebase.firestore();
    await db.collection('usuarios').doc(userId).set({
      esPremium: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast(`✅ ${newStatus ? '¡Acceso Premium otorgado!' : 'Acceso modificado a Free.'}`);
    }

    await fetchFirestoreUsersList();
  } catch (err) {
    console.error('Error al actualizar acceso de usuario:', err);
    alert('Error al actualizar en Firestore: ' + err.message);
  }
};

// Delete User from Firestore
window.deleteFirestoreUser = async function(userId, userEmail) {
  if (!confirm(`⚠️ ¿Deseas eliminar permanentemente al usuario ${userEmail} de la base de datos?`)) return;

  try {
    const db = firebase.firestore();
    await db.collection('usuarios').doc(userId).delete();

    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast(`🗑️ Usuario ${userEmail} eliminado de Firestore.`);
    }

    await fetchFirestoreUsersList();
  } catch (err) {
    console.error('Error al eliminar usuario en Firestore:', err);
    alert('Error al eliminar usuario: ' + err.message);
  }
};

// Open Create User Modal
window.openCreateUserModal = function() {
  const modalEl = document.getElementById('modalAdminCreateUser');
  if (!modalEl) return;

  document.getElementById('newUserEmail').value = '';
  document.getElementById('newUserName').value = '';
  document.getElementById('newUserWorkshop').value = '';
  if (document.getElementById('newUserPassword')) document.getElementById('newUserPassword').value = '';
  document.getElementById('newUserRole').value = 'premium';
  document.getElementById('newUserNotice').classList.add('d-none');

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

window.handleCreateUserSubmit = async function(e) {
  e.preventDefault();

  const email = document.getElementById('newUserEmail').value.trim().toLowerCase();
  const name = document.getElementById('newUserName').value.trim();
  const workshop = document.getElementById('newUserWorkshop').value.trim();
  const password = document.getElementById('newUserPassword') ? document.getElementById('newUserPassword').value : '123456';
  const role = document.getElementById('newUserRole').value;
  const noticeEl = document.getElementById('newUserNotice');
  const btn = document.getElementById('btnSubmitNewUser');

  if (!email || !name) return;
  if (!password || password.length < 6) {
    if (noticeEl) {
      noticeEl.className = 'small text-center fw-bold mt-2 text-danger';
      noticeEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      noticeEl.classList.remove('d-none');
    }
    return;
  }

  if (btn) btn.disabled = true;

  try {
    const db = firebase.firestore();
    let authUid = null;

    // 1. Create account in Firebase Authentication using a secondary app instance
    try {
      const fbConfig = (typeof firebaseConfig !== 'undefined') ? firebaseConfig : {
        apiKey: "AIzaSyC8IUDukbyc5NlQPFUn9ZDYOir4GeeHRYY",
        authDomain: "probaktronic-app.firebaseapp.com",
        projectId: "probaktronic-app",
        storageBucket: "probaktronic-app.firebasestorage.app",
        messagingSenderId: "373953615206",
        appId: "1:373953615206:web:6ccca21cefcb6100ee4a7"
      };

      const secondaryAppName = 'SecondaryAuth_' + Date.now();
      const secondaryApp = firebase.initializeApp(fbConfig, secondaryAppName);
      
      const userCred = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
      if (userCred && userCred.user) {
        authUid = userCred.user.uid;
        await userCred.user.updateProfile({ displayName: name });
      }
      await secondaryApp.delete();
    } catch (authErr) {
      console.warn('Nota Auth creation:', authErr);
      if (authErr.code === 'auth/email-already-in-use') {
        // User already in Auth, proceed to update Firestore
      } else {
        throw authErr;
      }
    }

    // 2. Save user profile document in Firestore
    const targetDocId = authUid || email.replace(/[^a-zA-Z0-9]/g, '_');

    await db.collection('usuarios').doc(targetDocId).set({
      email: email,
      nombre: name,
      nombreTecnico: name,
      nombreTaller: workshop || 'Taller Automotriz',
      esPremium: (role === 'premium' || role === 'admin'),
      rol: role,
      aprobado: true,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Clean up any old non-UID doc if targetDocId is a real UID
    if (authUid) {
      const oldDocId = email.replace(/[^a-zA-Z0-9]/g, '_');
      if (oldDocId !== authUid) {
        db.collection('usuarios').doc(oldDocId).delete().catch(() => {});
      }
    }

    if (noticeEl) {
      noticeEl.className = 'small text-center fw-bold mt-2 text-success';
      noticeEl.textContent = '✅ ¡Usuario y contraseña creados con éxito en Firebase!';
      noticeEl.classList.remove('d-none');
    }

    setTimeout(() => {
      const modalEl = document.getElementById('modalAdminCreateUser');
      bootstrap.Modal.getInstance(modalEl)?.hide();
      fetchFirestoreUsersList();
    }, 1000);

    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('✅ ¡Usuario creado en Authentication y Firestore!');
    }
  } catch (err) {
    console.error('Error al crear usuario en Firebase:', err);
    if (noticeEl) {
      noticeEl.className = 'small text-center fw-bold mt-2 text-danger';
      noticeEl.textContent = 'Error: ' + (err.message || err);
      noticeEl.classList.remove('d-none');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
};

// Open Edit User Modal
window.openEditUserModal = function(userId) {
  const user = window.allLoadedFirestoreUsers.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('editUserId').value = userId;
  document.getElementById('editUserEmail').value = user.email || '';
  document.getElementById('editUserName').value = user.nombre || user.nombreTecnico || '';
  document.getElementById('editUserWorkshop').value = user.nombreTaller || '';
  document.getElementById('editUserRole').value = (user.rol === 'admin' || user.email === 'prueba@probak.com') ? 'admin' : (user.esPremium ? 'premium' : 'free');
  document.getElementById('editUserNotice').classList.add('d-none');

  const modalEl = document.getElementById('modalAdminEditUser');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
};

window.handleEditUserSubmit = async function(e) {
  e.preventDefault();

  const userId = document.getElementById('editUserId').value;
  const name = document.getElementById('editUserName').value.trim();
  const workshop = document.getElementById('editUserWorkshop').value.trim();
  const role = document.getElementById('editUserRole').value;
  const noticeEl = document.getElementById('editUserNotice');
  const btn = document.getElementById('btnSubmitEditUser');

  if (!userId || !name) return;
  if (btn) btn.disabled = true;

  try {
    const db = firebase.firestore();
    await db.collection('usuarios').doc(userId).set({
      nombre: name,
      nombreTecnico: name,
      nombreTaller: workshop,
      esPremium: (role === 'premium' || role === 'admin'),
      rol: role,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (noticeEl) {
      noticeEl.className = 'small text-center fw-bold mt-2 text-success';
      noticeEl.textContent = '✅ ¡Usuario actualizado correctamente!';
      noticeEl.classList.remove('d-none');
    }

    setTimeout(() => {
      const modalEl = document.getElementById('modalAdminEditUser');
      bootstrap.Modal.getInstance(modalEl)?.hide();
      fetchFirestoreUsersList();
    }, 1000);

    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('✅ ¡Datos de usuario actualizados!');
    }
  } catch (err) {
    console.error('Error al editar usuario en Firestore:', err);
    if (noticeEl) {
      noticeEl.className = 'small text-center fw-bold mt-2 text-danger';
      noticeEl.textContent = 'Error: ' + err.message;
      noticeEl.classList.remove('d-none');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadConfigSettings();
  setTimeout(checkAdminConfigVisibility, 600);
});
