// Vehicles Page Logic

document.addEventListener('DOMContentLoaded', () => {
  const brandChips = document.querySelectorAll('.brand-chip');
  const vehicleCards = document.querySelectorAll('.vehicle-card');
  const searchInput = document.getElementById('vehicleSearchInput');

  // Brand Filter Click
  brandChips.forEach(chip => {
    chip.addEventListener('click', () => {
      brandChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const selectedBrand = chip.dataset.brand;
      filterVehicles(selectedBrand, searchInput ? searchInput.value.toLowerCase() : '');
    });
  });

  // Search Bar Filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const activeChip = document.querySelector('.brand-chip.active');
      const selectedBrand = activeChip ? activeChip.dataset.brand : 'all';
      filterVehicles(selectedBrand, e.target.value.toLowerCase());
    });
  }

  function filterVehicles(brand, searchText) {
    vehicleCards.forEach(card => {
      const cardBrand = card.dataset.brand;
      const cardTitle = card.querySelector('.vehicle-model').textContent.toLowerCase();

      const matchesBrand = (brand === 'all' || cardBrand === brand);
      const matchesSearch = cardTitle.includes(searchText);

      if (matchesBrand && matchesSearch) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }
});
