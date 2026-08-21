// Firebase Realtime Catalog Integration for Probaktronic
console.log('Initializing Firebase Catalog Connection...');

const firebaseConfig = {
  apiKey: "AIzaSyC8IUDukbyc5NlQPFUn9ZDYOiR4GeeHRYY",
  authDomain: "probaktronic-app.firebaseapp.com",
  databaseURL: "https://probaktronic-app-default-rtdb.firebaseio.com",
  projectId: "probaktronic-app",
  storageBucket: "probaktronic-app.firebasestorage.app",
  messagingSenderId: "373953615206",
  appId: "1:373953615206:android:6ccca21cefcb6100ee4a7"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase App initialized for project: probaktronic-app');
  
  loadFirebaseCatalog();
}

function loadFirebaseCatalog() {
  const container = document.getElementById('productGridContainer');
  const possibleNodes = ['productos', 'componentes', 'repuestos', 'Catalog'];

  let loaded = false;

  const db = firebase.database();
  possibleNodes.forEach(nodeName => {
    db.ref(nodeName).once('value').then((snapshot) => {
      if (snapshot.exists() && !loaded) {
        loaded = true;
        const data = snapshot.val();
        renderProducts(data, container);
      }
    }).catch(err => {
      console.log(`Checking node ${nodeName}...`, err.message);
    });
  });

  // Also check Firestore if Realtime Database is empty
  if (typeof firebase.firestore === 'function') {
    const fs = firebase.firestore();
    fs.collection('productos').get().then((querySnapshot) => {
      if (!querySnapshot.empty && !loaded) {
        loaded = true;
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push(doc.data());
        });
        renderProducts(items, container);
      }
    }).catch(err => {
      console.log('Firestore check:', err.message);
    });
  }
}

function renderProducts(data, container) {
  if (!container) return;

  const productList = Array.isArray(data) ? data : Object.values(data);
  
  if (productList.length === 0) return;

  container.innerHTML = ''; // Clear loading spinner
  
  productList.forEach(item => {
    const code = item.nombre || item.codigo || item.name || item.code || item.titulo || 'Componente';
    const imgUrl = item.imagen || item.imageUrl || item.foto || item.url || '';

    const cardHtml = `
      <div class="product-card">
        <div class="product-img-container">
          ${imgUrl ? `<img src="${imgUrl}" alt="${code}" loading="lazy">` : `
            <i class="bi bi-box-seam fs-1 text-muted"></i>
          `}
        </div>
        <div class="product-code">${code}</div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHtml);
  });
}
