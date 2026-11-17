# DAYA CLOTHING — Editorial Collection v3

Diseño actualizado con dirección editorial de alto impacto y espacios limpios, sin reproducir las marcas de las referencias.

## Páginas
- `index.html` — Inicio hero editorial, una pantalla (sin scroll), imagen original generada para Daya. No hay botón grande de tienda.
- `tienda.html` — Tienda separada: filtros, búsqueda, carrito, detalle de talla/color; solamente botón `+` por producto y controles de cantidades dentro del carrito. Sin favoritos.
- `contacto.html` — Hero editorial de cuerpo completo, correo y redes configurables. Los enlaces vacíos avisan que falta la cuenta oficial.
- `studio.html` — Panel existente de gestión, conservado. Regresa a `tienda.html`.

## Uso

```bash
cd Daya-Clothing-v3
python -m http.server 8080
```

Abre `http://localhost:8080/index.html`. El panel se abre en `studio.html` con `admin@daya.local` / `DayaDemo2026!` (solo desarrollo).

La tienda lee los productos de IndexedDB de Studio en el mismo origen; las solicitudes locales se revisan en Studio → Solicitudes web y no descuentan inventario automáticamente. La bolsa local queda en `localStorage` (`daya-cart-v2`).

En `contact-config.js` puedes colocar los enlaces oficiales de Instagram, Facebook y TikTok cuando estén confirmados. El correo preconfigurado es `dayaclothing.mx@gmail.com`.

**No listo para producción:** login local de demo, sin Supabase Auth compartida, cobros ni emails reales; no se ha publicado en Sites, Cloudflare ni Vercel. Los datos y fotografías son demostrativos.
