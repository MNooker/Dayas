# Daya Clothing · Supabase y Cloudflare Pages

Estado al 2026-11-16: **Supabase preparado y API activa; publicación en Cloudflare pendiente de autenticación de la cuenta.**

- Organización conectada: NookOS, plan Free.
- Proyecto nuevo y separado: Daya Clothing, `susfemyhruehbsnzffly`, región us-west-1. Costo cotizado por Supabase al crear: $0 mensuales, sujeto a límites y políticas del plan.
- API desplegada: `daya-api`, versión 2. La validación de JWT se realiza dentro del manejador porque también incluye acceso y recuperación públicos; cada ruta de negocio comprueba usuario, sesión vigente y perfil de servidor.
- Cinco tablas protegidas con RLS y sin acceso directo de `anon` o `authenticated`. Sin políticas públicas deliberadamente: el acceso se realiza por el servidor de Daya.
- Confirmado por HTTP: `/api/auth/status` responde 200; `/api/state` sin sesión responde 401; acceso REST anónimo a datos responde permiso denegado.
- 12 resultados de pruebas de adaptación aprobados. Incluyen proxy Pages, cookies, origen, CSRF, permisos, revisión concurrente, idempotencia y compensación de altas incompletas. Estas pruebas de acceso usan proveedores simulados; el login real de la dueña requiere configurar su correo y comprobarlo.

## Falta para terminar

1. Iniciar sesión en Cloudflare con la cuenta elegida. No hay credenciales de Cloudflare configuradas en este entorno.
2. Publicar `public/` en Pages mediante Wrangler o carga directa del ZIP preparado. `_worker.js` funciona en carga directa y envía `/api/*` a Supabase. No requiere claves privilegiadas en Cloudflare ni en el navegador.
3. Copiar la URL real asignada por Cloudflare a `daya_cloud_config.site_url`. No se da por disponible un nombre antes de crearlo; Cloudflare puede asignar un sufijo si está ocupado.
4. El Gmail de la dueña ya fue asignado: `dayaclothing.mx@gmail.com`, elegido en el acceso seguro. La URL de Pages sigue pendiente; no se activan registros desde un origen equivocado.
5. Configurar la URL de sitio y los redireccionamientos de Supabase Auth para la URL real. Probar confirmación y recuperación. Supabase restringe el envío de su servicio de correo predeterminado; puede requerirse SMTP propio antes de verificar un Gmail externo.
6. Crear y confirmar el acceso de la dueña, probar ventas/abonos desde iPad y validar respaldo con datos ficticios antes de operaciones reales.

El subdominio `*.pages.dev` de Pages evita comprar un dominio. Un dominio propio como `.com` o `.mx` no está incluido ni fue comprado. No se han cambiado los otros proyectos de Supabase ni se han migrado datos reales de SQLite; pueden importarse mediante JSON después de verificar el acceso.

## Archivos

- `public/`: aplicación y proxy de Pages.
- `supabase/functions/daya-api/`: función desplegada y motor validado.
- `database/cloud-schema.sql`: primera migración aplicada.
- `database/session-revocation.sql`: revocación persistente, también aplicada.
- `wrangler.jsonc` y `package-lock.json`: configuración de despliegue fijada.

El correo de tickets/pruebas sigue desconectado y devuelve un error explícito. La recuperación usa Supabase Auth cuando su transporte esté configurado. No se registran correos como enviados sin un envío real.

## Acceso de Cloudflare pendiente

Se eligió Google y luego Dayani (`dayaclothing.mx@gmail.com`) mediante el acceso seguro. Cloudflare devolvió «Unable to sign in. Try again or use your email and password». No se confirmó sesión ni se publicaron assets. Se detuvieron los intentos automáticos y se deja acceso manual; puede ser necesario completar el registro de Cloudflare para esa cuenta, sin asumir la causa del error.
