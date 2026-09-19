/**
 * PROBAKTRONIC - MODULO DE VEHICULOS: SERVICIO DE DATOS Y FIREBASE
 * Centraliza consultas a Firestore, Storage, caché en memoria y LocalStorage.
 */

(function(window) {
  'use strict';

  const VehiculosData = {
    // In-memory caches for ultra-fast 0ms retrieval
    cache: {
      brands: new Map(),
      models: new Map(),
      diagrams: new Map(),
      photos: new Map(),
      storageUrls: new Map()
    },

    // 1. Resolve Storage URLs (Prioridad total a archivos_almacenamiento/ local de SiteGround)
    resolveStorageUrl: function(rawUrl) {
      if (!rawUrl || typeof rawUrl !== 'string') return '';
      rawUrl = rawUrl.trim();
      if (!rawUrl || rawUrl.includes('logo_probaktronic')) return '';

      // Si es una URL de Firebase Storage, convertir directamente a ruta de archivos_almacenamiento
      if (rawUrl.includes('firebasestorage.googleapis.com') && rawUrl.includes('/o/')) {
        try {
          const encPath = rawUrl.split('/o/')[1].split('?')[0];
          rawUrl = `archivos_almacenamiento/${decodeURIComponent(encPath)}`;
        } catch (e) {}
      }

      if (rawUrl.startsWith('gs://')) {
        const clean = rawUrl.replace('gs://probaktronic-app.firebasestorage.app/', '').replace('gs://probaktronic-app.appspot.com/', '');
        rawUrl = `archivos_almacenamiento/${clean}`;
      }

      // Mapear carpetas relativas a archivos_almacenamiento
      if (rawUrl.startsWith('diagramas_PRUEBAS/') || rawUrl.startsWith('diagramas/')) {
        rawUrl = `archivos_almacenamiento/${rawUrl}`;
      }

      // En entorno local o producción, las rutas relativas se cargan directamente
      return rawUrl;
    },

    // 2. Universal photo extractor from any Firestore document
    extractPhotos: function(docData) {
      if (!docData) return [];
      let photos = [];
      if (Array.isArray(docData.allImages) && docData.allImages.length > 0) {
        photos = [...docData.allImages];
      } else if (Array.isArray(docData.imagenes) && docData.imagenes.length > 0) {
        photos = [...docData.imagenes];
      } else if (Array.isArray(docData.fotos) && docData.fotos.length > 0) {
        photos = [...docData.fotos];
      }

      if (photos.length === 0) {
        const candidates = [
          docData.imageUrl, docData.fotoComponente, docData.foto, 
          docData.imagen, docData.downloadUrl, docData.url
        ];
        for (const single of candidates) {
          if (single && typeof single === 'string') {
            const lower = single.toLowerCase();
            if (!lower.includes('.pdf') && !lower.includes('%2epdf') && !lower.includes('/conexionado/') && !lower.includes('diagrama_')) {
              photos.push(single);
              break;
            }
          }
        }
      }
      return photos.filter(p => typeof p === 'string' && p.trim() && !p.toLowerCase().includes('/conexionado/') && !p.toLowerCase().includes('diagrama_'));
    },

    // Helper to extract year ranges or single years from strings
    extractYears: function(str) {
      if (!str || typeof str !== 'string') return [];
      const years = [];
      const rangeMatches = str.match(/\b(19\d{2}|20\d{2})\s*-\s*(19\d{2}|20\d{2})\b/g);
      if (rangeMatches) {
        rangeMatches.forEach(r => {
          const parts = r.split('-').map(p => parseInt(p.trim(), 10)).filter(n => !isNaN(n));
          if (parts.length === 2) {
            years.push({ start: parts[0], end: parts[1], raw: r.replace(/\s+/g, ' ').trim() });
          }
        });
      }
      const singleMatches = str.match(/\b(19\d{2}|20\d{2})\b/g);
      if (singleMatches) {
        singleMatches.forEach(s => {
          const y = parseInt(s.trim(), 10);
          if (!isNaN(y) && !years.some(yr => yr.start <= y && yr.end >= y)) {
            years.push({ start: y, end: y, raw: s.trim() });
          }
        });
      }
      return years;
    },

    // Helper to get normalized core model name (stripping brand, years, and non-alphanumeric)
    normalizeCoreName: function(name, brand) {
      if (!name) return '';
      let clean = name.toLowerCase();
      if (brand) clean = clean.replace(new RegExp(`\\b${brand.toLowerCase()}\\b`, 'g'), '');
      clean = clean.replace(/\b(19\d{2}|20\d{2})\s*-\s*(19\d{2}|20\d{2})\b/g, '');
      clean = clean.replace(/\b(19\d{2}|20\d{2})\b/g, '');
      clean = clean.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      return clean;
    },

    // Checks if candidate model in database matches requested model without cross-polluting across distinct generations/models
    isModelMatching: function(targetDoc, targetName, targetMotor, candidateKey, candidateModelData, candidateAniosObj, brandClean) {
      const cleanTargetDoc = (targetDoc || '').toLowerCase().trim();
      const cleanTargetName = (targetName || '').toLowerCase().trim();
      const candidateKeyClean = (candidateKey || '').toLowerCase().trim();
      const candidateNameClean = ((candidateModelData && candidateModelData.nombre) || '').toLowerCase().trim();

      // 1. Direct exact match
      if (cleanTargetName && candidateNameClean && cleanTargetName === candidateNameClean) {
        return true;
      }
      if (cleanTargetDoc && candidateKeyClean && cleanTargetDoc === candidateKeyClean && cleanTargetName === candidateNameClean) {
        return true;
      }

      // 2. Extract and strictly compare year spans
      const targetYears = this.extractYears(`${cleanTargetDoc} ${cleanTargetName}`);
      let candidateYears = this.extractYears(`${candidateKeyClean} ${candidateNameClean}`);
      if (candidateAniosObj && typeof candidateAniosObj === 'object') {
        Object.keys(candidateAniosObj).forEach(aKey => {
          candidateYears = candidateYears.concat(this.extractYears(aKey));
        });
      }

      // If both define years, they MUST match (different generations like 2011-2015 vs 2015-2020 must NOT match)
      if (targetYears.length > 0 && candidateYears.length > 0) {
        const exactMatch = targetYears.some(ty =>
          candidateYears.some(cy => (ty.raw === cy.raw || (ty.start === cy.start && ty.end === cy.end)))
        );
        if (!exactMatch) {
          return false;
        }
      } else if (targetYears.length > 0 && candidateYears.length === 0) {
        // Target specified a specific generation (e.g., 2015 - 2020), but candidate has no matching year
        if (candidateKeyClean !== cleanTargetDoc && candidateNameClean !== cleanTargetName) {
          return false;
        }
      }

      // 3. Compare core model tokens (e.g., "hilux", "corolla", "accent")
      const targetCore = this.normalizeCoreName(`${cleanTargetDoc} ${cleanTargetName}`, brandClean);
      const candidateCore = this.normalizeCoreName(`${candidateKeyClean} ${candidateNameClean}`, brandClean);

      if (!targetCore || !candidateCore) return false;

      const targetTokens = targetCore.split(' ').filter(t => t.length >= 3);
      const candidateTokens = candidateCore.split(' ').filter(t => t.length >= 3);

      const sharesPrimaryToken = targetTokens.some(t => candidateTokens.includes(t));
      if (!sharesPrimaryToken) return false;

      // 4. Verify motor code if specified in both
      if (targetMotor && candidateModelData && candidateModelData.motor) {
        const tMot = targetMotor.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cMot = candidateModelData.motor.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (tMot && cMot && tMot !== 'estandar' && cMot !== 'estandar') {
          if (!tMot.includes(cMot) && !cMot.includes(tMot)) {
            return false;
          }
        }
      }

      return true;
    },

    // 3. Fetch all diagram cards for a model with Smart Merge
    fetchModelDiagrams: async function(brandId, modelId, modelName, motorCode) {
      const cacheKey = `${brandId}_${modelId}_${modelName}_${motorCode || ''}`.toLowerCase();
      if (this.cache.diagrams.has(cacheKey)) {
        return this.cache.diagrams.get(cacheKey);
      }
      let rawList = [];
      const cleanBrand = (brandId || '').toLowerCase().trim();
      const cleanDoc = (modelId || '').toLowerCase().trim();
      const cleanModel = (modelName || '').toLowerCase().trim();
      const cleanMotor = (motorCode || '').toLowerCase().trim();

      try {
        const res = await fetch(`data/vehiculos_diagramas.json?_t=${Date.now()}`);
        if (res.ok) {
          window._cachedVehiculosDiagramasTree = await res.json();
        }

        const tree = window._cachedVehiculosDiagramasTree || {};

        // Buscar marca en el árbol
        for (const [bKey, bVal] of Object.entries(tree)) {
          const bClean = bKey.toLowerCase().trim();
          const bDataName = ((bVal.brandData && bVal.brandData.nombre) || '').toLowerCase().trim();
          
          if (bClean === cleanBrand || bClean.includes(cleanBrand) || cleanBrand.includes(bClean) || bDataName.includes(cleanBrand)) {
            const models = bVal.models || {};

            for (const [mKey, mVal] of Object.entries(models)) {
              const isMatch = this.isModelMatching(cleanDoc, cleanModel, cleanMotor, mKey, mVal.modelData, mVal.anios, cleanBrand);

              if (isMatch) {
                // 1. Archivos directos del modelo
                if (Array.isArray(mVal.archivos)) {
                  mVal.archivos.forEach(a => {
                    rawList.push({
                      id: a._id || a.id || a.titulo,
                      brandDocId: bKey,
                      modelDocId: mKey,
                      ...a
                    });
                  });
                }

                // 2. Archivos bajo años -> motores (verificar que el año coincida)
                const anios = mVal.anios || {};
                for (const [aKey, aVal] of Object.entries(anios)) {
                  const targetYears = this.extractYears(`${cleanDoc} ${cleanModel}`);
                  const anioYears = this.extractYears(aKey);
                  if (targetYears.length > 0 && anioYears.length > 0) {
                    const matchYear = targetYears.some(ty =>
                      anioYears.some(ay => ty.raw === ay.raw || (ty.start === ay.start && ty.end === ay.end))
                    );
                    if (!matchYear) continue; // Saltar años no correspondientes
                  }

                  const motores = aVal.motores || {};
                  for (const [motKey, motVal] of Object.entries(motores)) {
                    if (Array.isArray(motVal.archivos)) {
                      motVal.archivos.forEach(a => {
                        rawList.push({
                          id: a._id || a.id || a.titulo,
                          brandDocId: bKey,
                          modelDocId: mKey,
                          anioDocId: aKey,
                          motorDocId: motKey,
                          ...a
                        });
                      });
                    }
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error cargando árbol local de diagramas:', e);
      }

      // 3.5. Buscar diagramas guardados en backend local o MySQL
      try {
        const epList = (typeof window !== 'undefined' && typeof window.getApiEndpoints === 'function')
          ? window.getApiEndpoints('arbol_completo', `marca=${encodeURIComponent(cleanBrand)}&modelo=${encodeURIComponent(cleanDoc)}`)
          : [
              `http://127.0.0.1:3000/api/diagramas.php?action=arbol_completo&marca=${encodeURIComponent(cleanBrand)}&modelo=${encodeURIComponent(cleanDoc)}`,
              `api/diagramas.php?action=arbol_completo&marca=${encodeURIComponent(cleanBrand)}&modelo=${encodeURIComponent(cleanDoc)}`
            ];
        let srvData = null;
        for (const ep of epList) {
          try {
            const srvRes = await fetch(ep);
            if (srvRes && srvRes.ok) {
              srvData = await srvRes.json();
              if (srvData && srvData.status === 'success') break;
            }
          } catch (e) {}
        }
        if (srvData && srvData.status === 'success' && Array.isArray(srvData.data)) {
          srvData.data.forEach(row => {
            if (row.UrlArchivo && row.Titulo) {
              const isPdf = row.UrlArchivo.toLowerCase().includes('.pdf');
              const rowTitle = (row.Titulo || '').toUpperCase().trim();
              const alreadyExists = rawList.some(it => (it.titulo || it.nombre || it.id || '').toUpperCase().trim() === rowTitle);
              if (!alreadyExists) {
                rawList.push({
                  id: row.Titulo,
                  titulo: row.Titulo,
                  nombre: row.Titulo,
                  tipo: row.Tipo || '',
                  url: row.UrlArchivo,
                  imageUrl: isPdf ? '' : row.UrlArchivo,
                  archivoUrl: row.UrlArchivo,
                  diagramaUrl: row.UrlArchivo,
                  allImages: isPdf ? [] : [row.UrlArchivo],
                  imagenes: isPdf ? [] : [row.UrlArchivo],
                  brandDocId: cleanBrand,
                  modelDocId: cleanDoc,
                  motorDocId: row.NombreMotor || cleanMotor,
                  anioDocId: row.Anio || ''
                });
              }
            }
          });
        }
      } catch (sqlErr) {
        console.warn('MySQL diagrams lookup notice:', sqlErr);
      }

      // 4. Buscar en Firestore si está conectado para este modelo específico
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
          const db = firebase.firestore();
          const snap = await db.collection('diagramas').doc(cleanBrand).collection('modelos').doc(cleanDoc).collection('archivos').get().catch(() => null);
          if (snap && !snap.empty) {
            snap.docs.forEach(docSnap => {
              const data = docSnap.data() || {};
              rawList.push({
                id: docSnap.id,
                archDocId: docSnap.id,
                brandDocId: cleanBrand,
                modelDocId: cleanDoc,
                ...data
              });
            });
          }
        } catch (fbErr) {
          console.warn('Firestore diagrams lookup notice:', fbErr);
        }
      }



      // 6. Strict Isolation Filter: Eliminar cualquier tarjeta que pertenezca a otra generación/motor
      const targetYears = this.extractYears(`${cleanDoc} ${cleanModel}`);
      rawList = rawList.filter(item => {
        if (!item) return false;
        const itemTitle = (item.titulo || item.nombre || item.id || '').toUpperCase();
        const itemYears = this.extractYears(`${item.anioDocId || ''} ${item.anio || ''} ${item.anios || ''} ${itemTitle}`);
        
        // Si el vehículo actual tiene años definidos (ej. 2011-2015 vs 2015-2020)
        if (targetYears.length > 0 && itemYears.length > 0) {
          const match = targetYears.some(ty =>
            itemYears.some(iy => ty.raw === iy.raw || (ty.start === iy.start && ty.end === iy.end))
          );
          if (!match) return false;
        }

        // Si el vehículo actual tiene motor definido (ej. 1GD vs 2KD)
        if (cleanMotor && cleanMotor !== 'estandar') {
          const tMotorClean = cleanMotor.toLowerCase().replace(/[^a-z0-9]/g, '');
          const itemMotorClean = `${item.motorDocId || ''} ${item.motor || ''} ${itemTitle}`.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          if (tMotorClean.includes('1gd') && itemMotorClean.includes('2kd') && !itemMotorClean.includes('1gd')) return false;
          if (tMotorClean.includes('2kd') && itemMotorClean.includes('1gd') && !itemMotorClean.includes('2kd')) return false;
        }

        return true;
      });

      // Smart Merge: Preserve allImages, photos and hotspots across duplicate document variants by component
      const mergedCardsMap = new Map();
      rawList.forEach(a => {
        const rawTitle = (a.titulo || a.nombre || a.id || '').toUpperCase().trim();
        let compTypeKey = (a.tipo || '').toLowerCase().trim();
        if (!compTypeKey || compTypeKey === 'diagrama' || compTypeKey === 'general' || compTypeKey === 'pinout') {
          let normTitle = rawTitle.replace(/E\s*\.?\s*D\s*\.?\s*U/gi, 'EDU');
          normTitle = normTitle.replace(/[^A-Z0-9áéíóúÁÉÍÓÚ]+/g, ' ').replace(/\s+/g, ' ').trim();
          if (normTitle.includes('INMOVILIZADOR') || normTitle.includes('LLAVE') || normTitle.includes('ANTENA')) {
            compTypeKey = 'inmovilizador_llave';
          } else if (normTitle.includes('PEDAL')) {
            compTypeKey = 'pedal_acelerador';
          } else if (normTitle.includes('EDU') && (normTitle.includes('DOS') || normTitle.includes('2'))) {
            compTypeKey = 'edu_dos_conectores';
          } else if (normTitle.includes('EDU') && (normTitle.includes('TRES') || normTitle.includes('3'))) {
            compTypeKey = 'edu_tres_conectores';
          } else if (normTitle.includes('OBD')) {
            compTypeKey = 'puerto_obd';
          } else if (normTitle.includes('BOOT')) {
            compTypeKey = 'modo_boot';
          } else if (normTitle.includes('BENCH')) {
            compTypeKey = 'modo_banco';
          } else if (normTitle.includes('CUERPO')) {
            compTypeKey = 'cuerpo_aceleracion';
          } else if (normTitle.includes('ECU') || normTitle.includes('PINOUT') || normTitle.includes('COMPUTADORA')) {
            compTypeKey = 'ecu';
          } else {
            compTypeKey = rawTitle;
          }
        }

        if (!mergedCardsMap.has(compTypeKey)) {
          mergedCardsMap.set(compTypeKey, a);
        } else {
          const existing = mergedCardsMap.get(compTypeKey);
          const existingPhotos = VehiculosData.extractPhotos(existing);
          const newPhotos = VehiculosData.extractPhotos(a);

          const combinedPhotos = [...new Set([...existingPhotos, ...newPhotos, existing.imageUrl, a.imageUrl].filter(Boolean))];
          const isDiagUrl = (u) => u && typeof u === 'string' && (u.includes('.pdf') || u.includes('%2epdf') || u.includes('/conexionado/') || u.includes('diagrama_'));
          const bestPdf = a.pdfUrl || a.diagramaUrl || existing.pdfUrl || existing.diagramaUrl || (isDiagUrl(a.url) ? a.url : '') || (isDiagUrl(existing.url) ? existing.url : '');
          const bestImageUrl = a.imageUrl || existing.imageUrl || (combinedPhotos.length > 0 ? combinedPhotos[0] : '');

          mergedCardsMap.set(compTypeKey, {
            ...existing,
            ...a,
            tipo: compTypeKey,
            pdfUrl: bestPdf,
            diagramaUrl: bestPdf,
            imageUrl: bestImageUrl,
            allImages: combinedPhotos,
            imagenes: combinedPhotos,
            fotos: combinedPhotos,
            componentes_ecu: (Array.isArray(a.componentes_ecu) && a.componentes_ecu.length > 0) ? a.componentes_ecu : (existing.componentes_ecu || [])
          });
        }
      });

      const finalCards = Array.from(mergedCardsMap.values());
      this.cache.diagrams.set(cacheKey, finalCards);
      return finalCards;
    }
  };

  // Expose global aliases
  window.VehiculosData = VehiculosData;
  window.resolveFirebaseStorageUrl = function(url) {
    return VehiculosData.resolveStorageUrl(url);
  };

})(window);