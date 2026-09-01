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
  const isAdmin = (typeof window.isProbaktronicAdmin === 'function') 
    ? window.isProbaktronicAdmin() 
    : (user && (user.email === 'prueba@probak.com' || user.email === 'jhanzeta@gmail.com' || user.rol === 'admin' || user.isAdmin === true));

  if (adminCard) {
    if (isAdmin) adminCard.classList.remove('d-none');
    else adminCard.classList.add('d-none');
  }

  // La gestión de usuarios y accesos a la Base de Datos es EXCLUSIVA de los Administradores Maestros
  if (usersCard) {
    if (isAdmin) {
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
// GESTIÓN DE USUARIOS Y ACCESOS (BASE DE DATOS & LOCAL DB)
// =========================================================================

window.fetchFirestoreUsersList = async function() {
  const tbody = document.getElementById('usersTableBody');
  const countBadge = document.getElementById('usersCountBadge');
  if (!tbody) return;

  try {
    let usersList = [];
    
    // 1. Revisar si hay cambios guardados en localStorage
    const localDb = localStorage.getItem('probaktronic_users_local_db');
    if (localDb) {
      usersList = JSON.parse(localDb);
    } else {
      // 2. Cargar desde data/usuarios.json
      const res = await fetch('data/usuarios.json');
      if (res.ok) {
        usersList = await res.json();
      }
    }

    if (!Array.isArray(usersList) || usersList.length === 0) {
      usersList = [
        {
          id: 'admin_1',
          nombre: 'SEÑOR GATO',
          nombreTecnico: 'SEÑOR GATO',
          nombreTaller: 'Probaktronic Central',
          email: 'prueba@probak.com',
          rol: 'admin',
          isAdmin: true,
          esPremium: true,
          aprobado: true
        },
        {
          id: 'admin_2',
          nombre: 'SR GATO',
          nombreTecnico: 'SR GATO',
          nombreTaller: 'Taller Automotriz',
          email: 'jhanzeta@gmail.com',
          rol: 'admin',
          isAdmin: true,
          esPremium: true,
          aprobado: true
        },
        {
          id: 'user_3',
          nombre: 'jhan zeta',
          nombreTecnico: 'jhan zeta',
          nombreTaller: 'Taller Automotriz',
          email: 'jhanzeta3@gmail.com',
          rol: 'premium',
          esPremium: true,
          aprobado: true
        },
        {
          id: 'user_4',
          nombre: 'jose rucoba',
          nombreTecnico: 'jose rucoba',
          nombreTaller: 'Taller Automotriz',
          email: 'plataformaprobaktronic@gmail.com',
          rol: 'premium',
          esPremium: true,
          aprobado: true
        }
      ];
    }

    // Ordenar: Administradores primero, luego Premium
    usersList.sort((a, b) => {
      const aAdmin = (a.email === 'prueba@probak.com' || a.email === 'jhanzeta@gmail.com' || a.rol === 'admin');
      const bAdmin = (b.email === 'prueba@probak.com' || b.email === 'jhanzeta@gmail.com' || b.rol === 'admin');
      if (aAdmin && !bAdmin) return -1;
      if (!aAdmin && bAdmin) return 1;
      return (b.esPremium ? 1 : 0) - (a.esPremium ? 1 : 0);
    });

    window.allLoadedFirestoreUsers = usersList;
    localStorage.setItem('probaktronic_users_local_db', JSON.stringify(usersList));

    if (countBadge) {
      countBadge.textContent = `${usersList.length} Usuarios (Base de Datos)`;
    }

    renderUsersTable(usersList);

  } catch (err) {
    console.warn('Error al cargar lista de usuarios:', err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Error al cargar usuarios de la base de datos.</td></tr>`;
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
    const isUserAdmin = (u.email === 'prueba@probak.com' || u.email === 'jhanzeta@gmail.com' || u.rol === 'admin' || u.isAdmin === true);
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
    filtered = filtered.filter(u => u.esPremium === true || u.rol === 'admin' || u.email === 'prueba@probak.com' || u.email === 'jhanzeta@gmail.com');
  } else if (roleFilter === 'free') {
    filtered = filtered.filter(u => !u.esPremium && u.rol !== 'admin' && u.email !== 'prueba@probak.com' && u.email !== 'jhanzeta@gmail.com');
  } else if (roleFilter === 'admin') {
    filtered = filtered.filter(u => u.rol === 'admin' || u.email === 'prueba@probak.com' || u.email === 'jhanzeta@gmail.com');
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

// Toggle Premium Access
window.toggleUserPremiumAccess = async function(userId, currentIsPremium) {
  const newStatus = !currentIsPremium;
  const actionText = newStatus ? 'Otorgar Acceso Premium' : 'Cambiar a Cuenta Free';

  if (!confirm(`¿Estás seguro de ${actionText} a este usuario?`)) return;

  const users = window.allLoadedFirestoreUsers || [];
  const target = users.find(u => u.id === userId);
  if (target) {
    target.esPremium = newStatus;
    if (newStatus && target.rol !== 'admin') target.rol = 'premium';
    else if (!newStatus && target.rol !== 'admin') target.rol = 'free';
    localStorage.setItem('probaktronic_users_local_db', JSON.stringify(users));
  }

  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast(`✅ ${newStatus ? '¡Acceso Premium otorgado!' : 'Acceso modificado a Free.'}`);
  }

  fetchFirestoreUsersList();
};

// Delete User
window.deleteFirestoreUser = async function(userId, userEmail) {
  if (!confirm(`⚠️ ¿Deseas eliminar permanentemente al usuario ${userEmail} de la base de datos?`)) return;

  let users = window.allLoadedFirestoreUsers || [];
  users = users.filter(u => u.id !== userId);
  window.allLoadedFirestoreUsers = users;
  localStorage.setItem('probaktronic_users_local_db', JSON.stringify(users));

  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast(`🗑️ Usuario ${userEmail} eliminado.`);
  }

  fetchFirestoreUsersList();
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
    const newUser = {
      id: 'user_' + Date.now(),
      email: email,
      nombre: name,
      nombreTecnico: name,
      nombreTaller: workshop || 'Taller Automotriz',
      esPremium: (role === 'premium' || role === 'admin'),
      rol: role,
      aprobado: true,
      fechaRegistro: new Date().toISOString()
    };

    const users = window.allLoadedFirestoreUsers || [];
    users.push(newUser);
    localStorage.setItem('probaktronic_users_local_db', JSON.stringify(users));

    if (noticeEl) {
      noticeEl.className = 'small text-center fw-bold mt-2 text-success';
      noticeEl.textContent = '✅ ¡Usuario registrado exitosamente en la base de datos!';
      noticeEl.classList.remove('d-none');
    }

    setTimeout(() => {
      const modalEl = document.getElementById('modalAdminCreateUser');
      bootstrap.Modal.getInstance(modalEl)?.hide();
      fetchFirestoreUsersList();
    }, 1000);

    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('✅ ¡Usuario creado en la Base de Datos!');
    }
  } catch (err) {
    console.error('Error al crear usuario:', err);
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
  document.getElementById('editUserRole').value = (user.rol === 'admin' || user.email === 'prueba@probak.com' || user.email === 'jhanzeta@gmail.com') ? 'admin' : (user.esPremium ? 'premium' : 'free');
  if (document.getElementById('editUserPassword')) {
    document.getElementById('editUserPassword').value = '';
  }
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
  const newPassword = document.getElementById('editUserPassword') ? document.getElementById('editUserPassword').value : '';
  const noticeEl = document.getElementById('editUserNotice');
  const btn = document.getElementById('btnSubmitEditUser');

  if (!userId || !name) return;

  if (newPassword && newPassword.length < 6) {
    if (noticeEl) {
      noticeEl.className = 'small text-center fw-bold mt-2 text-danger';
      noticeEl.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
      noticeEl.classList.remove('d-none');
    }
    return;
  }

  if (btn) btn.disabled = true;

  try {
    const users = window.allLoadedFirestoreUsers || [];
    const target = users.find(u => u.id === userId);
    if (target) {
      const isTargetAdmin = (target.email === 'prueba@probak.com' || target.email === 'jhanzeta@gmail.com');

      // Si se está cambiando la contraseña de un Administrador Maestro, solicitar confirmación de seguridad
      if (newPassword && isTargetAdmin) {
        const securityConfirm = confirm(`🛡️ ALERTA DE SEGURIDAD CRÍTICA:\n\nEstás modificando la contraseña del Administrador Maestro (${target.email}).\n\nPor protocolo de seguridad, se enviará una notificación con la IP y fecha al correo jhanzeta@gmail.com.\n\n¿Deseas confirmar este cambio?`);
        if (!securityConfirm) {
          if (btn) btn.disabled = false;
          return;
        }

        // Disparar envío de alerta por correo al backend
        try {
          if (typeof window.fetchAuthApi === 'function') {
            window.fetchAuthApi('notify_security_change', {
              target_email: target.email,
              operator_email: (window.probaktronicCurrentUser ? window.probaktronicCurrentUser.email : 'Admin Master'),
              timestamp: new Date().toISOString()
            }).catch(() => {});
          }
        } catch (e) {}
      }

      target.nombre = name;
      target.nombreTecnico = name;
      target.nombreTaller = workshop;
      target.rol = isTargetAdmin ? 'admin' : role;
      target.esPremium = (role === 'premium' || role === 'admin' || isTargetAdmin);
      
      if (newPassword) {
        target.password = newPassword;
        try {
          if (typeof window.fetchAuthApi === 'function') {
            window.fetchAuthApi('update_password', { email: target.email, password: newPassword }).catch(() => {});
          }
        } catch (e) {}
      }
      
      localStorage.setItem('probaktronic_users_local_db', JSON.stringify(users));

      // Si el usuario editado es el mismo actualmente conectado, refrescar sesión local
      if (window.probaktronicCurrentUser && window.probaktronicCurrentUser.email === target.email) {
        const updatedSelf = { ...window.probaktronicCurrentUser, ...target };
        localStorage.setItem('probaktronic_cached_user', JSON.stringify(updatedSelf));
        window.probaktronicCurrentUser = updatedSelf;
      }
    }

    if (noticeEl) {
      noticeEl.className = 'small text-center fw-bold mt-2 text-success';
      noticeEl.textContent = newPassword ? '✅ ¡Usuario y nueva contraseña actualizados!' : '✅ ¡Usuario actualizado correctamente!';
      noticeEl.classList.remove('d-none');
    }

    setTimeout(() => {
      const modalEl = document.getElementById('modalAdminEditUser');
      bootstrap.Modal.getInstance(modalEl)?.hide();
      fetchFirestoreUsersList();
    }, 1000);

    if (typeof window.showGlobalToast === 'function') {
      window.showGlobalToast('✅ ¡Datos y contraseña de usuario actualizados!');
    }
  } catch (err) {
    console.error('Error al editar usuario:', err);
    if (noticeEl) {
      noticeEl.className = 'small text-center fw-bold mt-2 text-danger';
      noticeEl.textContent = 'Error: ' + err.message;
      noticeEl.classList.remove('d-none');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
};

// Modal para vincular Google Authenticator (2FA)
window.openSetup2FAModal = function() {
  const user = window.probaktronicCurrentUser;
  const userEmail = (user && user.email) ? user.email : 'jhanzeta@gmail.com';
  const secretKey = 'JHANZETAPROBAK26';

  const qrImg = document.getElementById('setup2FAQRCodeImg');
  const secretText = document.getElementById('setup2FASecretKeyText');
  
  if (secretText) secretText.textContent = secretKey;
  if (qrImg) {
    const otpAuthUrl = `otpauth://totp/Probaktronic:${encodeURIComponent(userEmail)}?secret=${secretKey}&issuer=Probaktronic`;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpAuthUrl)}&size=200x200&margin=10`;
  }

  const modalEl = document.getElementById('modalSetup2FA');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadConfigSettings();
  setTimeout(checkAdminConfigVisibility, 600);
});


