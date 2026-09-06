// js/manuales.js - Gestión Limpia y Directa de Manuales Probadores Probaktronic
console.log('--- Probaktronic Manuales Probadores Manager Loaded ---');

let allManualsData = [];

// Variables para el Visor Zoom de Imagen & Arrastre
let currentZoomLevel = 1;
let currentPanX = 0;
let currentPanY = 0;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;
let currentZoomImgSrc = '';

// Variable para Drag & Drop de Tarjetas
let draggedCardIndex = null;

// Datos de Respaldo Integrados (Fallback Inmediato)
const DEFAULT_MANUALS_FALLBACK = [
  {
    "id": "man_01",
    "titulo": "Manual Probador de ECUs y Módulos Ligeros",
    "categoria": "ecu_gasolina",
    "categoriaNombre": "Probadores de ECU Ligeros",
    "codigo": "PRB-ECU-01",
    "descripcion": "Guía completa de conexionado, prueba de fuentes conmutadas, transistores de encendido y simulación en banco.",
    "archivoPdf": "archivos_almacenamiento/probadores_probaktronic/probador_ecu_ligeros.pdf",
    "portada": "archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/probador_ecu_ligeros_img.jpeg",
    "tamano": "2.0 MB",
    "paginas": 48,
    "idioma": "Español",
    "version": "1.0",
    "fecha": "2026-09-01",
    "destacado": true
  },
  {
    "id": "man_02",
    "titulo": "Manual Probador Sistema Common Rail & Inyectores",
    "categoria": "diesel_commonrail",
    "categoriaNombre": "Diésel & Common Rail",
    "codigo": "PRB-CR-01",
    "descripcion": "Esquemas de conexión para válvulas reguladoras de presión (SCV/DRV), sensores de riel e inyectores inductivos y piezoeléctricos.",
    "archivoPdf": "archivos_almacenamiento/probadores_probaktronic/probador_commonrail.pdf",
    "portada": "archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/probador_commonrail_img.jpeg",
    "tamano": "612 KB",
    "paginas": 24,
    "idioma": "Español",
    "version": "1.0",
    "fecha": "2026-09-01",
    "destacado": true
  },
  {
    "id": "man_03",
    "titulo": "Manual Probador de Sensores & Actuadores Automotrices",
    "categoria": "sensores_actuadores",
    "categoriaNombre": "Sensores & Actuadores",
    "codigo": "PRB-SEN-01",
    "descripcion": "Instrucciones de prueba para cuerpos de aceleración electrónicos (TPS/APP), válvulas IAC, sensores MAP, MAF y actuadores PWM.",
    "archivoPdf": "archivos_almacenamiento/probadores_probaktronic/probador_sensores_actuadores.pdf",
    "portada": "archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/probador_sensores_actuadores_img.jpeg",
    "tamano": "2.8 MB",
    "paginas": 62,
    "idioma": "Español",
    "version": "1.0",
    "fecha": "2026-09-01",
    "destacado": true
  },
  {
    "id": "man_04",
    "titulo": "Manual Generador de Señales CKP/CMP Plus Avanzado",
    "categoria": "simuladores",
    "categoriaNombre": "Generadores & Simuladores",
    "codigo": "GEN-PLUS-01",
    "descripcion": "Configuración de ruedas fónicas digitales (60-2, 36-1, patrones sincronizados CKP+CMP Hall e Inductivo) para simulación.",
    "archivoPdf": "archivos_almacenamiento/probadores_probaktronic/generador_plus.pdf",
    "portada": "archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/generador_plus_img.png",
    "tamano": "1.2 MB",
    "paginas": 36,
    "idioma": "Español",
    "version": "1.0",
    "fecha": "2026-09-01",
    "destacado": true
  },
  {
    "id": "man_05",
    "titulo": "Manual Generador de Pulsos y Señales Básico",
    "categoria": "simuladores",
    "categoriaNombre": "Generadores & Simuladores",
    "codigo": "GEN-BAS-01",
    "descripcion": "Generación de ondas cuadradas, variador de frecuencia y ciclo de trabajo para prueba de velocímetros, tacómetros y módulos.",
    "archivoPdf": "archivos_almacenamiento/probadores_probaktronic/generador_basico.pdf",
    "portada": "archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/generador_basico_img.jpeg",
    "tamano": "547 KB",
    "paginas": 16,
    "idioma": "Español",
    "version": "1.0",
    "fecha": "2026-09-01",
    "destacado": true
  }
];

