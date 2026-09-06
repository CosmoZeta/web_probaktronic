// js/admin-analytics.js - Telemetría en Tiempo Real, Visitas por IP y Control de Usuarios (Exclusivo Administrador)

(function() {
  'use strict';

  // 1. Verificación Robusta de Rol Administrador
  window.isProbaktronicAdmin = function() {
    try {
      if (window.probaktronicCurrentUser) {
        const u = window.probaktronicCurrentUser;
        if (u.email === 'prueba@probak.com' || u.email === 'jhanzeta@gmail.com' || u.rol === 'admin' || u.isAdmin === true) {
          return true;
        }
      }
      const raw = localStorage.getItem('probaktronic_cached_user') || localStorage.getItem('usuario_sesion') || sessionStorage.getItem('probaktronic_cached_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && (u.email === 'prueba@probak.com' || u.email === 'jhanzeta@gmail.com' || u.rol === 'admin' || u.isAdmin === true)) {
          return true;
        }
      }
      if (document.documentElement.classList.contains('is-admin') || (document.body && document.body.classList.contains('is-admin'))) {
        return true;
      }
      if (document.querySelector('.badge-gold-admin') || document.querySelector('.sidebar-gold')) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // 2. Registro Automático de Visita (Silencioso para todos los visitantes)
  window.registrarVisitaGlobal = function() {
    try {
      let userData = null;
      if (window.probaktronicCurrentUser && window.probaktronicCurrentUser.email) {
        const p = window.probaktronicCurrentUser;
        userData = {
          email: p.email,
          nombre: p.nombre || p.displayName || p.name || '',
          rol: p.rol || (p.isAdmin ? 'admin' : (p.esPremium ? 'premium' : 'usuario')),
          esPremium: !!(p.esPremium || p.tipo === 'premium' || p.rol === 'admin')
        };
      } else {
        const raw = localStorage.getItem('probaktronic_cached_user') || localStorage.getItem('usuario_sesion');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.email) {
              userData = {
                email: parsed.email,
                nombre: parsed.nombre || parsed.displayName || parsed.name || '',
                rol: parsed.rol || (parsed.isAdmin ? 'admin' : (parsed.esPremium ? 'premium' : 'usuario')),
                esPremium: !!(parsed.esPremium || parsed.tipo === 'premium' || parsed.rol === 'admin')
              };
            }
          } catch(e) {}
        }
      }

      const payload = {
        pagina: window.location.pathname.split('/').pop() || 'index.html',
        titulo: document.title || 'Probaktronic',
        url_completa: window.location.href,
        referrer: document.referrer || '',
        screen_width: window.innerWidth,
        user: userData
      };

      fetch('api/visitas.php?action=ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json()).then(data => {
        if (data && data.status === 'success') {
          window._probakOnlineCount = data.online_now;
          window._probakTotalIps = data.total_ips;
          window.updateAdminFloatingBadge(data.online_now, data.total_ips);
        }
      }).catch(() => {});
    } catch(e) {}
  };

  // 3. Floating Admin Pill (Solo visible para Administradores)
  window.updateAdminFloatingBadge = function(onlineCount, totalIps) {
    if (!window.isProbaktronicAdmin()) {
      const existing = document.getElementById('adminLiveAnalyticsPill');
      if (existing) existing.remove();
      return;
    }

    const online = onlineCount || window._probakOnlineCount || 1;
    const ips = totalIps || window._probakTotalIps || 1;

    let pill = document.getElementById('adminLiveAnalyticsPill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'adminLiveAnalyticsPill';
      pill.className = 'admin-live-analytics-pill shadow-lg cursor-pointer';
      pill.title = 'Panel de Telemetría & Visitas en Vivo (Admin)';
      pill.onclick = () => window.openAdminAnalyticsModal();
      document.body.appendChild(pill);
    }

    pill.innerHTML = `
      <div class="d-flex align-items-center gap-2 px-3 py-2">
        <span class="live-pulse-dot"></span>
        <span class="fw-bold font-rajdhani text-white" style="font-size: 0.85rem;">
          <span class="text-success">${online} ONLINE</span> | <i class="bi bi-globe text-info ms-1"></i> ${ips} IPs
        </span>
        <i class="bi bi-chevron-right text-white-50" style="font-size: 0.75rem;"></i>
      </div>
    `;
  };

  // 4. Modal de Analíticas y Visitas por IP para el Administrador
  let analyticsPollInterval = null;

  window.openAdminAnalyticsModal = async function() {
    if (!window.isProbaktronicAdmin()) {
      alert('Acceso restringido a administradores.');
      return;
    }

    injectAdminAnalyticsModal();

    const modalEl = document.getElementById('adminAnalyticsModal');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
      bsModal.show();
    }

    await refreshAdminAnalyticsData();

    // Iniciar sondeo en vivo cada 10 segundos mientras el modal esté abierto
    clearInterval(analyticsPollInterval);
    analyticsPollInterval = setInterval(() => {
      const modalEl = document.getElementById('adminAnalyticsModal');
      if (modalEl && modalEl.classList.contains('show')) {
        refreshAdminAnalyticsData(true);
      } else {
        clearInterval(analyticsPollInterval);
      }
    }, 10000);
  };

  window.refreshAdminAnalyticsData = async function(isSilent = false) {
    const loader = document.getElementById('analyticsModalLoader');
    if (loader && !isSilent) loader.classList.remove('d-none');

    try {
      const resp = await fetch('api/visitas.php?action=stats');
      if (!resp.ok) throw new Error('Error de conexión a la API');
      const data = await resp.json();

      if (data && data.status === 'success') {
        renderAnalyticsData(data);
      }
    } catch (err) {
      console.warn('Notice cargando analíticas:', err);
    } finally {
      if (loader) loader.classList.add('d-none');
    }
  };

  function renderAnalyticsData(d) {
    // Contadores Principales
    const elOnline = document.getElementById('statAdminOnlineNow');
    const elIps = document.getElementById('statAdminTotalIps');
    const elUsers = document.getElementById('statAdminTotalUsers');
    const elHits = document.getElementById('statAdminTotalHits');
    const elToday = document.getElementById('statAdminTodayHits');

    if (elOnline) elOnline.textContent = d.online_now || 0;
    if (elIps) elIps.textContent = d.total_ips_unicas || 0;
    if (elUsers) elUsers.textContent = d.total_usuarios_registrados || 0;
    if (elHits) elHits.textContent = d.total_visitas || 0;
    if (elToday) elToday.textContent = d.visitas_hoy || 0;

    // Tabla de Visitantes por IP
    const tbodyIps = document.getElementById('tableVisitorIpsBody');
    if (tbodyIps) {
      if (!d.visitantes_ips || d.visitantes_ips.length === 0) {
        tbodyIps.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay registros de visitas aún.</td></tr>`;
      } else {
        tbodyIps.innerHTML = d.visitantes_ips.map((item, idx) => {
          const isOnline = item.is_online;
          const statusBadge = isOnline 
            ? `<span class="badge bg-success bg-opacity-25 text-success border border-success font-monospace px-2 py-1"><span class="spinner-grow spinner-grow-sm me-1" style="width: 8px; height: 8px;"></span> EN LÍNEA</span>`
            : `<span class="badge bg-secondary bg-opacity-25 text-white-50 border border-secondary font-monospace px-2 py-1">Hace ${formatTimeAgo(item.hace_segundos)}</span>`;

          const userBadge = item.usuario_email
            ? `<div class="fw-bold text-warning font-rajdhani" style="font-size: 0.88rem;"><i class="bi bi-person-check-fill text-warning me-1"></i>${item.usuario_nombre || item.usuario_email}</div><div class="text-muted small text-truncate" style="max-width: 160px;">${item.usuario_email}</div>`
            : `<span class="text-muted small"><i class="bi bi-person text-secondary me-1"></i>Visitante Anónimo</span>`;

          const deviceIcon = item.dispositivo === 'Móvil' ? 'bi-phone' : (item.dispositivo === 'Tablet' ? 'bi-tablet' : 'bi-laptop');

          return `
            <tr style="border-color: rgba(255,255,255,0.06);">
              <td class="text-center text-muted small">${idx + 1}</td>
              <td>
                <div class="fw-bold text-white font-monospace d-flex align-items-center gap-1">
                  <i class="bi bi-hdd-network text-info"></i> ${item.ip}
                </div>
                <div class="text-white-50 small" style="font-size: 0.75rem;">${item.pais || 'PE'}</div>
              </td>
              <td>${userBadge}</td>
              <td>
                <span class="badge bg-dark border border-secondary border-opacity-50 text-light small d-inline-flex align-items-center gap-1">
                  <i class="bi ${deviceIcon}"></i> ${item.dispositivo} - ${item.navegador || 'Web'}
                </span>
              </td>
              <td>
                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 small font-monospace">
                  /${item.ultima_pagina || 'index.html'}
                </span>
              </td>
              <td class="text-center">
                <span class="badge bg-dark text-white border border-secondary font-rajdhani fw-bold fs-7">
                  ${item.total_visitas || 1}
                </span>
              </td>
              <td>${statusBadge}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Tabla de Cuentas de Usuario Logueadas
    const tbodyUsers = document.getElementById('tableUsersAccountsBody');
    if (tbodyUsers) {
      if (!d.usuarios_activos || d.usuarios_activos.length === 0) {
        tbodyUsers.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No hay usuarios autenticados registrados aún.</td></tr>`;
      } else {
        tbodyUsers.innerHTML = d.usuarios_activos.map((u, idx) => {
          const isOnline = u.is_online;
          const statusBadge = isOnline 
            ? `<span class="badge bg-success bg-opacity-25 text-success border border-success font-monospace px-2 py-1"><span class="spinner-grow spinner-grow-sm me-1" style="width: 8px; height: 8px;"></span> CONECTADO</span>`
            : `<span class="badge bg-secondary bg-opacity-25 text-white-50 border border-secondary font-monospace px-2 py-1">Hace ${formatTimeAgo(u.hace_segundos)}</span>`;

          const rolBadge = u.rol === 'admin'
            ? `<span class="badge bg-danger text-white fw-bold font-rajdhani">ADMINISTRADOR</span>`
            : (u.es_premium ? `<span class="badge bg-warning text-dark fw-bold font-rajdhani">PREMIUM</span>` : `<span class="badge bg-info bg-opacity-25 text-info fw-bold font-rajdhani">GRATUITO</span>`);

          return `
            <tr style="border-color: rgba(255,255,255,0.06);">
              <td class="text-center text-muted small">${idx + 1}</td>
              <td>
                <div class="fw-bold text-white font-rajdhani fs-6">${u.nombre || 'Usuario'}</div>
                <div class="text-info small font-monospace">${u.email}</div>
              </td>
              <td>${rolBadge}</td>
              <td>
                <div class="font-monospace text-light small"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${u.ultima_ip || '-'}</div>
                <div class="text-muted small">Pág: /${u.ultima_pagina || 'index.html'}</div>
              </td>
              <td class="text-center">
                <span class="badge bg-dark text-white border border-secondary font-rajdhani fw-bold fs-7">
                  ${u.total_ingresos || 1}
                </span>
              </td>
              <td>${statusBadge}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  function formatTimeAgo(seconds) {
    if (!seconds || seconds < 60) return `${Math.max(1, Math.round(seconds || 0))} seg`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} d`;
  }

  function injectAdminAnalyticsModal() {
    if (document.getElementById('adminAnalyticsModal')) return;

    const modalHtml = `
      <div class="modal fade" id="adminAnalyticsModal" tabindex="-1" aria-labelledby="adminAnalyticsModalLabel" aria-hidden="true" style="z-index: 1080;">
        <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
          <div class="modal-content border-0 shadow-lg text-white" style="border-radius: 20px; overflow: hidden; background: #0B0E14;">
            
            <!-- Modal Header -->
            <div class="modal-header border-0 py-3 px-4" style="background: #11151F; border-bottom: 1px solid rgba(255,255,255,0.08) !important;">
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-3 p-2 bg-danger bg-opacity-20 text-danger d-flex align-items-center justify-content-center" style="width: 42px; height: 42px;">
                  <i class="bi bi-broadcast fs-4"></i>
                </div>
                <div>
                  <h5 class="modal-title font-rajdhani fw-bold mb-0 text-white d-flex align-items-center gap-2" id="adminAnalyticsModalLabel">
                    CONTROL DE VISITAS & USUARIOS EN TIEMPO REAL
                    <span class="badge bg-danger text-white font-rajdhani fw-bold" style="font-size: 0.7rem;">ADMINISTRADOR</span>
                  </h5>
                  <div class="text-white-50 small" style="font-size: 0.78rem;">Registro por direcciones IP, visitantes en vivo y cuentas autenticadas</div>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-outline-light btn-sm rounded-pill font-rajdhani fw-bold px-3 d-flex align-items-center gap-1" onclick="refreshAdminAnalyticsData()">
                  <i class="bi bi-arrow-clockwise"></i> Actualizar
                </button>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="modal-body p-4" style="background: #0B0E14; min-height: 500px;">
              <div id="analyticsModalLoader" class="text-center py-5 d-none">
                <div class="spinner-border text-danger mb-2" role="status"></div>
                <div class="small text-white-50 font-rajdhani">Consultando telemetría del servidor...</div>
              </div>

              <!-- Top Metric Cards -->
              <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                  <div class="card border-0 rounded-4 p-3 h-100" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25) !important;">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <span class="text-success small fw-bold font-rajdhani">EN LÍNEA AHORA</span>
                      <span class="live-pulse-dot"></span>
                    </div>
                    <h2 class="fw-bold text-success my-1 font-rajdhani" id="statAdminOnlineNow">0</h2>
                    <span class="text-white-50" style="font-size: 0.72rem;">Activos últimos 5 min</span>
                  </div>
                </div>

                <div class="col-6 col-md-3">
                  <div class="card border-0 rounded-4 p-3 h-100" style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.25) !important;">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <span class="text-info small fw-bold font-rajdhani">VISITANTES ÚNICOS</span>
                      <i class="bi bi-globe text-info"></i>
                    </div>
                    <h2 class="fw-bold text-info my-1 font-rajdhani" id="statAdminTotalIps">0</h2>
                    <span class="text-white-50" style="font-size: 0.72rem;">Direcciones IP distintas</span>
                  </div>
                </div>

                <div class="col-6 col-md-3">
                  <div class="card border-0 rounded-4 p-3 h-100" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25) !important;">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <span class="text-warning small fw-bold font-rajdhani">CUENTAS CONECTADAS</span>
                      <i class="bi bi-person-badge-fill text-warning"></i>
                    </div>
                    <h2 class="fw-bold text-warning my-1 font-rajdhani" id="statAdminTotalUsers">0</h2>
                    <span class="text-white-50" style="font-size: 0.72rem;">Usuarios con sesión</span>
                  </div>
                </div>

                <div class="col-6 col-md-3">
                  <div class="card border-0 rounded-4 p-3 h-100" style="background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.25) !important;">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <span class="text-danger small fw-bold font-rajdhani">TOTAL PÁGINAS VISTAS</span>
                      <i class="bi bi-eye-fill text-danger"></i>
                    </div>
                    <h2 class="fw-bold text-danger my-1 font-rajdhani" id="statAdminTotalHits">0</h2>
                    <span class="text-white-50" style="font-size: 0.72rem;">Hoy: <span id="statAdminTodayHits" class="text-white fw-bold">0</span> visitas</span>
                  </div>
                </div>
              </div>

              <!-- Tabs: Visitantes por IP vs Cuentas de Usuarios -->
              <ul class="nav nav-pills mb-3 border-bottom border-secondary border-opacity-25 pb-2 gap-2" id="analyticsTabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active rounded-pill font-rajdhani fw-bold px-4 py-2" id="tab-ips-btn" data-bs-toggle="pill" data-bs-target="#tab-ips-content" type="button" role="tab">
                    <i class="bi bi-hdd-network-fill me-1"></i> Visitantes por IP en Vivo
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link rounded-pill font-rajdhani fw-bold px-4 py-2" id="tab-users-btn" data-bs-toggle="pill" data-bs-target="#tab-users-content" type="button" role="tab">
                    <i class="bi bi-people-fill me-1"></i> Cuentas de Usuario que Ingresaron
                  </button>
                </li>
              </ul>

              <div class="tab-content" id="analyticsTabsContent">
                <!-- Panel 1: Visitantes por IP -->
                <div class="tab-pane fade show active" id="tab-ips-content" role="tabpanel">
                  <div class="table-responsive rounded-4 border border-secondary border-opacity-25" style="background: #11151F;">
                    <table class="table table-dark table-hover mb-0 align-middle" style="font-size: 0.84rem;">
                      <thead>
                        <tr class="text-white-50 font-rajdhani" style="background: #161B26; font-size: 0.78rem; letter-spacing: 0.5px;">
                          <th class="text-center" style="width: 40px;">#</th>
                          <th>DIRECCIÓN IP / UBICACIÓN</th>
                          <th>USUARIO / CUENTA</th>
                          <th>DISPOSITIVO & NAVEGADOR</th>
                          <th>PÁGINA ACTUAL</th>
                          <th class="text-center">VISITAS</th>
                          <th>ESTADO / ACTIVIDAD</th>
                        </tr>
                      </thead>
                      <tbody id="tableVisitorIpsBody">
                        <tr><td colspan="7" class="text-center py-4 text-white-50 font-rajdhani">Cargando registros...</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Panel 2: Cuentas de Usuario -->
                <div class="tab-pane fade" id="tab-users-content" role="tabpanel">
                  <div class="table-responsive rounded-4 border border-secondary border-opacity-25" style="background: #11151F;">
                    <table class="table table-dark table-hover mb-0 align-middle" style="font-size: 0.84rem;">
                      <thead>
                        <tr class="text-white-50 font-rajdhani" style="background: #161B26; font-size: 0.78rem; letter-spacing: 0.5px;">
                          <th class="text-center" style="width: 40px;">#</th>
                          <th>NOMBRE & CORREO</th>
                          <th>ROL / PLAN</th>
                          <th>ÚLTIMA IP & RUTA</th>
                          <th class="text-center">TOTAL INGRESOS</th>
                          <th>ESTADO ACTUAL</th>
                        </tr>
                      </thead>
                      <tbody id="tableUsersAccountsBody">
                        <tr><td colspan="6" class="text-center py-4 text-white-50 font-rajdhani">Cargando cuentas registradas...</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="modal-footer border-0 py-3 px-4" style="background: #11151F; border-top: 1px solid rgba(255,255,255,0.08) !important;">
              <div class="d-flex align-items-center justify-content-between w-100">
                <span class="text-white-50 small font-monospace" style="font-size: 0.75rem;">
                  <i class="bi bi-shield-check text-success me-1"></i>Acceso seguro restringido por credenciales de administrador
                </span>
                <button type="button" class="btn btn-secondary rounded-pill px-4 font-rajdhani fw-bold" data-bs-dismiss="modal">
                  Cerrar Panel
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  // 5. Inyección de Estilos CSS para el botón flotante y pulsos en vivo
  function injectAnalyticsStyles() {
    if (document.getElementById('adminAnalyticsStyles')) return;
    const style = document.createElement('style');
    style.id = 'adminAnalyticsStyles';
    style.textContent = `
      .admin-live-analytics-pill {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(239, 68, 68, 0.5);
        border-radius: 50px;
        z-index: 1050;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
      }
      .admin-live-analytics-pill:hover {
        transform: translateY(-3px) scale(1.03);
        border-color: #EF4444;
        box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3) !important;
      }
      .live-pulse-dot {
        width: 10px;
        height: 10px;
        background-color: #10B981;
        border-radius: 50%;
        display: inline-block;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        animation: pulseLive 1.8s infinite;
      }
      @keyframes pulseLive {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
    `;
    document.head.appendChild(style);
  }

  // Inicialización Automática
  document.addEventListener('DOMContentLoaded', () => {
    injectAnalyticsStyles();
    window.registrarVisitaGlobal();

    // Si es administrador, refrescar pill y permitir control
    if (window.isProbaktronicAdmin()) {
      updateAdminFloatingBadge(1, 1);
    }
  });

})();
