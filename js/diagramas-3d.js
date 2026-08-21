// 3D Viewer Logic

document.addEventListener('DOMContentLoaded', () => {
  const toolBtns = document.querySelectorAll('.viewer-tool-btn');
  const componentItems = document.querySelectorAll('.component-item');

  // Toolbar button toggles
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('title') || 'Herramienta';
      showGlobalToast(`Modo 3D seleccionado: ${mode}`);
    });
  });

  // Component Selection
  componentItems.forEach(item => {
    item.addEventListener('click', () => {
      componentItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const componentName = item.querySelector('strong').textContent;
      showGlobalToast(`Componente enfocado: ${componentName}`);
    });
  });
});
