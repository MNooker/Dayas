# Daya en GitHub Pages

Repositorio: https://github.com/MNooker/Dayas

Destino de la interfaz: https://mnooker.github.io/Dayas/

GitHub Pages sirve la web, la tienda, el panel, Studio local y el comparador de dispositivos como archivos estáticos. La función `daya-pages-api` en el proyecto Supabase existente continúa validando las cuentas, las sesiones revocadas, los permisos, el inventario y los pagos. No se exportan tablas de negocio ni claves de servidor a GitHub o al navegador.

## Compilar

Node 24; sin dependencias npm de ejecución.

```sh
npm test
npm run build:pages
```

El resultado está en `_site/`. El prefijo `/Dayas/` es intencional: todas las rutas, imágenes, fuentes, iconos, manifiestos y service workers deben permanecer dentro del proyecto. No se publica la carpeta raíz del código fuente.

La rama `main` contiene el proyecto completo. La rama `gh-pages` contiene únicamente la compilación pública. En Settings → Pages, usar `Deploy from a branch`, rama `gh-pages`, carpeta `/ (root)`.

## Acceso y presentación

- Web: `/Dayas/`
- Gestión: `/Dayas/gestion/`
- Demostración de gestión: `/Dayas/gestion/?revision=1` (datos ficticios y solo lectura)
- Comparador: `/Dayas/gestion/revision-dispositivos.html`
- Studio anterior: `/Dayas/studio.html`

El panel real conserva la cuenta asignada en Supabase; no se crean cuentas ni contraseñas nuevas durante esta migración. Si falta activar la cuenta de la dueña, usar la demostración para presentar la interfaz.

Pages no puede emitir cookies HttpOnly desde el servidor de la aplicación. Su adaptador usa autorización Bearer explícita, restringida en CORS al origen `https://mnooker.github.io`. Los tokens de esta interfaz se conservan solo en la memoria de la pestaña, sin localStorage ni sessionStorage; recargar la página requiere volver a entrar. La publicación anterior conserva su transporte con cookies HttpOnly. Nunca se deben añadir claves privilegiadas al archivo público de configuración.

Los enlaces de confirmación y recuperación necesitan que `https://mnooker.github.io/Dayas/gestion/` esté permitido en Supabase → Authentication → URL Configuration → Redirect URLs. No se afirma una validación con un buzón real.

## Datos locales anteriores

Los datos del servidor Supabase no cambian de proyecto. Los datos del navegador dependen del origen: el carrito, las solicitudes web locales, las preferencias y el IndexedDB de Studio de la URL anterior no se transfieren automáticamente a `github.io`. La publicación anterior se mantiene disponible. Para conservar Studio, exportar su respaldo JSON desde la dirección anterior e importarlo en el nuevo Studio; no se deben subir respaldos reales al repositorio público.

## Actualizar la publicación por rama

Después de cambiar el código, ejecutar las pruebas y la compilación, guardar la fuente en `main` y publicar exclusivamente el contenido de `_site/` en `gh-pages`. GitHub Pages vuelve a desplegar cuando cambia esa rama. Los cambios de la función de servidor se despliegan separadamente en Supabase; una publicación de archivos estáticos no ejecuta código de servidor.
