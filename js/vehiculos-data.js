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

    // 1. Resolve Storage URLs
    resolveStorageUrl: function(rawUrl) {
      if (!rawUrl || typeof rawUrl !== 'string') return '';
      rawUrl = rawUrl.trim();
      if (!rawUrl || rawUrl.includes('logo_probaktronic')) return '';

      // Direct HTTP / HTTPS / Data / Blob URLs - keep authentic cloud URL
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
        return rawUrl;
      }

      if (rawUrl.startsWith('gs://')) {
        const clean = rawUrl.replace('gs://probaktronic-app.firebasestorage.app/', '').replace('gs://probaktronic-app.appspot.com/', '');
        return `archivos_almacenamiento/${clean}`;
      }

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
        const single = docData.imageUrl || docData.fotoComponente || docData.foto || docData.imagen || docData.archivoUrl;
        if (single && typeof single === 'string' && !single.toLowerCase().includes('.pdf')) {
          photos = [single];
        }
      }
      return photos.filter(Boolean);
    },

    // 3. Fetch all diagram cards for a model with Smart Merge
    fetchModelDiagrams: async function(brandId, modelId, modelName) {
      const cacheKey = `${brandId}_${modelId}_${modelName}`.toLowerCase();
      if (this.cache.diagrams.has(cacheKey)) {
        return this.cache.diagrams.get(cacheKey);
      }
      let rawList = [];
      const cleanBrand = (brandId || '').toLowerCase().trim();
      const cleanDoc = (modelId || '').toLowerCase().trim();
      const cleanModel = (modelName || '').toLowerCase().trim();

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
              const mClean = mKey.toLowerCase().trim();
              const mDataName = ((mVal.modelData && mVal.modelData.nombre) || '').toLowerCase().trim();

              const isMatch = (
                mClean === cleanDoc || mClean === cleanModel ||
                cleanDoc.includes(mClean) || mClean.includes(cleanDoc) ||
                cleanModel.includes(mClean) || mClean.includes(cleanModel) ||
                mDataName.includes(cleanModel) || cleanModel.includes(mDataName) ||
                (cleanDoc.includes('corolla') && mClean.includes('corolla')) ||
                (cleanDoc.includes('hilux') && mClean.includes('hilux'))
              );

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