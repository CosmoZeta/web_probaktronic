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

      // Si es una URL de Firebase Storage, convertir directamente a ruta local de archivos_almacenamiento
      if (rawUrl.includes('firebasestorage.googleapis.com') && rawUrl.includes('/o/')) {
        try {
          const encPath = rawUrl.split('/o/')[1].split('?')[0];
          return `archivos_almacenamiento/${decodeURIComponent(encPath)}`;
        } catch (e) {}
      }

      if (rawUrl.startsWith('gs://')) {
        const clean = rawUrl.replace('gs://probaktronic-app.firebasestorage.app/', '').replace('gs://probaktronic-app.appspot.com/', '');
        return `archivos_almacenamiento/${clean}`;
      }

      // URLs directas locales o externas no Firebase
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
          docData.imageUrl, docData.url, docData.archivoUrl, 
          docData.diagramaUrl, docData.fotoComponente, docData.foto, 
          docData.imagen, docData.diagramaImg, docData.downloadUrl
        ];
        for (const single of candidates) {
          if (single && typeof single === 'string') {
            const lower = single.toLowerCase();
            if (!lower.includes('.pdf') && !lower.includes('%2epdf')) {
              photos.push(single);
              break;
            }
          }
        }
      }
      return photos.filter(Boolean);
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
        if (!window._cachedVehiculosDiagramasTree) {
          const res = await fetch('data/vehiculos_diagramas.json');
          if (res.ok) {
            window._cachedVehiculosDiagramasTree = await res.json();
          }
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

                // 2. Archivos bajo años -> motores
                const anios = mVal.anios || {};
                for (const [aKey, aVal] of Object.entries(anios)) {
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

      // 5. Buscar diagramas en LocalStorage creados localmente para este modelo
      try {
        const customStores = [];
        
        // Almacén unificado
        const globalStore = JSON.parse(localStorage.getItem('probak_custom_diagrams_store') || '[]');
        if (Array.isArray(globalStore)) customStores.push(...globalStore);

        // Claves por marca/modelo
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('probak_custom_diagrams') && k !== 'probak_custom_diagrams_store') {
            try {
              const list = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(list)) customStores.push(...list);
            } catch (e) {}
          }
        }

        // Filtrar y normalizar diagramas para este vehículo
        customStores.forEach(item => {
          if (!item) return;
          const itemBrand = (item.brandDocId || item.marca || '').toLowerCase().trim();
          const bMatch = !itemBrand || itemBrand === cleanBrand || cleanBrand.includes(itemBrand) || itemBrand.includes(cleanBrand);
          if (bMatch) {
            const itemModel = (item.modelDocId || item.modelo || item.model || '').toLowerCase().trim();
            const itemYears = (item.anio || item.anios || item.year || '').trim();
            const itemMotor = (item.motor || item.motorDocId || '').trim();
            const itemTitle = (item.titulo || item.nombre || item.id || '').toLowerCase().trim();

            const isMatch = this.isModelMatching(
              cleanDoc, 
              cleanModel, 
              cleanMotor, 
              itemModel, 
              { nombre: `${itemModel} ${itemYears}`.trim(), motor: itemMotor }, 
              itemYears ? { [itemYears]: true } : null, 
              cleanBrand
            );

            // Coincidencia por modelo o inclusión en título
            const titleMatches = (
              itemTitle.includes(cleanDoc) || cleanDoc.includes(itemModel) ||
              cleanModel.includes(itemModel) || (itemYears && cleanModel.includes(itemYears))
            );

            if (isMatch || titleMatches) {
              rawList.push({
                id: item.id || item.titulo,
                brandDocId: cleanBrand,
                modelDocId: cleanDoc,
                ...item
              });
            }
          }
        });
      } catch (locErr) {
        console.warn('LocalStorage diagrams scan notice:', locErr);
      }

      // Smart Merge: Preserve allImages, photos and hotspots across duplicate document variants
      const mergedCardsMap = new Map();
      rawList.forEach(a => {
        const cardTitleKey = (a.titulo || a.nombre || a.id || '').toUpperCase().trim();
        if (!mergedCardsMap.has(cardTitleKey)) {
          mergedCardsMap.set(cardTitleKey, a);
        } else {
          const existing = mergedCardsMap.get(cardTitleKey);
          const existingPhotos = VehiculosData.extractPhotos(existing);
          const newPhotos = VehiculosData.extractPhotos(a);

          const bestPhotos = (newPhotos.length >= existingPhotos.length && newPhotos.length > 0) ? newPhotos : existingPhotos;
          const bestHotspots = (Array.isArray(a.componentes_ecu) && a.componentes_ecu.length > 0) ? a.componentes_ecu : (existing.componentes_ecu || []);
          const bestImageUrl = a.imageUrl || existing.imageUrl || (bestPhotos.length > 0 ? bestPhotos[0] : '');

          mergedCardsMap.set(cardTitleKey, {
            ...existing,
            ...a,
            allImages: bestPhotos,
            imagenes: bestPhotos,
            imageUrl: bestImageUrl,
            componentes_ecu: bestHotspots
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