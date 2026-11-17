# Referencias de diseño y revisión

Consulta en GitHub realizada el 17 de noviembre de 2026. Selección por adecuación a logos vectoriales y revisiones verificables; no se afirma que sean las mejores de todo GitHub.

- https://github.com/kaankiziltug/logo-design-skill · `skills/logo-design/SKILL.md`, versión consultada `6762d2849ef14ff35d579b4cb38dc9144a97febf`. Tipos de marca, construcción SVG, pruebas a 16/32 px, una tinta, contraste y revisión óptica. Se sigue su punto de elección de concepto antes del kit final.
- https://github.com/neonwatty/logo-designer-skill · comparado como alternativa para exploración SVG y exportación. No instalado ni ejecutado.
- https://github.com/wonjyou/design-audit · criterios contrastados: jerarquía, legibilidad, navegación, etiquetas, estados de error y accesibilidad. Referencia consultada; no se afirma una auditoría visual completa del sitio.

Los logos de referencia no se copiaron. Las tres propuestas son geometrías nuevas para Daya y permanecen como conceptos, sin afirmación de registro ni exclusividad legal.

## Dirección elegida y experiencia 5.0

La persona responsable eligió el DA enlazado del centro de su referencia y autorizó aplicarlo a toda la experiencia. El master se reconstruyó como vector; los trazos y el nombre están convertidos a contornos. Las propuestas previas se conservan en `/identidad/primera-ronda.html`. La ruta `/identidad/` muestra la dirección elegida, versiones en una tinta y firmas. El generador reproducible de marca está en `scripts/brand-kit.py`; requiere FontTools, Inkscape y las fuentes indicadas en sus rutas de entrada.

Se restauró `logo-design` desde el repositorio documentado; `6762d2849ef14ff35d579b4cb38dc9144a97febf` es el SHA del **blob SKILL.md**, no un commit del repositorio. Se revisaron sus reglas de rediseño, construcción SVG, tipografía y pruebas. Se generaron tres exploraciones vectoriales con Figma AI (consumieron créditos); ninguna de ellas sustituye la dirección finalmente elegida. El estudio editable, con texto y vectores nativos, está en https://www.figma.com/design/O1ChTHjdfZ8JeQAtjhy9oS?node-id=3-2 . Sus vistas de dispositivo son esquemas de jerarquía, no capturas de la aplicación.

Skills aplicadas: `figma-use`, `figma-generate-design`, `build-awwwards-quality-sites`, `web-design-guidelines`, `design-engineering` y `dispatching-parallel-agents`. La guía Awwwards se usó como criterio de composición y calidad. Se eligió desplazamiento nativo, CSS y WAAPI para la animación existente y las interacciones; sin Three.js ni motores de scroll añadidos. En gestión se priorizan las tareas frecuentes sin animación decorativa.

Iconografía: Solar Linear de 480 Design, a través del JSON de Iconify (https://github.com/iconify/icon-sets/blob/master/json/solar.json), CC BY 4.0. Las cuentas sociales mantienen sus símbolos. Las fuentes Playfair Display, DM Sans y DM Mono vienen de Google Fonts, con sus licencias OFL en `public/assets/fonts/`. Se sirven localmente. Se mantienen las fotografías existentes, especialmente Dayani en Contacto y los productos animados de Inicio; no se añadieron personas ni testimonios ficticios.

Se conservaron el proyecto de Sites, la API, los modelos de datos, los permisos, los identificadores IndexedDB y las solicitudes locales. Las cachés de la interfaz pública y de gestión ahora tienen nombres separados y siguen excluyendo `/api/`.

Verificación de esta revisión: 17 pruebas existentes pasan, compilación Worker correcta, análisis de sintaxis de los cuatro scripts de aplicación y revisión de referencias locales sin archivos ausentes. Studio tuvo una revisión aislada automatizada en 320, 390, 820 y 1440 px. La vista previa gestionada falló en el relay del puerto 4173 y el navegador CUA devolvió `the gaas-browser node_repl sandbox cannot be disabled`; por tanto, no se afirma una revisión visual interactiva completa ni pruebas físicas de iPhone/iPad de la versión integrada.

## Comprobaciones

- Imagen de las propuestas renderizada e inspeccionada. Pruebas de tamaño a 16, 32 y 64 px. SVG sin fuentes externas ni imágenes incrustadas.
- Pruebas de autenticación, CSRF, roles, sesión revocada, revisión concurrente, idempotencia y no exposición de costos en el catálogo público.
- Rutas de web y gestión, cookies de la pasarela, ausencia de caché de datos privados y validación de recursos locales.
- Sin navegador CUA disponible en esta sesión: no se completó revisión visual interactiva de las pantallas ni pruebas físicas de iPad/iPhone. La página `/gestion/revision-dispositivos.html` permite revisar el panel en tamaños de iPad y teléfono.
