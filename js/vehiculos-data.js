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

    // 1. Resolve Firebase Storage URLs (gs://, storage path, or HTTP)
    resolveStorageUrl: async function(rawUrl) {
      if (!rawUrl || typeof rawUrl !== 'string') return '';
      rawUrl = rawUrl.trim();
      if (!rawUrl || rawUrl.includes('logo_probaktronic')) return '';

      if (this.cache.storageUrls.has(rawUrl)) {
        return this.cache.storageUrls.get(rawUrl);
      }

      // Direct HTTP / Data URL / Blob URL
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
        this.cache.storageUrls.set(rawUrl, rawUrl);
        return rawUrl;
      }

      // Local relative paths
      if (rawUrl.startsWith('imagenes ') || rawUrl.startsWith('imagenes/') || (rawUrl.endsWith('.png') || rawUrl.endsWith('.jpg') || rawUrl.endsWith('.svg')) && !rawUrl.startsWith('diagramas/') && !rawUrl.startsWith('gs://')) {
        this.cache.storageUrls.set(rawUrl, rawUrl);
        return rawUrl;
      }

      // Firebase Storage resolution
      if (typeof firebase !== 'undefined' && firebase.storage) {
        try {
          const storage = firebase.storage();
          const ref = rawUrl.startsWith('gs://') ? storage.refFromURL(rawUrl) : storage.ref(rawUrl);
          const downloadUrl = await ref.getDownloadURL();
          this.cache.storageUrls.set(rawUrl, downloadUrl);
          return downloadUrl;
        } catch (err) {
          console.warn('Storage resolve notice for [' + rawUrl + ']:', err.message || err);
        }
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
      if (typeof firebase === 'undefined' || !firebase.firestore) return [];

      const db = firebase.firestore();
      const cleanBrand = (brandId || '').toLowerCase().trim();
      const cleanDoc = (modelId || '').toLowerCase().trim();
      const cleanModel = (modelName || '').toLowerCase().trim();

      try {
        const allBrandsSnap = await db.collection('diagramas').get().catch(() => null);
        const matchingBrandDocs = [];

        if (allBrandsSnap && !allBrandsSnap.empty) {
          allBrandsSnap.forEach(bDoc => {
            const bId = bDoc.id.toLowerCase().trim();
            const bData = bDoc.data() || {};
            const bName = (bData.nombre || bData.marca || '').toLowerCase().trim();
            if (bId === cleanBrand || bName === cleanBrand || cleanBrand.includes(bId) || bId.includes(cleanBrand)) {
              matchingBrandDocs.push(bDoc);
            }
          });
        }

        if (matchingBrandDocs.length === 0) {
          const brandDirect = Array.from(new Set([brandId, cleanBrand, brandId.toUpperCase(), 'Toyota', 'toyota', 'TOYOTA']));
          for (const bd of brandDirect) {
            matchingBrandDocs.push(db.collection('diagramas').doc(bd));
          }
        }

        for (const bDocRef of matchingBrandDocs) {
          const bRef = bDocRef.ref || bDocRef;
          const bVar = bDocRef.id || brandId;

          try {
            const modelosSnap = await bRef.collection('modelos').get().catch(() => null);
            if (modelosSnap && !modelosSnap.empty) {
              for (const mDoc of modelosSnap.docs) {
                const mId = mDoc.id.toLowerCase().trim();
                const mData = mDoc.data() || {};
                const mName = (mData.modelo || mData.nombre || '').toLowerCase().trim();

                const isMatch = (
                  mId === cleanDoc || mId === cleanModel ||
                  cleanDoc.includes(mId) || mId.includes(cleanDoc) ||
                  cleanModel.includes(mId) || mId.includes(cleanModel) ||
                  (cleanDoc.includes('corolla') && mId.includes('corolla')) ||
                  (cleanDoc.includes('hilux') && mId.includes('hilux')) ||
                  (cleanDoc.includes('accent') && mId.includes('accent'))
                );

                if (isMatch) {
                  const aniosSnap = await mDoc.ref.collection('anios').get().catch(() => null);
                  if (aniosSnap && !aniosSnap.empty) {
                    for (const anioDoc of aniosSnap.docs) {
                      const motoresSnap = await anioDoc.ref.collection('motores').get().catch(() => null);
                      if (motoresSnap && !motoresSnap.empty) {
                        for (const motorDoc of motoresSnap.docs) {
                          const archivosSnap = await motorDoc.ref.collection('archivos').get().catch(() => null);
                          if (archivosSnap && !archivosSnap.empty) {
                            archivosSnap.forEach(aDoc => {
                              const aData = aDoc.data() || {};
                              rawList.push({
                                id: aDoc.id,
                                brandDocId: bVar,
                                modelDocId: mDoc.id,
                                anioDocId: anioDoc.id,
                                motorDocId: motorDoc.id,
                                archDocId: aDoc.id,
                                ...aData
                              });
                            });
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (errM) {}
        }
      } catch (e) {
        console.warn('Error fetching model diagrams:', e);
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