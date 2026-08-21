// Global JavaScript for Probaktronic Dashboard Platform

document.addEventListener('DOMContentLoaded', () => {
  console.log('Probaktronic Dashboard System Loaded.');

  // Highlight active link in sidebar navigation
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link-item');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });

  // Handle Sidebar Minimizing / Expanding Toggle & Logo Switching
  const btnMinimize = document.querySelector('.btn-sidebar-minimize');
  const sidebar = document.querySelector('.sidebar');
  
  if (btnMinimize && sidebar) {
    btnMinimize.addEventListener('click', () => {
      sidebar.classList.toggle('minimized');
      const isMinimized = sidebar.classList.contains('minimized');
      
      // Toggle Chevron Icon & Tooltip
      const icon = btnMinimize.querySelector('i');
      if (icon) {
        if (isMinimized) {
          icon.className = 'bi bi-chevron-double-right';
          btnMinimize.setAttribute('title', 'Expandir menú');
        } else {
          icon.className = 'bi bi-chevron-double-left';
          btnMinimize.setAttribute('title', 'Minimizar menú');
        }
      }
    });
  }

  // Update current date dynamically in bottom status bar
  const dateEl = document.getElementById('firmwareDateValue');
  if (dateEl) {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    dateEl.textContent = now.toLocaleDateString('es-ES', options);
  }

  // Handle Login Form Submission
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('usernameInput').value;
      
      const modalEl = document.getElementById('loginModal');
      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }

      // Update User Profile Name in Header
      const userNameEl = document.querySelector('.user-name');
      if (userNameEl) {
        userNameEl.textContent = username;
      }

      showGlobalToast(`Sesión iniciada con éxito como: ${username}`);
    });
  }
});

// Helper Toast Notification System
function showGlobalToast(message) {
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
    <div id="${toastId}" class="toast align-items-center text-bg-dark border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi bi-info-circle-fill text-danger fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  const toastEl = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
  bsToast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}