// 1. Carga Inicial de Manuales desde Servidor / JSON Local
async function loadManualsData() {
  const container = document.getElementById('manualsGridContainer');
  
  try {
    let loaded = false;

    // Intentar API MySQL / Hosting primero
    try {
      const res = await fetch('api/manuales.php?action=listar&v=' + Date.now());
      if (res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data) && resData.data.length > 0) {
          allManualsData = resData.data;
          loaded = true;
        }
      }
    } catch (apiErr) {
      console.warn('API Manuales no disponible o error:', apiErr);
    }

    // Respaldo JSON directo
    if (!loaded || !allManualsData || allManualsData.length === 0) {
      try {
        const res = await fetch('data/manuales_probadores.json?v=' + Date.now());
        if (res.ok) {
          const jsonData = await res.json();
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            allManualsData = jsonData;
            loaded = true;
          }
        }
      } catch (jsonErr) {
        console.warn('Respaldo JSON no disponible:', jsonErr);
      }
    }

    // Fallback garantizado si todo lo demás falla
    if (!loaded || !allManualsData || allManualsData.length === 0) {
      allManualsData = [...DEFAULT_MANUALS_FALLBACK];
    }

    renderManualsGrid();
  } catch (err) {
    console.warn('Error al cargar manuales, usando datos integrados:', err);
    allManualsData = [...DEFAULT_MANUALS_FALLBACK];
    renderManualsGrid();
  }
}

