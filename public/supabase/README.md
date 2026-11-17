# Daya Clothing — ruta de integración con Supabase

**Estado:** integración preparada como diseño de tablas y políticas de acceso; no conectada al panel HTML.

1. Crear un proyecto Supabase privado y habilitar autenticación mediante email.
2. Ejecutar `001_schema.sql` tras revisar las reglas de acceso y la configuración de la Data API.
3. Crear los usuarios con Auth Admin API desde un servidor confiable; asignar `app_metadata.daya_role` a `admin`, `operador` o `consulta`. Este atributo jamás debe venir de un formulario público.
4. Configurar exclusivamente la URL y la clave **publicable** del cliente en el frontend. Nunca `service_role` ni una clave secreta.
5. Sustituir la persistencia en IndexedDB por un repositorio Supabase con operaciones CRUD. Poner operaciones críticas de orden+stock en RPC transaccional del servidor.
6. Añadir subida de imágenes a Storage con bucket privado o políticas RLS, formatos y límites; usar URLs firmadas cuando corresponda.
7. Activar correo transaccional con función segura (Supabase Edge Function, Vercel Function o Cloudflare Worker) y proveedor autenticado. Guardar credenciales únicamente en secretos de servidor.
8. Probar permisos entre usuarios, RLS, sesiones caducadas, stock insuficiente, cancelaciones, restauración de datos y operación desde iPad + escritorio.

## Ejemplo de cliente (no se ejecuta en el demo)

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)

const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) throw new Error('Sesión inválida')

const { data: products } = await supabase.from('products').select('*').order('created_at')
```

Utilizar versiones fijadas y lockfile al adoptar Vite/React; revisar changelog de Supabase. Las cuentas `@daya.local` son únicamente para pruebas de la versión desconectada.
