# 📋 PROBAKTRONIC - RESUMEN MAESTRO DETALLADO DEL PROYECTO
> **Fecha:** 04 de Septiembre de 2026  
> **Documento para:** Exportar a un nuevo chat / Continuar el desarrollo en cualquier sesión.

---

## 1. OBJETIVO DEL SOFTWARE
**Probaktronic** es una plataforma web profesional para técnicos y mecánicos automotrices que permite consultar y gestionar:
1. **[IMAGEN DE LA PLACA / DESPIECE]:** Fotografías reales en alta definición de placas electrónicas (ECU, EDU, Inmovilizador, Pedal, etc.) con herramientas de marcado de áreas interactivas por colores:
   - 🟦 **Azul:** Microprocesador (MCU)
   - 🟪 **Morado:** Memoria EEPROM / FLASH
   - 🟥 **Rojo:** Área de Voltaje / Regulador
   - 🟩 **Verde:** Driver de Inyectores
   - 🟫 **Rosa:** Cristal Oscilador
2. **[CONEXIONADO / PINOUT]:** Diagramas esquemáticos y planos de pines en formato JPG de alta resolución con marca de agua y/o documentos PDF interactivos (PDF.js).

---

## 2. ARQUITECTURA DEL SISTEMA (100% INDEPENDIENTE DE FIREBASE PARA DIAGRAMAS)

`mermaid
graph TD
    UI["Frontend: vehiculos.html + js/vehiculos-diagramas.js"]
    API["Backend API: api/diagramas.php (SiteGround)"]
    DB[("Base de Datos: MySQL dbxmy5adrv8uwv (SiteGround)")]
    FS["Almacenamiento Físico: public_html/archivos_almacenamiento/diagramas_PRUEBAS/"]

    UI -->|1. Petición POST Multipart con la Foto| API
    API -->|2. Crea carpetas y renombra (ej: corolla_ecu_1.jpg)| FS
    API -->|3. Registra rutas y metadatos| DB
    DB -->|4. Devuelve marcas, modelos y diagramas| API
    API -->|5. Entrega JSON a la web| UI
`

---

## 3. ESTRUCTURA UNIVERSAL DE CARPETAS
La estructura de archivos es idéntica tanto en la computadora local (c:\Users\User\Documents\web_probaktronic\) como en el hosting SiteGround (public_html/archivos_almacenamiento/):

`	ext
diagramas_PRUEBAS/
├── TOYOTA/
│   ├── hilux/
│   │   └── 2011-2015/
│   │       ├── ecu/
│   │       │   ├── imagen/ (ecu_frontal.jpg, ecu_tapa.jpg)
│   │       │   └── conexionado/ (diagrama_ecu_2kd_ftv.jpg)
│   │       ├── edu_dos_conectores/
│   │       │   ├── imagen/ (edu_2_conectores_frontal.jpg, edu_2_conectores_conector.jpg)
│   │       │   └── conexionado/ (diagrama_edu_dos_conectores.jpg)
│   │       ├── edu_tres_conectores/
│   │       │   ├── imagen/ (edu_3_conectores_frontal.jpg, conector.jpg, posterior.jpg)
│   │       │   └── conexionado/ (diagrama_edu_tres_conectores.jpg)
│   │       ├── inmovilizador_llave/
│   │       │   ├── imagen/ (llave_antena_1.jpg a llave_antena_4.jpg)
│   │       │   └── conexionado/ (diagrama_inmovilizador_llave.jpg)
│   │       └── pedal_acelerador/
│   │           ├── imagen/ (pedal_1.jpg a pedal_4.jpg)
│   │           └── conexionado/ (diagrama_pedal_acelerador.jpg)
│   │
│   └── corolla/
│       └── motor_4e/
│           └── ecu/
│               ├── imagen/ (Fotos subidas desde la web: corolla_ecu_1.jpg, etc.)
│               └── conexionado/ (diagrama_ecu_corolla_4e.pdf)
`

---

