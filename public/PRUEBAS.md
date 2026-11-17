# Daya Clothing v3 · Verificación de la entrega

Fecha: 16 de noviembre de 2026. Versión de desarrollo local. No desplegada.

## Comprobaciones realizadas

- HTML y recursos relativos (`index.html`, `tienda.html`, `contacto.html`, `studio.html`): enlaces y recursos presentes.
- Sintaxis de `store.js`, `experience.js`, `app.js`, `contact-config.js` y `sw.js`: sin errores con `node --check`.
- Renderizado con Chromium desde documento con recursos incrustados (por la restricción de navegación local del entorno): 1440×900, 820×1180, 390×844, 360×640 y 1024×768.
- Inicio y Contacto: altura igual a la ventana y sin desbordamiento horizontal en esas cinco resoluciones.
- Tienda: catálogo de 8 productos de demostración, filtros de categorías, selección de variantes, bolsa y botones +/− únicamente dentro de la bolsa.
- Recorrido automatizado con Chromium: seleccionar blusa → talla y color → agregar → incrementar y reducir cantidad en bolsa → registrar solicitud local → comprobar total → filtrar Vestidos → buscar Terra → cerrar búsqueda con Escape. Sin errores JavaScript durante ese recorrido.
- Sin botones de favoritos/«me gusta» en el catálogo, sin botón de tienda dentro del hero de inicio.

## Aún por validar antes de producción

- Autenticación, usuarios y permisos con backend real y Supabase Auth, RLS y Storage.
- Persistencia compartida y migración de IndexedDB/localStorage a la base de datos real.
- Integración de envío de correos, dominio, medios de pago, pedidos reales, políticas y protección de datos.
- Pruebas físicas con iPad/iOS Safari y Android, conectividad lenta y accesibilidad con lector de pantalla.
- Links oficiales de redes sociales (se configuran en `contact-config.js`).
- Comprobación completa en un dominio de previsualización protegido antes de publicar.

**Nota importante:** la tienda y Studio comparten datos del mismo navegador/origen; no se sincronizan entre dispositivos. El formulario registra solicitudes de demostración y no procesa pagos.
