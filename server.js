/**
 * PROBAKTRONIC - Servidor de Desarrollo Local (Zero-Dependencies)
 * Ejecuta la web y emula 100% las APIs de PHP (api/diagramas.php, etc.)
 * Guarda archivos y fotos localmente en archivos_almacenamiento/
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const STORAGE_DIR = path.join(ROOT_DIR, 'archivos_almacenamiento');
const DIAGRAMAS_DIR = path.join(STORAGE_DIR, 'diagramas_PRUEBAS');

// Asegurar que existan directorios básicos
[DATA_DIR, STORAGE_DIR, DIAGRAMAS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Tipos MIME
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4'
};

function cleanSlug(str, toUpper = false) {
  let cleaned = String(str || '').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!cleaned) cleaned = 'general';
  return toUpper ? cleaned.toUpperCase() : cleaned.toLowerCase();
}

function normalizeComponente(compRaw) {
  const upper = String(compRaw || '').toUpperCase();
  if (upper.includes('PEDAL')) return 'pedal_acelerador';
  if (upper.includes('INMOVILIZADOR') || upper.includes('LLAVE') || upper.includes('ANTENA')) return 'inmovilizador_llave';
  if (upper.includes('EDU') && (upper.includes('DOS') || upper.includes('2'))) return 'edu_dos_conectores';
  if (upper.includes('EDU') && (upper.includes('TRES') || upper.includes('3'))) return 'edu_tres_conectores';
  if (upper.includes('CUERPO')) return 'cuerpo_aceleracion';
  if (upper.includes('DISTRIBUIDOR')) return 'distribuidor';
  if (upper.includes('OXIGENO') || upper.includes('O2')) return 'sensor_oxigeno';
  if (upper.includes('TABLERO') || upper.includes('CLUSTER') || upper.includes('CUADRO')) return 'tablero_instrumentos';
  if (upper.includes('FUSIBLERA') || upper.includes('BCM') || upper.includes('FUSIBLE')) return 'fusiblera_bcm';
  if (upper.includes('OBD')) return 'puerto_obd';
  if (upper.includes('BOOT')) return 'modo_boot';
  if (upper.includes('BENCH')) return 'modo_banco';
  if (upper.includes('ECU') || upper.includes('COMPUTADORA') || upper.includes('ECM') || upper.includes('PCM') || upper === 'PINOUT') return 'ecu';
  return cleanSlug(compRaw, false).replace(/_(imagen|conexionado)$/i, '');
}

function getVehiculosData() {
  const jsonPath = path.join(DATA_DIR, 'vehiculos_diagramas.json');
  if (fs.existsSync(jsonPath)) {
    try {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      console.error('Error al leer vehiculos_diagramas.json:', e.message);
    }
  }
  return {};
}

function saveVehiculosData(data) {
  const jsonPath = path.join(DATA_DIR, 'vehiculos_diagramas.json');
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 4), 'utf8');
}

function parseMultipart(buffer, boundary) {
  const result = { fields: {}, files: {} };
  const boundaryBuffer = Buffer.from('--' + boundary);
  let start = 0;

  while ((start = buffer.indexOf(boundaryBuffer, start)) !== -1) {
    start += boundaryBuffer.length;
    if (buffer.subarray(start, start + 2).toString() === '--') break;
    if (buffer.subarray(start, start + 2).toString() === '\r\n') start += 2;

    const headerEnd = buffer.indexOf('\r\n\r\n', start);
    if (headerEnd === -1) break;

    const headerText = buffer.subarray(start, headerEnd).toString('utf8');
    const contentStart = headerEnd + 4;
    const nextBoundary = buffer.indexOf('\r\n' + boundaryBuffer.toString(), contentStart);
    if (nextBoundary === -1) break;

    const contentBuffer = buffer.subarray(contentStart, nextBoundary);
    start = nextBoundary;

    const dispositionMatch = headerText.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (dispositionMatch) {
      const fieldName = dispositionMatch[1];
      const filename = dispositionMatch[2];

      if (filename) {
        const typeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);
        result.files[fieldName] = {
          filename,
          contentType: typeMatch ? typeMatch[1].trim() : 'application/octet-stream',
          data: contentBuffer
        };
      } else {
        result.fields[fieldName] = contentBuffer.toString('utf8');
      }
    }
  }
  return result;
}

// Router de API Diagramas
async function handleDiagramasApi(req, res, query, bodyBuffer) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const action = query.action || 'marcas';
  let input = {};
  let files = {};

  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    const boundaryMatch = contentType.match(/boundary=(?:["']?)([^"';]+)(?:["']?)/i);
    if (boundaryMatch) {
      const parsed = parseMultipart(bodyBuffer, boundaryMatch[1]);
      input = parsed.fields;
      files = parsed.files;
    }
  } else if (contentType.includes('application/json')) {
    try {
      input = JSON.parse(bodyBuffer.toString('utf8') || '{}');
    } catch {
      input = {};
    }
  } else if (bodyBuffer.length > 0) {
    try {
      const qs = require('node:querystring');
      input = qs.parse(bodyBuffer.toString('utf8'));
    } catch {}
  }

  const tree = getVehiculosData();

  switch (action) {
    case 'marcas': {
      const marcas = [];
      Object.keys(tree).forEach((slug, idx) => {
        const b = tree[slug];
        marcas.push({
          MarcaID: idx + 1,
          Slug: slug,
          Nombre: (b.brandData && b.brandData.nombre) || slug.toUpperCase(),
          LogoUrl: (b.brandData && b.brandData.logo) || '',
          Categoria: (b.brandData && b.brandData.categoria) || 'vehiculos',
          Combustible: (b.brandData && b.brandData.combustible) || 'diesel',
          Activo: 1
        });
      });
      return res.end(JSON.stringify({ status: 'success', data: marcas }));
    }

    case 'modelos': {
      const marcaQuery = cleanSlug(String(query.marca || ''), false);
      const bKey = Object.keys(tree).find(k => {
        const kClean = cleanSlug(k, false);
        const bName = tree[k].brandData ? cleanSlug(tree[k].brandData.nombre, false) : '';
        return kClean === marcaQuery || bName === marcaQuery || kClean.includes(marcaQuery) || marcaQuery.includes(kClean);
      });
      const modelos = [];
      if (bKey && tree[bKey].models) {
        Object.keys(tree[bKey].models).forEach((mSlug, mIdx) => {
          const m = tree[bKey].models[mSlug];
          const mData = m.modelData || {};
          const bData = tree[bKey].brandData || {};
          modelos.push({
            ModeloID: mIdx + 1,
            Slug: mSlug,
            Nombre: mData.nombre || mSlug,
            ImagenUrl: mData.imagen || '',
            Anios: mData.anios || '',
            Motor: mData.motor || 'Estándar',
            Combustible: mData.combustible || bData.combustible || 'gasolina',
            Categoria: mData.categoria || bData.categoria || 'sedan_hatchback',
            Activo: 1
          });
        });
      }
      return res.end(JSON.stringify({ status: 'success', data: modelos }));
    }

    case 'arbol_completo': {
      const marcaQ = cleanSlug(String(query.marca || ''), false);
      const modeloQ = cleanSlug(String(query.modelo || ''), false);
      const bKey = Object.keys(tree).find(k => {
        const kClean = cleanSlug(k, false);
        const bName = tree[k].brandData ? cleanSlug(tree[k].brandData.nombre, false) : '';
        return kClean === marcaQ || bName === marcaQ || kClean.includes(marcaQ) || marcaQ.includes(kClean);
      });
      const rows = [];

      if (bKey && tree[bKey].models) {
        const mKey = Object.keys(tree[bKey].models).find(k => {
          const kClean = cleanSlug(k, false);
          const mData = tree[bKey].models[k].modelData || {};
          const mName = cleanSlug(mData.nombre || '', false);
          return kClean === modeloQ || mName === modeloQ || kClean.includes(modeloQ) || modeloQ.includes(kClean) || mName.includes(modeloQ) || modeloQ.includes(mName);
        });
        if (mKey) {
          const modelObj = tree[bKey].models[mKey];
          const anios = modelObj.anios || {};
          Object.keys(anios).forEach(aKey => {
            const anioObj = anios[aKey];
            const motores = anioObj.motores || {};
            Object.keys(motores).forEach(motKey => {
              const motObj = motores[motKey];
              const archivos = motObj.archivos || [];
              archivos.forEach((arc, arcIdx) => {
                rows.push({
                  AnioID: 1,
                  Anio: aKey,
                  MotorID: 1,
                  NombreMotor: motKey,
                  Cilindrada: '',
                  TipoCombustible: (motObj.motorData && motObj.motorData.combustible) || 'diesel',
                  ArchivoID: arcIdx + 1,
                  Titulo: arc.titulo || arc.nombre || arc._id || 'Diagrama',
                  UrlArchivo: arc.pdfUrl || arc.diagramaUrl || arc.url || arc.imageUrl || '',
                  Tipo: arc.tipo || 'ecu',
                  Descripcion: arc.descripcion || '',
                  PinoutDetalle: arc.pinoutDetalle || '',
                  Icono: arc.icono || ''
                });
              });
            });
          });
        }
      }
      return res.end(JSON.stringify({ status: 'success', data: rows }));
    }

    case 'guardar_icono': {
      const cardKey = String(input.cardKey || input.key || input.titulo || '').trim();
      const icono = String(input.icono || input.icon || '').trim();
      const safeKey = cardKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const iconsPath = path.join(DATA_DIR, 'iconos_tarjetas.json');
      let iconsData = {};
      if (fs.existsSync(iconsPath)) {
        try { iconsData = JSON.parse(fs.readFileSync(iconsPath, 'utf8')); } catch(e) {}
      }
      if (cardKey && icono) {
        iconsData[cardKey] = icono;
        iconsData[safeKey] = icono;
        iconsData[cardKey.toUpperCase()] = icono;
        fs.writeFileSync(iconsPath, JSON.stringify(iconsData, null, 4), 'utf8');
      }

      const tree = getVehiculosData();
      let updatedTree = false;
      for (const b of Object.values(tree)) {
        for (const m of Object.values(b.models || {})) {
          for (const a of Object.values(m.anios || {})) {
            for (const mot of Object.values(a.motores || {})) {
              for (const arc of mot.archivos || []) {
                const arcKey = (arc._id || arc.id || arc.titulo || '').trim();
                if (arcKey === cardKey || arcKey.toUpperCase() === cardKey.toUpperCase()) {
                  arc.icono = icono;
                  updatedTree = true;
                }
              }
            }
          }
        }
      }
      if (updatedTree) {
        saveVehiculosData(tree);
      }

      return res.end(JSON.stringify({ status: 'success', message: 'Icono guardado permanentemente en el servidor.', cardKey, icono }));
    }

    case 'obtener_iconos': {
      const iconsPath = path.join(DATA_DIR, 'iconos_tarjetas.json');
      let iconsData = {};
      if (fs.existsSync(iconsPath)) {
        try { iconsData = JSON.parse(fs.readFileSync(iconsPath, 'utf8')); } catch(e) {}
      }
      return res.end(JSON.stringify({ status: 'success', data: iconsData }));
    }

    case 'save_marca': {
      const nombreMarca = String(input.marca || input.nombre || '').trim();
      const logoUrl = String(input.logo || input.logoUrl || '').trim();
      const combustible = String(input.combustible || 'diesel').trim();
      const categoria = String(input.categoria || 'vehiculos').trim();

      if (!nombreMarca) {
        res.writeHead(400);
        return res.end(JSON.stringify({ status: 'error', message: 'Nombre de marca requerido' }));
      }

      const slug = cleanSlug(nombreMarca, false);
      const marcaUpper = cleanSlug(nombreMarca, true);

      // Crear carpetas físicas
      const dirMarcaPruebas = path.join(DIAGRAMAS_DIR, marcaUpper);
      fs.mkdirSync(dirMarcaPruebas, { recursive: true });

      if (!tree[slug]) {
        tree[slug] = {
          brandData: {
            nombre: marcaUpper,
            logo: logoUrl,
            combustible,
            categoria
          },
          models: {}
        };
      } else {
        tree[slug].brandData = {
          ...tree[slug].brandData,
          nombre: marcaUpper,
          logo: logoUrl || tree[slug].brandData.logo,
          combustible,
          categoria
        };
      }
      saveVehiculosData(tree);
      return res.end(JSON.stringify({ status: 'success', message: 'Marca guardada exitosamente en local.', marca: marcaUpper, slug }));
    }

    case 'save_modelo': {
      const nombreMarca = String(input.marca || '').trim();
      const nombreModelo = String(input.modelo || '').trim();
      const anios = String(input.anios || input.anio || '').trim();
      const motor = String(input.motor || '').trim() || 'Motor Estándar';
      const combustible = String(input.combustible || 'diesel').trim();
      const categoria = String(input.categoria || 'pickup').trim();
      const imagenUrl = String(input.imagenUrl || input.imagen || '').trim();

      if (!nombreMarca || !nombreModelo) {
        res.writeHead(400);
        return res.end(JSON.stringify({ status: 'error', message: 'Marca y modelo requeridos' }));
      }

      const bSlug = cleanSlug(nombreMarca, false);
      const marcaUpper = cleanSlug(nombreMarca, true);
      const mSlug = cleanSlug(nombreModelo, false);
      const motorClean = cleanSlug(motor, false);

      // Crear carpetas físicas de almacenamiento para el modelo
      const dirModelPruebas = path.join(DIAGRAMAS_DIR, marcaUpper, mSlug, motorClean, 'ecu', 'imagen');
      const dirModelConexion = path.join(DIAGRAMAS_DIR, marcaUpper, mSlug, motorClean, 'ecu', 'conexionado');
      fs.mkdirSync(dirModelPruebas, { recursive: true });
      fs.mkdirSync(dirModelConexion, { recursive: true });

      if (!tree[bSlug]) {
        tree[bSlug] = { brandData: { nombre: marcaUpper, logo: '', combustible, categoria }, models: {} };
      }
      if (!tree[bSlug].models[mSlug]) {
        tree[bSlug].models[mSlug] = {
          modelData: {
            _id: mSlug,
            nombre: nombreModelo,
            anios,
            motor,
            combustible,
            imagen: imagenUrl,
            categoria
          },
          anios: {}
        };
      }

      const anioKey = anios || 'Estándar';
      if (!tree[bSlug].models[mSlug].anios[anioKey]) {
        tree[bSlug].models[mSlug].anios[anioKey] = { anioData: { _id: anioKey }, motores: {} };
      }
      if (!tree[bSlug].models[mSlug].anios[anioKey].motores[motor]) {
        tree[bSlug].models[mSlug].anios[anioKey].motores[motor] = {
          motorData: { _id: motor, combustible, imagenUrl, titulo: motor },
          archivos: []
        };
      }

      saveVehiculosData(tree);
      return res.end(JSON.stringify({
        status: 'success',
        message: 'Modelo guardado localmente y carpetas creadas.',
        data: { modelo: nombreModelo.toUpperCase(), imagen: imagenUrl }
      }));
    }

    case 'subir_foto':
    case 'upload_foto': {
      const file = files.archivo || files.imagen;
      if (!file) {
        res.writeHead(400);
        return res.end(JSON.stringify({ status: 'error', message: 'No se recibió archivo de imagen' }));
      }

      const marcaClean = cleanSlug(input.marca || 'TOYOTA', true);
      const bSlug = cleanSlug(input.marca || 'toyota', false);
      const modeloClean = cleanSlug(input.modelo || 'modelo', false);
      const motorClean = cleanSlug(input.motor || 'motor', false);
      const componenteClean = normalizeComponente(input.componente || 'ecu');
      const tipoClean = (input.tipo_carpeta === 'conexionado') ? 'conexionado' : 'imagen';

      // Búsqueda elástica de la carpeta de motor existente en disco
      const modelPath = path.join(DIAGRAMAS_DIR, marcaClean, modeloClean);
      let motorFolder = motorClean;
      if (fs.existsSync(modelPath)) {
        const motorDirs = fs.readdirSync(modelPath).filter(d => {
          try { return fs.statSync(path.join(modelPath, d)).isDirectory() && !d.startsWith('.'); } catch { return false; }
        });
        const exactMatch = motorDirs.find(d => d.toLowerCase() === motorClean.toLowerCase() || motorClean.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(motorClean.toLowerCase()));
        if (exactMatch) {
          motorFolder = exactMatch;
        } else {
          // Verificar si el componente ya existe dentro de alguna carpeta de motor
          const compMatch = motorDirs.find(d => fs.existsSync(path.join(modelPath, d, componenteClean)));
          if (compMatch) {
            motorFolder = compMatch;
          } else if (motorDirs.length === 1) {
            motorFolder = motorDirs[0];
          }
        }
      }

      const targetDir = path.join(DIAGRAMAS_DIR, marcaClean, modeloClean, motorFolder, componenteClean, tipoClean);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.mkdirSync(path.join(DIAGRAMAS_DIR, marcaClean, modeloClean, motorFolder, componenteClean, 'conexionado'), { recursive: true });
      fs.mkdirSync(path.join(DIAGRAMAS_DIR, marcaClean, modeloClean, motorFolder, componenteClean, 'imagen'), { recursive: true });

      const existingFiles = fs.readdirSync(targetDir).filter(f => !f.startsWith('.'));
      const ext = path.extname(file.filename || 'foto.jpg').toLowerCase() || '.jpg';
      const num = existingFiles.length + 1;
      const cleanFileName = `${modeloClean}_${componenteClean}_${num}${ext}`;
      const finalPath = path.join(targetDir, cleanFileName);

      fs.writeFileSync(finalPath, file.data);

      const relativeUrl = `archivos_almacenamiento/diagramas_PRUEBAS/${marcaClean}/${modeloClean}/${motorFolder}/${componenteClean}/${tipoClean}/${cleanFileName}`;

      // Actualizar vehiculos_diagramas.json
      try {
        const tree = getVehiculosData();
        const brandKey = Object.keys(tree).find(k => k.toLowerCase() === bSlug.toLowerCase() || cleanSlug(k, false) === bSlug || (tree[k].brandData && cleanSlug(tree[k].brandData.nombre, false) === bSlug)) || bSlug;
        if (!tree[brandKey]) {
          tree[brandKey] = { brandData: { nombre: marcaClean, logo: '', combustible: 'gasolina', categoria: 'vehiculos' }, models: {} };
        }
        if (!tree[brandKey].models) tree[brandKey].models = {};

        const modelKey = Object.keys(tree[brandKey].models).find(k => k.toLowerCase() === modeloClean.toLowerCase() || cleanSlug(k, false) === modeloClean) || modeloClean;
        if (!tree[brandKey].models[modelKey]) {
          tree[brandKey].models[modelKey] = {
            modelData: { _id: modelKey, nombre: input.modelo || modeloClean, anios: input.anio || 'Estándar', motor: input.motor || motorFolder, combustible: 'gasolina', imagen: '', categoria: 'vehiculos' },
            anios: {}
          };
        }

        const mObj = tree[brandKey].models[modelKey];
        if (!mObj.anios) mObj.anios = {};
        const anioKey = Object.keys(mObj.anios)[0] || input.anio || 'Estándar';
        if (!mObj.anios[anioKey]) mObj.anios[anioKey] = { anioData: { _id: anioKey }, motores: {} };
        const motores = mObj.anios[anioKey].motores || {};
        const motKey = Object.keys(motores).find(k => cleanSlug(k, false) === motorFolder || cleanSlug(k, false) === motorClean) || Object.keys(motores)[0] || motorFolder;
        if (!motores[motKey]) motores[motKey] = { motorData: { _id: motKey, combustible: 'gasolina', imagenUrl: '', titulo: motKey }, archivos: [] };

        const archivos = motores[motKey].archivos || [];
        motores[motKey].archivos = archivos;
        const compTitle = (input.componente || componenteClean).toUpperCase();
        const arcIdx = archivos.findIndex(arc => arc.tipo === componenteClean || (arc.titulo || arc.nombre || arc._id || '').toUpperCase().includes(compTitle) || compTitle.includes((arc.titulo || arc.nombre || arc._id || '').toUpperCase()));

        if (arcIdx >= 0) {
          if (tipoClean === 'conexionado') {
            archivos[arcIdx].diagramaUrl = relativeUrl;
            archivos[arcIdx].url = relativeUrl;
            if (cleanFileName.toLowerCase().endsWith('.pdf')) {
              archivos[arcIdx].pdfUrl = relativeUrl;
            }
          } else {
            const photos = Array.isArray(archivos[arcIdx].imagenes) ? archivos[arcIdx].imagenes : (Array.isArray(archivos[arcIdx].allImages) ? archivos[arcIdx].allImages : []);
            if (!photos.includes(relativeUrl)) {
              if (input.posicion === 'first') photos.unshift(relativeUrl);
              else photos.push(relativeUrl);
            }
            archivos[arcIdx].imagenes = photos;
            archivos[arcIdx].allImages = photos;
            archivos[arcIdx].fotos = photos;
            if (!archivos[arcIdx].imageUrl || input.posicion === 'first') {
              archivos[arcIdx].imageUrl = relativeUrl;
            }
          }
        } else {
          archivos.push({
            _id: input.componente || componenteClean,
            titulo: (input.componente || componenteClean).toUpperCase(),
            tipo: componenteClean,
            diagramaUrl: tipoClean === 'conexionado' ? relativeUrl : '',
            pdfUrl: (tipoClean === 'conexionado' && cleanFileName.toLowerCase().endsWith('.pdf')) ? relativeUrl : '',
            url: relativeUrl,
            imageUrl: tipoClean === 'imagen' ? relativeUrl : '',
            imagenes: tipoClean === 'imagen' ? [relativeUrl] : [],
            allImages: tipoClean === 'imagen' ? [relativeUrl] : [],
            fotos: tipoClean === 'imagen' ? [relativeUrl] : []
          });
        }
        saveVehiculosData(tree);
      } catch (e) {
        console.error('Error al actualizar vehiculos_diagramas.json en subir_foto:', e.message);
      }

      return res.end(JSON.stringify({
        status: 'success',
        message: 'Imagen guardada exitosamente en disco local.',
        url: relativeUrl,
        fileName: cleanFileName,
        path: relativeUrl
      }));
    }

    case 'listar_fotos':
    case 'get_fotos': {
      const marcaClean = cleanSlug(query.marca || 'TOYOTA', true);
      const modeloClean = cleanSlug(query.modelo || 'modelo', false);
      const motorClean = cleanSlug(query.motor || 'motor', false);
      const componenteClean = normalizeComponente(query.componente || 'ecu');

      const modelPath = path.join(DIAGRAMAS_DIR, marcaClean, modeloClean);
      let imgDir = path.join(modelPath, motorClean, componenteClean, 'imagen');
      let motorFolder = motorClean;

      if (!fs.existsSync(imgDir) && fs.existsSync(modelPath)) {
        const motorDirs = fs.readdirSync(modelPath).filter(d => {
          try { return fs.statSync(path.join(modelPath, d)).isDirectory() && !d.startsWith('.'); } catch { return false; }
        });
        const found = motorDirs.find(d => fs.existsSync(path.join(modelPath, d, componenteClean, 'imagen')));
        if (found) {
          imgDir = path.join(modelPath, found, componenteClean, 'imagen');
          motorFolder = found;
        } else if (motorDirs.length === 1) {
          imgDir = path.join(modelPath, motorDirs[0], componenteClean, 'imagen');
          motorFolder = motorDirs[0];
        }
      }

      const fotos = [];
      if (fs.existsSync(imgDir)) {
        const filesOnDisk = fs.readdirSync(imgDir).filter(f => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f) && !f.startsWith('.')).sort();
        filesOnDisk.forEach(f => {
          fotos.push(`archivos_almacenamiento/diagramas_PRUEBAS/${marcaClean}/${modeloClean}/${motorFolder}/${componenteClean}/imagen/${f}`);
        });
      }

      return res.end(JSON.stringify({ status: 'success', data: fotos, fotos: fotos, total: fotos.length, count: fotos.length }));
    }

    case 'listar_conexionados':
    case 'get_conexionados': {
      const marcaClean = cleanSlug(query.marca || 'TOYOTA', true);
      const modeloClean = cleanSlug(query.modelo || 'modelo', false);
      const motorClean = cleanSlug(query.motor || 'motor', false);
      const componenteClean = normalizeComponente(query.componente || 'ecu');

      const modelPath = path.join(DIAGRAMAS_DIR, marcaClean, modeloClean);
      let connDir = path.join(modelPath, motorClean, componenteClean, 'conexionado');
      let motorFolder = motorClean;

      if (!fs.existsSync(connDir) && fs.existsSync(modelPath)) {
        const motorDirs = fs.readdirSync(modelPath).filter(d => {
          try { return fs.statSync(path.join(modelPath, d)).isDirectory() && !d.startsWith('.'); } catch { return false; }
        });
        const found = motorDirs.find(d => fs.existsSync(path.join(modelPath, d, componenteClean, 'conexionado')));
        if (found) {
          connDir = path.join(modelPath, found, componenteClean, 'conexionado');
          motorFolder = found;
        } else if (motorDirs.length === 1) {
          connDir = path.join(modelPath, motorDirs[0], componenteClean, 'conexionado');
          motorFolder = motorDirs[0];
        }
      }

      const filesList = [];
      if (fs.existsSync(connDir)) {
        const filesOnDisk = fs.readdirSync(connDir).filter(f => /\.(pdf|jpg|jpeg|png|webp|svg)$/i.test(f) && !f.startsWith('.')).sort();
        filesOnDisk.forEach(f => {
          filesList.push(`archivos_almacenamiento/diagramas_PRUEBAS/${marcaClean}/${modeloClean}/${motorFolder}/${componenteClean}/conexionado/${f}`);
        });
      }

      return res.end(JSON.stringify({ status: 'success', data: filesList, diagramas: filesList, total: filesList.length, count: filesList.length }));
    }

    case 'save_diagrama': {
      const marcaRaw = String(input.marca || '').trim();
      const modeloRaw = String(input.modelo || '').trim();
      const anioRaw = String(input.anios || input.anio || 'Estándar').trim();
      const motorRaw = String(input.motor || 'Motor Estándar').trim();
      const titulo = String(input.titulo || 'Diagrama').trim();
      const tipo = String(input.tipo || 'ecu').trim();
      let urlArchivo = String(input.url_archivo || input.url || '').trim();
      const descripcion = String(input.descripcion || '').trim();
      const tipoCarpeta = (input.tipo_carpeta === 'imagen' || input.tipo_carpeta === 'foto') ? 'imagen' : (input.tipo_carpeta === 'conexionado' ? 'conexionado' : (urlArchivo.toLowerCase().includes('.pdf') ? 'conexionado' : 'imagen'));

      const marcaClean = cleanSlug(marcaRaw, true);
      const bSlug = cleanSlug(marcaRaw, false);
      const modeloClean = cleanSlug(modeloRaw, false);
      const mSlug = modeloClean;
      const motorClean = cleanSlug(motorRaw, false);
      const compSlug = normalizeComponente(tipo || titulo);

      // Crear carpetas físicas estrictamente para el componente que se está subiendo
      const compDir = path.join(DIAGRAMAS_DIR, marcaClean, modeloClean, motorClean, compSlug);
      const conxDir = path.join(compDir, 'conexionado');
      const imgDir = path.join(compDir, 'imagen');
      fs.mkdirSync(conxDir, { recursive: true });
      fs.mkdirSync(imgDir, { recursive: true });

      const destDir = (tipoCarpeta === 'imagen') ? imgDir : conxDir;

      // Si se envió un archivo en base64 (data:...), guardarlo físicamente como archivo real en la carpeta destino seleccionada
      if (urlArchivo.startsWith('data:')) {
        try {
          const matches = urlArchivo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mime = matches[1];
            const base64Data = matches[2];
            let ext = (tipoCarpeta === 'imagen') ? '.jpg' : '.pdf';
            if (mime.includes('pdf')) ext = '.pdf';
            else if (mime.includes('png')) ext = '.png';
            else if (mime.includes('webp')) ext = '.webp';
            else if (mime.includes('svg')) ext = '.svg';

            const cleanFileName = (tipoCarpeta === 'imagen')
              ? `foto_${modeloClean}_${compSlug}_1${ext}`
              : `diagrama_${modeloClean}_${compSlug}${ext}`;
            const diskPath = path.join(destDir, cleanFileName);
            fs.writeFileSync(diskPath, Buffer.from(base64Data, 'base64'));
            urlArchivo = `archivos_almacenamiento/diagramas_PRUEBAS/${marcaClean}/${modeloClean}/${motorClean}/${compSlug}/${tipoCarpeta}/${cleanFileName}`;
          }
        } catch (e) {
          console.error('Error al guardar archivo base64 en disco:', e.message);
        }
      }

      // Asegurar en el árbol JSON
      const bKey = Object.keys(tree).find(k => k.toLowerCase() === bSlug.toLowerCase() || cleanSlug(k, false) === bSlug || (tree[k].brandData && cleanSlug(tree[k].brandData.nombre, false) === bSlug)) || bSlug;
      if (!tree[bKey]) {
        tree[bKey] = { brandData: { nombre: marcaClean, logo: '', combustible: 'gasolina', categoria: 'vehiculos' }, models: {} };
      }
      const bObj = tree[bKey];
      if (!bObj.models) bObj.models = {};

      const mKey = Object.keys(bObj.models).find(k => k.toLowerCase() === mSlug.toLowerCase() || cleanSlug(k, false) === mSlug || (bObj.models[k].modelData && cleanSlug(bObj.models[k].modelData.nombre, false) === mSlug)) || mSlug;
      if (!bObj.models[mKey]) {
        bObj.models[mKey] = {
          modelData: { _id: mKey, nombre: modeloRaw, anios: anioRaw, motor: motorRaw, combustible: 'gasolina', imagen: '', categoria: 'vehiculos' },
          anios: {}
        };
      }

      const mObj = bObj.models[mKey];
      if (!mObj.anios) mObj.anios = {};

      const anioClean = anioRaw.replace(/\s+/g, '');
      const aKey = Object.keys(mObj.anios).find(k => k.replace(/\s+/g, '') === anioClean) || Object.keys(mObj.anios)[0] || anioRaw;
      if (!mObj.anios[aKey]) {
        mObj.anios[aKey] = { anioData: { _id: aKey }, motores: {} };
      }

      const aObj = mObj.anios[aKey];
      if (!aObj.motores) aObj.motores = {};

      const motorCleanKey = cleanSlug(motorRaw, false);
      const motKey = Object.keys(aObj.motores).find(k => cleanSlug(k, false) === motorCleanKey || k.toLowerCase() === motorRaw.toLowerCase()) || Object.keys(aObj.motores)[0] || motorRaw;
      if (!aObj.motores[motKey]) {
        aObj.motores[motKey] = { motorData: { _id: motKey, combustible: 'gasolina', imagenUrl: '', titulo: motKey }, archivos: [] };
      }

      const archivos = aObj.motores[motKey].archivos || [];
      aObj.motores[motKey].archivos = archivos;
      const isImg = (tipoCarpeta === 'imagen');

      // Buscar si ya existe una entrada para este componente (ej. ECU, Distribuidor, Pedal) para actualizarla
      const existingIdx = archivos.findIndex(arc => (arc.tipo === compSlug) || (arc.titulo || arc.nombre || arc._id || '').toUpperCase() === titulo.toUpperCase() || (arc.titulo || '').toUpperCase().includes(compSlug.toUpperCase()));
      const existingArc = existingIdx >= 0 ? archivos[existingIdx] : {};
      const existingPhotos = Array.isArray(existingArc.imagenes) ? existingArc.imagenes : (Array.isArray(existingArc.allImages) ? existingArc.allImages : []);
      const combinedPhotos = isImg ? [...new Set([...existingPhotos, urlArchivo])].filter(p => !p.toLowerCase().includes('/conexionado/')) : existingPhotos;

      const newDiagramData = {
        _id: titulo,
        titulo: existingArc.titulo || titulo,
        tipo: compSlug,
        pdfUrl: isImg ? (existingArc.pdfUrl || '') : urlArchivo,
        diagramaUrl: isImg ? (existingArc.diagramaUrl || '') : urlArchivo,
        url: isImg ? (existingArc.url || urlArchivo) : urlArchivo,
        imageUrl: isImg ? urlArchivo : (existingArc.imageUrl || (combinedPhotos[0] || '')),
        descripcion,
        imagenes: combinedPhotos,
        allImages: combinedPhotos,
        fotos: combinedPhotos
      };

      if (existingIdx >= 0) {
        archivos[existingIdx] = { ...archivos[existingIdx], ...newDiagramData };
      } else {
        archivos.push(newDiagramData);
      }

      saveVehiculosData(tree);

      return res.end(JSON.stringify({
        status: 'success',
        message: 'Diagrama y carpetas guardadas físicamente en disco local.',
        url: urlArchivo,
        ruta_local: urlArchivo,
        tipo_carpeta: tipoCarpeta
      }));
    }

    case 'guardar_icono': {
      const cardKey = String(input.cardKey || input.key || input.titulo || '').trim();
      const icono = String(input.icono || input.icon || '').trim();
      const iconsPath = path.join(DATA_DIR, 'iconos_tarjetas.json');
      let icons = {};
      if (fs.existsSync(iconsPath)) {
        try { icons = JSON.parse(fs.readFileSync(iconsPath, 'utf8')); } catch {}
      }
      icons[cardKey] = icono;
      icons[cardKey.toUpperCase()] = icono;
      fs.writeFileSync(iconsPath, JSON.stringify(icons, null, 2), 'utf8');
      return res.end(JSON.stringify({ status: 'success', message: 'Ícono guardado localmente.' }));
    }

    case 'obtener_iconos': {
      const iconsPath = path.join(DATA_DIR, 'iconos_tarjetas.json');
      let icons = {};
      if (fs.existsSync(iconsPath)) {
        try { icons = JSON.parse(fs.readFileSync(iconsPath, 'utf8')); } catch {}
      }
      return res.end(JSON.stringify({ status: 'success', data: icons }));
    }

    case 'save_hotspots':
    case 'guardar_hotspots': {
      const key = String(input.id_key || input.key || input.diagrama_id || '').trim();
      const data = input.data || input.hotspots || [];
      const hsPath = path.join(DATA_DIR, 'hotspots.json');
      let allHs = {};
      if (fs.existsSync(hsPath)) {
        try { allHs = JSON.parse(fs.readFileSync(hsPath, 'utf8')); } catch {}
      }
      allHs[key] = data;
      fs.writeFileSync(hsPath, JSON.stringify(allHs, null, 2), 'utf8');
      return res.end(JSON.stringify({ status: 'success', message: 'Puntos guardados localmente.' }));
    }

    case 'get_hotspots':
    case 'obtener_hotspots': {
      const key = String(query.id_key || query.key || '').trim();
      const hsPath = path.join(DATA_DIR, 'hotspots.json');
      let allHs = {};
      if (fs.existsSync(hsPath)) {
        try { allHs = JSON.parse(fs.readFileSync(hsPath, 'utf8')); } catch {}
      }
      return res.end(JSON.stringify({ status: 'success', data: allHs[key] || [] }));
    }

    case 'delete_marca': {
      const nombreMarca = String(input.marca || input.nombre || query.marca || query.nombre || '').trim();
      const bSlug = cleanSlug(nombreMarca, false);
      const marcaUpper = cleanSlug(nombreMarca, true);

      if (tree[bSlug]) {
        delete tree[bSlug];
        saveVehiculosData(tree);
      }

      // Eliminar carpeta física de la marca en disco duro
      const dirMarca = path.join(DIAGRAMAS_DIR, marcaUpper);
      if (fs.existsSync(dirMarca)) {
        try {
          fs.rmSync(dirMarca, { recursive: true, force: true });
        } catch (e) {
          console.error('Error al eliminar carpeta de marca:', e.message);
        }
      }
      return res.end(JSON.stringify({ status: 'success', message: 'Marca y carpetas eliminadas físicamente del disco local.' }));
    }

    case 'delete_modelo': {
      const nombreMarca = String(input.marca || query.marca || '').trim();
      const nombreModelo = String(input.modelo || query.modelo || '').trim();
      const bSlug = cleanSlug(nombreMarca, false);
      const marcaUpper = cleanSlug(nombreMarca, true);
      const mSlug = cleanSlug(nombreModelo, false);

      if (tree[bSlug] && tree[bSlug].models) {
        const foundKey = Object.keys(tree[bSlug].models).find(k => k === mSlug || (tree[bSlug].models[k].modelData && String(tree[bSlug].models[k].modelData.nombre).toLowerCase() === nombreModelo.toLowerCase()));
        if (foundKey) {
          delete tree[bSlug].models[foundKey];
          saveVehiculosData(tree);
        }
      }

      // Eliminar carpetas físicas del modelo en disco duro
      const modelDirs = [
        path.join(DIAGRAMAS_DIR, marcaUpper, mSlug),
        path.join(DIAGRAMAS_DIR, marcaUpper, cleanSlug(nombreModelo, false))
      ];
      modelDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          try {
            fs.rmSync(dir, { recursive: true, force: true });
          } catch (e) {}
        }
      });

      return res.end(JSON.stringify({ status: 'success', message: 'Modelo y carpetas eliminadas físicamente del disco local.' }));
    }

    case 'delete_diagrama': {
      const marcaRaw = String(input.marca || query.marca || '').trim();
      const modeloRaw = String(input.modelo || query.modelo || '').trim();
      const motorRaw = String(input.motor || query.motor || '').trim();
      const titulo = String(input.titulo || query.titulo || input.archivo_id || query.archivo_id || '').trim();
      const tipo = String(input.tipo || query.tipo || '').trim();

      const marcaClean = cleanSlug(marcaRaw, true);
      const bSlug = cleanSlug(marcaRaw, false);
      const modeloClean = cleanSlug(modeloRaw, false);
      const mSlug = modeloClean;
      const motorClean = cleanSlug(motorRaw, false);
      const compSlug = normalizeComponente(tipo || titulo);

      // 1. Eliminar del árbol JSON
      Object.keys(tree).forEach(bKey => {
        if (!bSlug || bKey === bSlug || cleanSlug(bKey, false) === bSlug) {
          const models = tree[bKey].models || {};
          Object.keys(models).forEach(mKey => {
            if (!mSlug || mKey === mSlug || cleanSlug(mKey, false) === mSlug) {
              const mObj = models[mKey];
              Object.keys(mObj.anios || {}).forEach(aKey => {
                Object.keys(mObj.anios[aKey].motores || {}).forEach(motKey => {
                  const archivos = mObj.anios[aKey].motores[motKey].archivos || [];
                  mObj.anios[aKey].motores[motKey].archivos = archivos.filter(arc => {
                    const arcTitle = String(arc.titulo || arc.nombre || arc._id || '').toUpperCase();
                    const arcTipo = String(arc.tipo || '').toLowerCase();
                    const matchTitle = titulo && (arcTitle === titulo.toUpperCase() || arc._id === titulo);
                    const matchTipo = compSlug && (arcTipo === compSlug || normalizeComponente(arcTitle) === compSlug);
                    return !(matchTitle || matchTipo);
                  });
                });
              });
            }
          });
        }
      });
      saveVehiculosData(tree);

      return res.end(JSON.stringify({ status: 'success', message: 'Tarjeta eliminada del catálogo exitosamente. Los archivos de respaldo se conservan seguros.' }));
    }

    default:
      return res.end(JSON.stringify({ status: 'success', message: `Acción ${action} ejecutada en local.`, data: [] }));
  }
}

// Servidor Principal HTTP
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Endpoint de verificación
  if (pathname === '/api/status') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.end(JSON.stringify({ status: 'online', mode: 'localhost', time: new Date().toISOString() }));
  }

  // Interceptar subidas de archivos (/api/upload.php y /api/upload)
  if (pathname.startsWith('/api/upload.php') || pathname === '/api/upload') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const bodyBuffer = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      let input = {};
      let files = {};

      if (contentType.includes('multipart/form-data')) {
        const boundaryMatch = contentType.match(/boundary=(?:["']?)([^"';]+)(?:["']?)/i);
        if (boundaryMatch) {
          const parsed = parseMultipart(bodyBuffer, boundaryMatch[1]);
          input = parsed.fields;
          files = parsed.files;
        }
      }

      const file = files.archivo || files.file || files.imagen;
      if (!file) {
        res.writeHead(400);
        return res.end(JSON.stringify({ status: 'error', message: 'No se recibió ningún archivo.' }));
      }

      const categoria = String(input.categoria || 'diagramas').replace(/[^a-zA-Z0-9_-]/g, '') || 'diagramas';
      const subcarpeta = String(input.subcarpeta || '').replace(/[^a-zA-Z0-9_\-\/]/g, '_');
      const targetFolder = path.join(STORAGE_DIR, categoria, subcarpeta);
      fs.mkdirSync(targetFolder, { recursive: true });

      const ext = path.extname(file.filename || 'diagrama.pdf').toLowerCase() || '.pdf';
      const originalName = path.basename(file.filename || 'archivo', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const finalFileName = `${originalName}_${Date.now()}${ext}`;
      const diskPath = path.join(targetFolder, finalFileName);

      fs.writeFileSync(diskPath, file.data);

      const relPath = `archivos_almacenamiento/${categoria}${subcarpeta ? '/' + subcarpeta : ''}/${finalFileName}`;

      return res.end(JSON.stringify({
        status: 'success',
        message: 'Archivo subido correctamente en disco local.',
        ruta_local: relPath,
        url: relPath,
        url_completa: relPath,
        nombre_archivo: finalFileName
      }));
    });
    return;
  }

  // Interceptar APIs de PHP
  if (pathname.startsWith('/api/diagramas.php') || pathname === '/api/diagramas') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const bodyBuffer = Buffer.concat(chunks);
      handleDiagramasApi(req, res, parsedUrl.query, bodyBuffer);
    });
    return;
  }

  // Otras APIs genéricas (manuales, productos, etc.)
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const genericName = pathname.replace('/api/', '').replace('.php', '');
    const jsonFile = path.join(DATA_DIR, `${genericName}.json`);
    if (fs.existsSync(jsonFile)) {
      return res.end(fs.readFileSync(jsonFile, 'utf8'));
    }
    return res.end(JSON.stringify({ status: 'success', data: [] }));
  }

  // Archivo estático
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(`404 No encontrado: ${pathname}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 PROBAKTRONIC - Servidor Local Seguro ACTIVO`);
  console.log(`📍 Web Principal:      http://localhost:${PORT}/vehiculos.html`);
  console.log(`📍 Dashboard:          http://localhost:${PORT}/dashboard.html`);
  console.log(`📂 Almacenamiento:     ${DIAGRAMAS_DIR}`);
  console.log(`🔒 Modo:               100% Localhost (Sin tocar el Hosting)`);
  console.log(`==================================================\n`);
});
