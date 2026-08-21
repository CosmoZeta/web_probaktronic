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
