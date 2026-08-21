# 🚗 Probaktronic - Plataforma Web de Diagnóstico Automotriz & Catálogo

Plataforma web profesional diseñada para el diagnóstico técnico de sistemas automotrices, esquemas de conexión de bobinas de encendido (COP/DIS), sensores, actuadores y catálogo interactivo de productos Probaktronic sincronizado en tiempo real con **Firebase Cloud Firestore** y **Firebase Storage**.

---

## 📌 Tabla de Contenidos
- [Características Principales](#-características-principales)
- [Arquitectura de Módulos](#-arquitectura-de-módulos)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Integración con Firebase](#-integración-con-firebase)
- [Medidas de Seguridad & Protección](#-medidas-de-seguridad--protección)
- [Instalación y Despliegue](#-instalación-y-despliegue)

---

## ⚡ Características Principales

### 🔴 1. Diagnóstico de Sensores y Actuadores (`sensores-actuadores.html`)
- **Tarjetas Interactivas**: 8 componentes principales (*Bobinas, Distribuidor, IAC, Pedal APP 1/2, Sensor Giro SAS, Oxígeno Lambda LSU, Obturador TPS, Módulos Drivers IGBT*).
- **Acceso Directo**: Tarjetas 100% clickeables con efectos de elevación hover y retroalimentación táctil sin botones redundantes.

### ⚡ 2. Visor e Índice de Bobinas Automotrices (`bobinas.html`)
- **Conexión de 3 Niveles a Firestore**:
  - **Nivel 1 (Marcas)**: Consulta directa a la colección `bobinas`. Mapeo automático con 38 vectores SVG corporativos de marcas automotrices (*Audi, BMW, Toyota, Ford, Chevrolet, Nissan, Volkswagen, etc.*).
  - **Nivel 2 (Modelos)**: Subcolección `bobinas/{marca}/modelos` mostrando código de motor, nombre comercial y variante del vehículo.
  - **Nivel 3 (Visor de Esquemas)**: Renderizado del esquema técnico de pinout y pulso ECU recuperado directamente desde **Firebase Storage**.
- **Filtro Alfabético Centrado (A-Z)**: Barra de navegación horizontal balanceada para filtrado instantáneo por letra inicial.

### 📦 3. Catálogo de Productos en Tiempo Real (`catalogo.html`)
- **Pantalla de Carga Centralizada 0% - 100%**: Contador progresivo animado mientras se obtienen los datos de Firestore.
- **Caché en Memoria Instantáneo**: Sistema `window.probaktronicCatalogCache` que permite transiciones entre páginas en **0ms** sin volver a solicitar datos a la red.
- **Buscador en Tiempo Real**: Filtrado dinámico instantáneo por código de componente y nombre de producto.

### 📊 4. Navegación Fluid (SPA Hybrid System)
- **Barra Lateral Interactiva**: Menú lateral replegable automáticamente con persistencia en `sessionStorage`.
- **Notificaciones Toast**: Sistema global de alertas emergentes `showGlobalToast()` para retroalimentación de usuario.

---

## 📁 Estructura del Proyecto

```
web_probaktronic/
│
├── index.html                  # Dashboard principal de bienvenida y métricas
├── sensores-actuadores.html    # Panel de selección de componentes a diagnosticar
├── bobinas.html                # Visor de marcas, modelos y diagramas de bobinas
├── catalogo.html               # Catálogo dinámico de productos desde Firestore
├── vehiculos.html              # Mapeo y catálogo por marca de vehículos
├── diagramas-3d.html           # Visor interactivo de componentes 3D
├── galeria-medios.html         # Gestor y galería técnica de archivos/medios
├── dashboard.html              # Panel de control extendido
│
├── css/
│   └── global.css              # Hoja de estilos unificada (Master Stylesheet)
│
├── js/
│   ├── global.js               # Controlador maestro de navegación, UI y Toast
│   ├── firebase-catalog.js     # Conector Firestore para catálogo y sistema de caché
│   └── bobinas.js              # Controlador de 3 niveles para bobinas y Storage
│
├── imagenes svg/               # 38 Logos vectoriales SVG de marcas automotrices
└── README.md                   # Documentación principal del proyecto
```

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3 (Unified Design System), JavaScript (ES6+ Vanilla).
- **Librerías UI**: Bootstrap 5.3, Bootstrap Icons 1.11.3.
- **Fuentes**: Inter, Oswald, Rajdhani (Google Fonts).
- **Backend / Database**: Firebase Web SDK v9.22.0 (Compat Layer).
  - **Cloud Firestore**: Base de datos NoSQL para marcas, modelos y catálogo.
  - **Firebase Storage**: Almacenamiento y entrega de diagramas de alta resolución.

---

## 🔥 Integración con Firebase

### Configuración del Proyecto
- **Proyecto ID**: `probaktronic-app`
- **Estructura de Base de Datos (Cloud Firestore)**:
  - `bobinas` (Colección raíz de marcas)
    - `bobinas/{marca_id}/modelos/{modelo_id}` (Subcolección de modelos)
      - Campos: `modelo` (string), `motor` (string), `imageUrl` (string URL Storage).
  - `productos` (Colección de catálogo)
    - Campos: `codigo` (string), `nombre` (string), `imagen` (string URL).

### Reglas de Seguridad Publicadas en Firebase Storage
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🔒 Medidas de Seguridad & Protección Anti-Descarga

Para proteger el propiedad intelectual de los esquemas y diagramas de Probaktronic:
1. **Desactivación de Menú Contextual**: `oncontextmenu="return false;"` en imágenes de diagramas (evita el "Guardar imagen como...").
2. **Desactivación de Arrastrado**: `draggable="false"` y `-webkit-user-drag: none`.
3. **Escudo Protector de Seguridad**: Capa transparente superpuesta (`security-shield-overlay`) que bloquea la selección e inspección directa del archivo de imagen.
4. **Política de Referencia Limpia**: Atributo `referrerpolicy="no-referrer"` para asegurar la descarga segura desde Firebase Storage sin exponer orígenes.

---

## 🚀 Instalación y Despliegue

1. **Entorno Local**:
   - Puede ser ejecutado con cualquier servidor HTTP estático (ej: *Live Server* en VS Code, Nginx, Apache o Python `python -m http.server 5500`).
   - Navegar a `http://localhost:5500/index.html`.

2. **Requisitos de Red**:
   - Conexión a Internet para la carga inicial de librerías CDN (Bootstrap, Firebase SDK) y sincronización con Firestore.

---

*Desarrollado para Probaktronic - Sistema de Diagnóstico Automotriz Profesional.*