## 4. BASE DE DATOS MYSQL (SITEGROUND)
Base de datos: dbxmy5adrv8uwv con 5 tablas relacionales vinculadas por ID:
* **marcas**: (MarcaID, Slug, Nombre, LogoUrl, Categoria, Combustible, Activo)
* **modelos**: (ModeloID, MarcaID, Slug, Nombre, Anios, Motor, Combustible, ImagenUrl, Activo)
* **ehiculo_anios**: (AnioID, ModeloID, Anio)
* **ehiculo_motores**: (MotorID, AnioID, NombreMotor, Cilindrada, TipoCombustible)
* **diagramas_archivos**: (ArchivoID, MotorID, Titulo, UrlArchivo, Tipo, Descripcion, PinoutDetalle)

---

## 5. TRABAJO Y MEJORAS REALIZADAS EN ESTA SESIÓN

### A. Limpieza de Datos y Modelos Fantasmas:
1. Se eliminaron del código JavaScript (js/vehiculos-diagramas.js) los modelos fijos de muestra (*Fortuner D4D, Yaris, Hilux 2015-2020 duplicada*).
2. Se eliminó la inyección residual de localStorage que reinsertaba autos viejos en el navegador.

### B. Pruebas de Vehículos en Vivo:
1. **Toyota Hilux 2011 - 2015 (Diésel ➔ Pickup):**
   - Muestra de forma limpia sus **5 subsistemas**: ECU, EDU 2 conectores, EDU 3 conectores, Inmovilizador / Llave y Pedal.
   - Alterna perfectamente entre [IMAGEN] y [CONEXIONADO].
2. **Toyota Corolla Motor 4E (Gasolina ➔ Sedán / Hatchback):**
   - Muestra el Corolla 4E en la categoría correcta.
   - En [Imagen de la ECU]: Muestra el panel listo para subir fotos sin botones fantasmas.
   - En [Ver Conexionado]: Carga y renderiza el diagrama PDF interactivo (diagrama_ecu_corolla_4e.pdf).

### C. Corrección del Visor y Barra de Fotos:
1. Se corrigió showConsoleNoDiagramMessage y showGalleryImageAtIndex para que **NUNCA se borren los botones de la galería [Foto 1], [Foto 2], [Foto 3]** si una imagen tarda en cargar o está vacía.
2. Se actualiza correctamente la clase ctive en los botones de fotos al navegar.

### D. Migración de Subida de Fotos a SiteGround PHP (Sin Firebase):
1. **En Backend (pi/diagramas.php):**
   - Se implementó la acción ction=subir_foto.
   - Crea automáticamente los directorios físicos en SiteGround si no existen.
   - Renombra automáticamente los archivos de forma limpia: [modelo]_[componente]_[número].[ext] (ej: corolla_ecu_1.jpg).
   - Guarda el archivo físicamente en public_html/archivos_almacenamiento/diagramas_PRUEBAS/....
2. **En Frontend (js/vehiculos-diagramas.js):**
   - La función handleAdminSubmitDirectPhoto ahora envía los datos por POST directo a https://probaktronic.com/api/diagramas.php?action=subir_foto.

---

## 6. PASO PENDIENTE PARA COMPLETAR LA SUBIDA PERMANENTE
Para que las fotos que se suban desde el navegador se guarden físicamente de forma permanente en SiteGround:
1. Abrir el **Gestor de Archivos de SiteGround** (public_html/api/).
2. Reemplazar el archivo diagramas.php subiendo la versión actualizada de:
   c:\Users\User\Documents\web_probaktronic\api\diagramas.php

---

## 7. CÓMO REANUDAR EN UN NUEVO CHAT
Copia y pega este mensaje al iniciar tu nuevo chat con la IA:
> *"Hola, por favor lee el archivo RESUMEN_PROYECTO_PROBAKTRONIC.md ubicado en la raíz de mi proyecto. Contiene toda la arquitectura, las carpetas universales y el estado exacto del código de Probaktronic para continuar trabajando."*

