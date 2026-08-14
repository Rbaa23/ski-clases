# StatClass - Resumen de la App

## Qué es
Aplicación web para un instructor de ski que registra clases (particulares, colectivas, requeridas) y genera resúmenes de cobro para alumnos.

## Stack
- **Frontend**: React (un solo archivo `src/App.jsx` ~2800 líneas)
- **Backend**: Supabase (auth + PostgreSQL)
- **Deploy**: Vercel (auto-deploy al hacer push a `main`)
- **Dominio**: ski-clases.vercel.app (custom domain configurado)

## Funcionalidades activas

| Módulo | Estado |
|--------|--------|
| Login/Registro (email + Google) | ✅ |
| Recuperar contraseña | ✅ |
| Selector de disciplina (Ski/Snowboard) | ✅ |
| Stepper horas/precio por tipo | ✅ |
| Extras (traslado, peaje, estacionamiento, Viña) | ✅ |
| Selector de alumnos | ✅ |
| Calendario con resumen diario | ✅ |
| Vista por día con resumen por alumno | ✅ |
| Edición de clases | ✅ |
| Eliminación de clases | ✅ |
| Confirmación antes de eliminar | ✅ |
| Cálculo automático de horas en edición | ✅ |
| Toasts de éxito/error | ✅ |
| Panel admin (Apruebo/Rol/Block) | ✅ |
| Resumen por alumno (vista administrador) | ✅ |
| Pendientes badge rojo en admin | ✅ |
| Resumen de ingresos por mes | ✅ |
| Selector de año en ingresos | ✅ |
| Recordatorio por WhatsApp (21:00 diario) | ✅ |
| Resumen mensual por WhatsApp (1° del mes 9:00) | ✅ |
| Botón de emergencia (Marce) | ✅ |

## Colores de tipos de clase

| Tipo | Color | Hex |
|------|-------|-----|
| Particular | Verde | `#66BB6A` |
| Colectiva | Gris oscuro | `#546E7A` |
| Requerida | Lila claro | `#E1BEE7` |
| Fondo app | Negro puro | `#000000` |

## Pendientes conocidos
- Fondo del month picker sigue con `#161b22` (no se tocó)
- Admin y login usan gradiente oscuro `linear-gradient(160deg,#0a1628,#0d2035)` en algunos elementos (modales, bottom sheets) — podrían necesitar actualización a negro puro