// 2. Renderizar Tarjetas de Manuales
function renderManualsGrid() {
  const container = document.getElementById('manualsGridContainer');
  if (!container) return;

  if (!allManualsData || allManualsData.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="p-4 bg-light rounded-4 border d-inline-block text-center" style="max-width: 460px;">
          <i class="bi bi-journal-x fs-1 text-muted d-block mb-2"></i>
          <h5 class="fw-bold text-dark font-rajdhani">NO HAY MANUALES DISPONIBLES</h5>
          <p class="small text-muted mb-0">No se encontraron manuales cargados en el sistema.</p>
        </div>
      </div>
    `;
    return;
  }

  const isAdmin = typeof window.isProbaktronicAdmin === 'function' && window.isProbaktronicAdmin();
  const totalCards = allManualsData.length;

  container.innerHTML = allManualsData.map((manual, index) => {
    const portadaSrc = manual.portada || 'archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/probador_ecu_ligeros_img.jpeg';
    const pdfPath = manual.archivoPdf || '#';

    return `
      <div class="manual-card ${isAdmin ? 'is-admin-card' : ''}" 
           id="card_${manual.id}"
           data-index="${index}"
           ${isAdmin ? `draggable="true" 
             ondragstart="handleCardDragStart(event, ${index})" 
             ondragover="handleCardDragOver(event, ${index})" 
             ondragleave="handleCardDragLeave(event)" 
             ondrop="handleCardDrop(event, ${index})" 
             ondragend="handleCardDragEnd(event)"` : ''}>
        
        ${isAdmin ? `
          <!-- Barra Superior de Controles de Administración (Reordenar y Eliminar) -->
          <div class="admin-card-top-bar">
            <div class="admin-order-controls">
              <span class="admin-drag-handle" title="Arrastrar para cambiar orden">
                <i class="bi bi-grip-vertical"></i>
              </span>
              <button type="button" class="btn-move-manual btn-move-prev" 
                      title="Mover hacia la izquierda" 
                      ${index === 0 ? 'disabled' : ''} 
                      onclick="moveManualCard('${manual.id}', -1)">
                <i class="bi bi-chevron-left"></i>
              </button>
              <button type="button" class="btn-move-manual btn-move-next" 
                      title="Mover hacia la derecha" 
                      ${index === totalCards - 1 ? 'disabled' : ''} 
                      onclick="moveManualCard('${manual.id}', 1)">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>

            <button type="button" class="btn-delete-manual-admin" 
                    title="Eliminar Manual (Admin)" 
                    onclick="deleteManualPrompt('${manual.id}', '${escapeQuotes(manual.titulo)}')">
              <i class="bi bi-trash-fill"></i>
            </button>
          </div>
        ` : ''}

        <!-- Escaparate de Imagen 100% Integrado al Fondo Blanco (Clic para Zoom) -->
        <div class="manual-image-showcase" onclick="openImageZoomModal('${escapeQuotes(manual.titulo)}', '${portadaSrc}')" title="Clic para ampliar imagen con zoom">
          <img src="${portadaSrc}" alt="${escapeQuotes(manual.titulo)}" class="manual-showcase-img" onerror="this.src='imagenes svg/ico_logo_toyota.svg'">
          <div class="zoom-hint-badge">
            <i class="bi bi-zoom-in"></i> Clic para Zoom
          </div>
        </div>

        <div class="manual-card-body">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="manual-category-badge-pill">${escapeQuotes(manual.categoriaNombre || manual.categoria)}</span>
            <span class="manual-code-tag"><i class="bi bi-upc-scan"></i> ${escapeQuotes(manual.codigo || 'PRB-01')}</span>
          </div>

          <h3 class="manual-title">${escapeQuotes(manual.titulo)}</h3>
          <p class="manual-desc">${escapeQuotes(manual.descripcion || 'Manual técnico y esquemas de conexionado oficiales de Probaktronic.')}</p>

          <div class="manual-meta-pills">
            <div class="manual-meta-item" title="Páginas del documento">
              <i class="bi bi-file-earmark-text text-danger"></i>
              <span>${manual.paginas || 20} pág.</span>
            </div>
            <div class="manual-meta-item" title="Tamaño del archivo">
              <i class="bi bi-hdd-network text-primary"></i>
              <span>${manual.tamano || 'PDF'}</span>
            </div>
            <div class="manual-meta-item ms-auto text-success" title="Acceso Libre">
              <i class="bi bi-check-circle-fill"></i>
              <span class="fw-semibold">PDF Completo</span>
            </div>
          </div>

          <div class="manual-actions-row">
            <button class="btn btn-view-pdf" onclick="openPdfViewerModal('${escapeQuotes(manual.titulo)}', '${pdfPath}')">
              <i class="bi bi-file-earmark-pdf-fill"></i> Ver Manual PDF
            </button>
            <a href="${pdfPath}" download="${escapeQuotes(manual.titulo)}.pdf" class="btn btn-download-pdf" title="Descargar archivo PDF">
              <i class="bi bi-download"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 2.1 Lógica de Reordenamiento de Tarjetas (Solo Administrador)
function moveManualCard(id, direction) {
  const currentIndex = allManualsData.findIndex(m => m.id === id);
  if (currentIndex === -1) return;

  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= allManualsData.length) return;

  // Intercambiar posición en el array
  const temp = allManualsData[currentIndex];
  allManualsData[currentIndex] = allManualsData[newIndex];
  allManualsData[newIndex] = temp;

  renderManualsGrid();
  persistManualsOrder();
}

function handleCardDragStart(e, index) {
  draggedCardIndex = index;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', index);
  const card = e.currentTarget;
  setTimeout(() => {
    if (card) card.classList.add('is-dragging');
  }, 0);
}

function handleCardDragOver(e, index) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const card = e.currentTarget;
  if (card && draggedCardIndex !== null && draggedCardIndex !== index) {
    card.classList.add('drag-over');
  }
}

function handleCardDragLeave(e) {
  const card = e.currentTarget;
  if (card) {
    card.classList.remove('drag-over');
  }
}

function handleCardDrop(e, targetIndex) {
  e.preventDefault();
  const card = e.currentTarget;
  if (card) card.classList.remove('drag-over');

  if (draggedCardIndex === null || draggedCardIndex === targetIndex) return;

  // Reordenar array
  const itemToMove = allManualsData.splice(draggedCardIndex, 1)[0];
  allManualsData.splice(targetIndex, 0, itemToMove);

  draggedCardIndex = null;
  renderManualsGrid();
  persistManualsOrder();
}

function handleCardDragEnd(e) {
  draggedCardIndex = null;
  document.querySelectorAll('.manual-card').forEach(c => {
    c.classList.remove('is-dragging', 'drag-over');
  });
}

async function persistManualsOrder() {
  try {
    const payload = {
      order: allManualsData.map(m => m.id),
      items: allManualsData
    };

    const res = await fetch('api/manuales.php?action=reordenar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      if (typeof showGlobalToast === 'function') {
        showGlobalToast('Nuevo orden de manuales guardado en el servidor.', 'success');
      }
    }
  } catch (err) {
    console.warn('Error al guardar el nuevo orden en el servidor:', err);
  }
}

