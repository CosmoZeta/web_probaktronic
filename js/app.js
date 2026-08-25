// Probaktronic App JavaScript
document.addEventListener('DOMContentLoaded', () => {
  console.log('Probaktronic Automotive Dashboard initialized.');

  // Handle Sidebar Navigation Clicks
  const navBtns = document.querySelectorAll('.nav-item-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Don't toggle active for login or expand buttons
      if (btn.id === 'btnLogin' || btn.id === 'btnToggleSidebar') return;
      
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const title = btn.getAttribute('title') || 'Sección';
      showNotification(`Navegando a: ${title}`);
    });
  });

  // Handle Card Click Actions
  const cards = document.querySelectorAll('.action-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      const cardType = card.dataset.module;
      switch (cardType) {
        case 'vehicles':
          showNotification('Abriendo Catálogo de Vehículos...');
          break;
        case 'diagrams-3d':
          showNotification('Cargando Visor de Diagramas 3D...');
          break;
        case 'media-logs':
          showNotification('Abriendo Galería de Medios y Registros...');
          break;
        default:
          break;
      }
    });
  });

  // Handle Login Form Submission
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('usernameInput').value;
      
      // Close Modal
      const modalEl = document.getElementById('loginModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();

      // Update User Badge in Info Bar
      const userValueEl = document.getElementById('userInfoValue');
      if (userValueEl) {
        userValueEl.textContent = username || 'ADMIN';
        userValueEl.classList.add('text-success');
      }

      showNotification(`¡Bienvenido de nuevo, ${username}! Sesión iniciada.`);
    });
  }

  // Live system clock handled globally by js/global.js
});

// Helper toast notification
function showNotification(message) {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '1100';
    document.body.appendChild(toastContainer);
  }

  const toastId = 'toast-' + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-bg-dark border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi bi-info-circle-fill text-danger"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  const toastEl = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
  bsToast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}
