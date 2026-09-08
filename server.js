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
  if (upper.includes('ECU') || upper.includes('COMPUTADORA') || upper.includes('ECM') || upper.includes('PCM')) return 'ecu';
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
      const marcaQuery = String(query.marca || '').toLowerCase();
      const bKey = Object.keys(tree).find(k => k.toLowerCase() === marcaQuery || (tree[k].brandData && tree[k].brandData.nombre.toLowerCase() === marcaQuery));
      const modelos = [];
      if (bKey && tree[bKey].models) {
        Object.keys(tree[bKey].models).forEach((mSlug, mIdx) => {
          const m = tree[bKey].models[mSlug];
          const mData = m.modelData || {};
          modelos.push({
            ModeloID: mIdx + 1,
            Slug: mSlug,
            Nombre: mData.nombre || mSlug,
            ImagenUrl: mData.imagen || '',
            Anios: mData.anios || '',
            Motor: mData.motor || '',
            Combustible: mData.combustible || 'diesel',
            Activo: 1
          });
        });
      }
      return res.end(JSON.stringify({ status: 'success', data: modelos }));
    }

    case 'arbol_completo': {
      const marcaQ = String(query.marca || '').toLowerCase();
      const modeloQ = String(query.modelo || '').toLowerCase();
      const bKey = Object.keys(tree).find(k => k.toLowerCase() === marcaQ || (tree[k].brandData && tree[k].brandData.nombre.toLowerCase() === marcaQ));
      const rows = [];

      if (bKey && tree[bKey].models) {
        const mKey = Object.keys(tree[bKey].models).find(k => k.toLowerCase() === modeloQ || (tree[bKey].models[k].modelData && tree[bKey].models[k].modelData.nombre.toLowerCase() === modeloQ));
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
      const imagenUrl = String(input.imagenUrl || input.imagen || '').trim();

      if (!nombreMarca || !nombreModelo) {
        res.writeHead(400);
        return res.end(JSON.stringify({ status: 'error', message: 'Marca y modelo requeridos' }));
      }

      const bSlug = cleanSlug(nombreMarca, false);
      const marcaUpper = cleanSlug(nombreMarca, true);
      const mSlug = cleanSlug(nombreModelo, false);
      const motorClean = cleanSlug(motor, false);

      if (!tree[bSlug]) {
        tree[bSlug] = { brandData: { nombre: marcaUpper, logo: '', combustible, categoria: 'vehiculos' }, models: {} };
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
            categoria: 'vehiculos'
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
        message: 'Modelo guardado localmente.',
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
      const modeloClean = cleanSlug(input.modelo || 'modelo', false);
      const motorClean = cleanSlug(input.motor || 'motor', false);
      const componenteClean = normalizeComponente(input.componente || 'ecu');
      const tipoClean = (input.tipo_carpeta === 'conexionado') ? 'conexionado' : 'imagen';

      const targetDir = path.join(DIAGRAMAS_DIR, marcaClean, modeloClean, motorClean, componenteClean, tipoClean);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.mkdirSync(path.join(DIAGRAMAS_DIR, marcaClean, modeloClean, motorClean, componenteClean, 'conexionado'), { recursive: true });
      fs.mkdirSync(path.join(DIAGRAMAS_DIR, marcaClean, modeloClean, motorClean, componenteClean, 'imagen'), { recursive: true });

      const existingFiles = fs.readdirSync(targetDir).filter(f => !f.startsWith('.'));
      const ext = path.extname(file.filename || 'foto.jpg').toLowerCase() || '.jpg';
      const num = existingFiles.length + 1;
      const cleanFileName = `${modeloClean}_${componenteClean}_${num}${ext}`;
      const finalPath = path.join(targetDir, cleanFileName);

      fs.writeFileSync(finalPath, file.data);

      const relativeUrl = `archivos_almacenamiento/diagramas_PRUEBAS/${marcaClean}/${modeloClean}/${motorClean}/${componenteClean}/${tipoClean}/${cleanFileName}`;

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

      const imgDir = path.join(DIAGRAMAS_DIR, marcaClean, modeloClean, motorClean, componenteClean, 'imagen');
      const fotos = [];

      if (fs.existsSync(imgDir)) {
        const filesOnDisk = fs.readdirSync(imgDir).filter(f => /\.(jpg|jpeg|png|webp|svg)$/i.test(f)).sort();
        filesOnDisk.forEach(f => {
          fotos.push(`archivos_almacenamiento/diagramas_PRUEBAS/${marcaClean}/${modeloClean}/${motorClean}/${componenteClean}/imagen/${f}`);
        });
      }

      return res.end(JSON.stringify({ status: 'success', data: fotos, count: fotos.length }));
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

      // Si se envió un archivo en base64 (data:...), guardarlo físicamente como archivo real en conexionado
      if (urlArchivo.startsWith('data:')) {
        try {
          const matches = urlArchivo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mime = matches[1];
            const base64Data = matches[2];
            let ext = '.jpg';
            if (mime.includes('pdf')) ext = '.pdf';
            else if (mime.includes('png')) ext = '.png';
            else if (mime.includes('webp')) ext = '.webp';
            else if (mime.includes('svg')) ext = '.svg';

            const cleanFileName = `diagrama_${modeloClean}_${compSlug}${ext}`;
            const diskPath = path.join(conxDir, cleanFileName);
            fs.writeFileSync(diskPath, Buffer.from(base64Data, 'base64'));
            urlArchivo = `archivos_almacenamiento/diagramas_PRUEBAS/${marcaClean}/${modeloClean}/${motorClean}/${compSlug}/conexionado/${cleanFileName}`;
          }
        } catch (e) {
          console.error('Error al guardar archivo base64 en disco:', e.message);
        }
      }

      // Asegurar en el árbol JSON
      if (!tree[bSlug]) {
        tree[bSlug] = { brandData: { nombre: marcaClean, logo: '', combustible: 'gasolina', categoria: 'vehiculos' }, models: {} };
      }
      if (!tree[bSlug].models[mSlug]) {
        tree[bSlug].models[mSlug] = {
          modelData: { _id: mSlug, nombre: modeloRaw, anios: anioRaw, motor: motorRaw, combustible: 'gasolina', imagen: '', categoria: 'vehiculos' },
          anios: {}
        };
      }

      const mObj = tree[bSlug].models[mSlug];
      if (!mObj.anios[anioRaw]) mObj.anios[anioRaw] = { anioData: { _id: anioRaw }, motores: {} };
      if (!mObj.anios[anioRaw].motores[motorRaw]) mObj.anios[anioRaw].motores[motorRaw] = { motorData: { _id: motorRaw }, archivos: [] };

      const archivos = mObj.anios[anioRaw].motores[motorRaw].archivos;
      const isPdf = urlArchivo.toLowerCase().includes('.pdf');
      archivos.push({
        _id: titulo,
        titulo,
        tipo: compSlug,
        pdfUrl: urlArchivo,
        diagramaUrl: urlArchivo,
        url: urlArchivo,
        imageUrl: isPdf ? '' : urlArchivo,
        descripcion,
        imagenes: isPdf ? [] : [urlArchivo],
        allImages: isPdf ? [] : [urlArchivo]
      });
      saveVehiculosData(tree);

      return res.end(JSON.stringify({
        status: 'success',
        message: 'Diagrama y carpetas guardadas físicamente en disco local.',
        url: urlArchivo,
        ruta_local: urlArchivo
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
      const titulo = String(input.titulo || query.titulo || '').trim();
      const bSlug = cleanSlug(marcaRaw, false);
      const mSlug = cleanSlug(modeloRaw, false);

      if (tree[bSlug] && tree[bSlug].models && tree[bSlug].models[mSlug]) {
        const mObj = tree[bSlug].models[mSlug];
        Object.keys(mObj.anios || {}).forEach(aKey => {
          Object.keys(mObj.anios[aKey].motores || {}).forEach(motKey => {
            const archivos = mObj.anios[aKey].motores[motKey].archivos || [];
            mObj.anios[aKey].motores[motKey].archivos = archivos.filter(arc => {
              const arcTitle = arc.titulo || arc.nombre || arc._id || '';
              return arcTitle.toUpperCase() !== titulo.toUpperCase() && arc._id !== titulo;
            });
          });
        });
        saveVehiculosData(tree);
      }
      return res.end(JSON.stringify({ status: 'success', message: 'Diagrama eliminado localmente.' }));
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