// 3. Modal Zoom Interactivo con Ruedita del Mouse & Arrastre
function openImageZoomModal(title, imgSrc) {
  const modalTitle = document.getElementById('zoomModalTitle');
  const imgEl = document.getElementById('zoomPreviewImg');

  currentZoomLevel = 1;
  currentPanX = 0;
  currentPanY = 0;
  isPanning = false;
  currentZoomImgSrc = imgSrc;

  if (modalTitle) modalTitle.textContent = title;
  if (imgEl) {
    imgEl.src = imgSrc;
  }
  applyZoomTransform();

  const modalEl = document.getElementById('modalImageZoom');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

function applyZoomTransform() {
  const imgEl = document.getElementById('zoomPreviewImg');
  const levelText = document.getElementById('zoomLevelText');
  const wrapper = document.querySelector('.zoom-image-wrapper');
  if (!imgEl) return;

  if (currentZoomLevel <= 1) {
    currentPanX = 0;
    currentPanY = 0;
    if (wrapper) wrapper.style.cursor = 'default';
  } else {
    if (wrapper) wrapper.style.cursor = isPanning ? 'grabbing' : 'grab';
  }

  imgEl.style.transform = `translate(${currentPanX}px, ${currentPanY}px) scale(${currentZoomLevel})`;
  if (levelText) {
    levelText.textContent = `${Math.round(currentZoomLevel * 100)}%`;
  }
}

function adjustZoom(delta) {
  currentZoomLevel = Math.max(0.5, Math.min(4.0, Math.round((currentZoomLevel + delta) * 100) / 100));
  applyZoomTransform();
}

function resetZoom() {
  currentZoomLevel = 1;
  currentPanX = 0;
  currentPanY = 0;
  applyZoomTransform();
}

// Inicializar eventos de Ruedita del Mouse y Arrastre para el Zoom
function initZoomMouseWheelAndPan() {
  const wrapper = document.querySelector('.zoom-image-wrapper');
  if (!wrapper) return;

  // Zoom con la Ruedita del Mouse
  wrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    adjustZoom(delta);
  }, { passive: false });

  // Paneo / Arrastre con Mouse
  wrapper.addEventListener('mousedown', (e) => {
    if (currentZoomLevel > 1 && e.button === 0) {
      isPanning = true;
      startPanX = e.clientX - currentPanX;
      startPanY = e.clientY - currentPanY;
      applyZoomTransform();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isPanning) {
      currentPanX = e.clientX - startPanX;
      currentPanY = e.clientY - startPanY;
      applyZoomTransform();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      applyZoomTransform();
    }
  });

  // Soporte Táctil para Dispositivos Móviles
  let touchStartDist = 0;
  wrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && currentZoomLevel > 1) {
      isPanning = true;
      startPanX = e.touches[0].clientX - currentPanX;
      startPanY = e.touches[0].clientY - currentPanY;
    } else if (e.touches.length === 2) {
      touchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  wrapper.addEventListener('touchmove', (e) => {
    if (isPanning && e.touches.length === 1) {
      currentPanX = e.touches[0].clientX - startPanX;
      currentPanY = e.touches[0].clientY - startPanY;
      applyZoomTransform();
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartDist > 0) {
        const factor = (dist - touchStartDist) * 0.005;
        adjustZoom(factor);
        touchStartDist = dist;
      }
    }
  }, { passive: true });

  wrapper.addEventListener('touchend', () => {
    isPanning = false;
    touchStartDist = 0;
  });
}

