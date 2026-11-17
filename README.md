# Daya Clothing · GitHub Pages

Proyecto completo de Daya Clothing: web editorial, tienda, panel de gestión, Studio local y recursos de la identidad DA. La interfaz se compila para GitHub Pages; la autenticación y las reglas de negocio se ejecutan en el proyecto Supabase existente.

Repositorio: https://github.com/MNooker/Dayas

Dirección de Pages: https://mnooker.github.io/Dayas/ (requiere GitHub Pages habilitado para la rama `gh-pages`).

- `/Dayas/` · Inicio con productos animados; Contacto conserva a Dayani.
- `/Dayas/tienda.html` · catálogo conectado al backend; colección de ejemplo si el inventario está vacío.
- `/Dayas/gestion/` · acceso del panel con ventas, apartados, abonos, clientas, inventario, caja y reportes.
- `/Dayas/gestion/?revision=1` · demostración de solo lectura con datos ficticios.
- `/Dayas/gestion/revision-dispositivos.html` · comparador de móvil, tablet y escritorio.
- `/Dayas/studio.html` · Studio local anterior; no sincroniza sus datos con el servidor.
- `/Dayas/identidad/` · identidad DA elegida, SVG y archivo de propuestas previas.

## Datos y alcance

El catálogo público recibe únicamente nombres, fotografías, precios, categorías, existencias y variantes. Los costos, clientas, ventas, contraseñas y roles no forman parte de esa respuesta. El servidor conserva la autenticación, los permisos y las reglas de negocio del ZIP claro.

Las solicitudes de la tienda se guardan en el navegador y se muestran en Gestión → Solicitudes web. No son pagos, no descuentan inventario y no se sincronizan entre dispositivos. Studio conserva su base IndexedDB separada; no se migran datos reales automáticamente porque los modelos son distintos.

El acceso real utiliza las cuentas de Supabase; la cuenta de la dueña todavía necesita activación si la tienda muestra la configuración inicial. No se inventan credenciales de producción ni se envían correos en la migración. SMTP y cobros siguen pendientes. Para presentar el panel sin iniciar sesión, usar la demostración de solo lectura.

## Desarrollo y despliegue

Node 24. Sin dependencias npm de ejecución. `npm test` ejecuta las pruebas de integración, reglas, autenticación y publicación estática. `npm run build` o `npm run build:pages` emite únicamente la interfaz pública en `_site/`, con el prefijo `/Dayas/`. La configuración pública contiene la dirección de la función, nunca claves privilegiadas.

La rama `main` conserva todo el código y la rama `gh-pages` contiene la compilación que debe servir Pages. En GitHub → Settings → Pages, seleccionar `Deploy from a branch` → `gh-pages` → `/ (root)`. No publicar la raíz de `main`: contiene fuentes y documentación del servidor.

Los archivos públicos viven en `public/`; `backend/daya-api/` conserva la lógica de servidor; `backend/pages-api/` adapta el transporte de Pages sin modificar las reglas de negocio. `worker/` y `scripts/build.mjs` conservan el empaquetado anterior como referencia; requieren la configuración local de hosting correspondiente si se reutilizan.

El panel de Pages usa tokens solo en memoria de la pestaña, sin almacenamiento persistente; al recargar se vuelve a iniciar sesión. La publicación anterior permanece disponible para recuperar respaldos y datos locales. El cambio de dominio no transfiere automáticamente IndexedDB, carritos ni solicitudes guardadas en el navegador.

Instrucciones completas, configuración del correo y límites: [docs/GITHUB-PAGES.md](docs/GITHUB-PAGES.md).
