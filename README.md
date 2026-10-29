# Sistema de Registro de Visitas — Biblioteca Virtual UNES

Aplicación web con Next.js App Router, TypeScript, Supabase Auth/PostgreSQL y despliegue en Vercel.

## Funciones incluidas

- Inicio de sesión con Supabase Auth.
- Roles `admin` y `operator`.
- Panel con indicadores y visitas recientes.
- Formulario de registro con catálogos dependientes según el tipo de visitante.
- Historial con búsqueda por cédula, nombre o apellido.
- Registro de hora de salida.
- Reportes filtrables por fechas, exportación CSV compatible con Excel e impresión/guardar como PDF.
- Gestión administrativa de usuarios y activación/desactivación.
- Esquema PostgreSQL con RLS y funciones de rol.

## 1. Requisitos

- Node.js 20.9 o superior.
- Cuenta en Supabase, Vercel y GitHub.

## 2. Preparar Supabase

1. Crea un proyecto Supabase.
2. En `SQL Editor`, ejecuta el archivo `supabase/schema.sql`.
3. En `Authentication > Providers > Email`, habilita Email y desactiva el registro público si aparece habilitado.
4. En `Project Settings > API`, copia la Project URL y la clave publicable/anon.
5. Crea el primer usuario desde `Authentication > Users > Add user`.
6. Copia el UUID de ese usuario y ejecuta este SQL sustituyendo los valores:

```sql
insert into public.profiles (id, full_name, role, active)
values ('UUID-DEL-USUARIO', 'Administrador UNES', 'admin', true)
on conflict (id) do update
set role = 'admin', active = true, full_name = excluded.full_name;
```

El usuario inicial debe crearse manualmente en Supabase antes de usar el panel. Los usuarios posteriores se crean desde el menú Usuarios del sistema. El endpoint crea la cuenta con correo confirmado porque la contraseña temporal se entrega directamente por el administrador; acuerda con la institución el procedimiento para el cambio inicial de contraseña.

### Nota de seguridad sobre la clave service role

En `Project Settings > API Keys`, copia la clave secreta/service role solo para el servidor. No la pongas en variables `NEXT_PUBLIC_*`, no la subas a GitHub y no la compartas. Vercel la almacenará como variable de entorno del servidor.

## 3. Ejecutar localmente

```bash
npm install
cp .env.example .env.local
```

Completa `.env.local` con tus credenciales reales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
SUPABASE_SERVICE_ROLE_KEY=TU_CLAVE_SECRETA_SOLO_SERVIDOR
```

Después ejecuta:

```bash
npm run dev
```

Abre http://localhost:3000.

## 4. Publicar en GitHub

Crea un repositorio vacío en GitHub y ejecuta desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Inicializar sistema de visitas UNES"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/unes-biblioteca-visitas.git
git push -u origin main
```

No subas `.env.local`. El `.gitignore` ya lo excluye.

## 5. Desplegar en Vercel

1. Importa el repositorio desde Vercel.
2. Agrega `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en Project Settings > Environment Variables.
3. Asegúrate de incluir las variables en Production, Preview y Development según corresponda.
4. Pulsa Deploy.
5. Si cambias variables, vuelve a desplegar.

## 6. Comprobaciones antes de usar con datos reales

- Inicia sesión con el usuario administrador inicial.
- Crea una cuenta de operador desde Usuarios.
- Verifica que el operador no pueda acceder a Usuarios ni Configuración.
- Registra una visita de prueba y registra su salida.
- Prueba exportación CSV y Guardar como PDF.
- Prueba acceder sin sesión a `/dashboard` y `/usuarios`.
- Comprueba las políticas RLS en Supabase.
- Configura backups y retención de datos de acuerdo con las políticas institucionales.

## Decisiones que deben validarse con la institución

- El esquema crea un índice único para que una misma cédula no tenga dos visitas en la misma fecha. Si se permiten varias visitas en un día, elimina `idx_visitas_cedula_fecha`.
- Los reportes consultan hasta 5.000 filas por carga inicial; para volúmenes superiores se recomienda paginación o reportes SQL dedicados.
- La exportación PDF usa el diálogo de impresión del navegador; no requiere una librería PDF adicional.
- El registro de salida se realiza mediante la función PostgreSQL `registrar_salida_visita`, y no mediante UPDATE directo desde el navegador. Así, los operadores no pueden modificar los datos históricos de una visita desde la API. La eliminación sigue restringida al rol administrador.
- Revisar las listas de núcleos, denominaciones de programas y categorías con los responsables de la UNES.
- Configurar la política de privacidad, acceso a datos personales, auditoría y tiempos de conservación antes de producción.