// 4. Modal Visor Interactivo de PDF
function openPdfViewerModal(title, pdfUrl) {
  const modalTitle = document.getElementById('pdfModalTitle');
  const iframe = document.getElementById('pdfViewerIframe');
  const downloadBtn = document.getElementById('pdfModalDownloadBtn');
  const openNewTabBtn = document.getElementById('pdfModalNewTabBtn');

  if (modalTitle) modalTitle.textContent = title;
  if (iframe) {
    iframe.src = pdfUrl;
  }
  if (downloadBtn) {
    downloadBtn.href = pdfUrl;
    downloadBtn.setAttribute('download', `${title}.pdf`);
  }
  if (openNewTabBtn) {
    openNewTabBtn.href = pdfUrl;
  }

  const modalEl = document.getElementById('modalPdfViewer');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

// 5. Funcionalidad de Administrador: Agregar y Eliminar Manuales
function openAdminAddManualModal() {
  const modalEl = document.getElementById('modalAdminAddManual');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

async function handleAdminSubmitNewManual(e) {
  e.preventDefault();
  const titulo = document.getElementById('newManualTitle').value.trim();
  const categoria = document.getElementById('newManualCategory').value;
  const categoriaSelect = document.getElementById('newManualCategory');
  const categoriaNombre = categoriaSelect.options[categoriaSelect.selectedIndex].text;
  const codigo = document.getElementById('newManualCode').value.trim();
  const descripcion = document.getElementById('newManualDesc').value.trim();
  const version = document.getElementById('newManualVersion').value.trim() || '1.0';
  const paginas = parseInt(document.getElementById('newManualPages').value) || 20;
  const tamano = document.getElementById('newManualSize').value.trim() || '2.0 MB';
  let archivoPdf = document.getElementById('newManualPdfPath').value.trim();
  let portada = document.getElementById('newManualCoverPath').value.trim();

  // Subir PDF si se adjuntó archivo local
  const pdfFileInput = document.getElementById('newManualPdfFile');
  if (pdfFileInput && pdfFileInput.files && pdfFileInput.files[0]) {
    try {
      const formData = new FormData();
      formData.append('file', pdfFileInput.files[0]);
      const res = await fetch('api/manuales.php?action=subir_archivo', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const uploadData = await res.json();
        if (uploadData.file_path) {
          archivoPdf = uploadData.file_path;
        }
      }
    } catch (err) {
      console.warn('Error subiendo PDF al servidor:', err);
    }
  }

  // Subir Portada si se adjuntó imagen
  const coverFileInput = document.getElementById('newManualCoverFile');
  if (coverFileInput && coverFileInput.files && coverFileInput.files[0]) {
    try {
      const formData = new FormData();
      formData.append('file', coverFileInput.files[0]);
      const res = await fetch('api/manuales.php?action=subir_archivo', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const uploadData = await res.json();
        if (uploadData.file_path) {
          portada = uploadData.file_path;
        }
      }
    } catch (err) {
      console.warn('Error subiendo imagen de portada:', err);
    }
  }

  if (!archivoPdf) {
    archivoPdf = 'archivos_almacenamiento/probadores_probaktronic/probador_ecu_ligeros.pdf';
  }
  if (!portada) {
    portada = 'archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/probador_ecu_ligeros_img.jpeg';
  }

  const payload = {
    id: 'man_' + Date.now(),
    titulo,
    categoria,
    categoriaNombre,
    codigo,
    descripcion,
    archivoPdf,
    portada,
    tamano,
    paginas,
    version,
    idioma: 'Español',
    destacado: true
  };

  try {
    const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:';
    if (!isLocal) {
      await fetch('api/manuales.php?action=guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    allManualsData.unshift(payload);
    renderManualsGrid();

    const modalEl = document.getElementById('modalAdminAddManual');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    document.getElementById('formAdminAddManual').reset();

    if (typeof showGlobalToast === 'function') {
      showGlobalToast('Manual registrado exitosamente.', 'success');
    }
  } catch (err) {
    console.error('Error guardando manual:', err);
    alert('Error al registrar el manual: ' + err.message);
  }
}

async function deleteManualPrompt(id, title) {
  if (!confirm(`¿Está seguro de que desea eliminar el manual:\n"${title}"?\n\nEsta acción quitará el manual de la biblioteca.`)) {
    return;
  }

  try {
    const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:';
    if (!isLocal) {
      await fetch('api/manuales.php?action=eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    }

    allManualsData = allManualsData.filter(m => m.id !== id);
    renderManualsGrid();

    if (typeof showGlobalToast === 'function') {
      showGlobalToast('Manual eliminado correctamente.', 'info');
    }
  } catch (err) {
    console.error('Error eliminando manual:', err);
    alert('Error al eliminar: ' + err.message);
  }
}

function escapeQuotes(str) {
  if (!str) return '';
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
  loadManualsData();
  initZoomMouseWheelAndPan();
});
