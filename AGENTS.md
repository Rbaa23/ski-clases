# AGENTS.md — StatClass

## Links directos

| Servicio | URL |
|---|---|
| **GitHub** | https://github.com/Rbaa23/ski-clases |
| **Vercel (deploy)** | https://ski-clases.vercel.app |
| **Supabase Dashboard** | https://supabase.com/dashboard (buscar proyecto "ski-clases") |
| **Vercel Dashboard** | https://vercel.com/dashboard (buscar proyecto "ski-clases") |

## Qué es la app

**StatClass** es una app web para profesores de ski/snowboard que registra clases, calcula ganancias, y envía recordatorios por email y push. Todo el código está en un solo archivo: `src/App.jsx` (~1900 líneas).

## Stack

- **Frontend**: React 19 + Vite (sin router, todo en un archivo)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **APIs**: Vercel Serverless Functions (`api/*.js`)
- **Emails**: Resend (via REST)
- **Push**: Web Push API + service worker
- **Deploy**: Vercel (automático desde GitHub)

## Estructura del proyecto

```
ski-clases/
├── src/
│   └── App.jsx               # TODA la app (~1900 líneas)
│   └── main.jsx              # Entry point + service worker registration
├── api/
│   ├── recordatorio.js        # Cron 21h: email + push si no registraste clases hoy
│   ├── resumen-mensual.js     # Cron día 1: resumen financiero mensual por email
│   └── subscribe.js           # POST/DELETE: guardar/eliminar suscripción push
├── public/
│   └── sw.js                  # Service worker para push notifications
├── supabase-functions.sql     # Migraciones SQL (push_subs, adicional)
├── vercel.json                # Config de crons
├── package.json               # Dependencias
└── AGENTS.md                  # Este archivo
```

## Tabs de la app

1. **Registro** — Registrar clases (Particular/Colectiva/Requerida), descuentos, otros ingresos/gastos
2. **Estadísticas** — Calendario, Por Día, Por Mes, Disciplina (solo polivalente)

## Tipos de clase

| Tipo | Color | Precio por hora | Campos extra |
|---|---|---|---|
| Particular | Azul `#4FC3F7` | `precios.particular` | horas, adicional |
| Colectiva | Verde `#81C784` | `precios.colectiva` | horas, personas, extras |
| Requerida | Naranja `#FFB74D` | `precios.requerida` | horas, adicional |

## Fórmulas de cálculo

```
Particular:  valor = precio × horas + adicional × cantidad × horas
Colectiva:   valor = precio × horas + extra_price × extras
             extras = max(0, personas - colectiva_base)
Requerida:   valor = precio × horas + adicional × cantidad × horas

Total mensual = totalBruto - descuentos - otrosGastos + otrosIngresos
```

## Tablas Supabase

### profiles
| Columna | Tipo | Default | Notas |
|---|---|---|---|
| id | uuid PK | | references auth.users |
| email | text | | |
| nombre | text | | |
| aprobado | boolean | false | Admin debe aprobar |
| is_admin | boolean | false | |
| disciplina | text | "ski" | "ski", "snow", "polivalente" |
| recordar | boolean | false | Email diario 21h |
| resumen_mensual | boolean | false | Email día 1 |
| last_seen | timestamptz | | Se actualiza en cada login |
| avatar_url | text | | Foto de perfil |

### precios (1 fila por usuario)
| Columna | Tipo | Default |
|---|---|---|
| user_id | uuid PK FK | |
| particular | numeric | 24000 |
| colectiva | numeric | 27000 |
| colectiva_extra | numeric | 1000 |
| colectiva_base | integer | 3 |
| requerida | numeric | 27000 |
| adicional | numeric | 5000 |
| mostrar_monto | boolean | true |

### clases
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| fecha | timestamptz | Fecha y hora de la clase |
| tipo | text | particular/colectiva/requerida |
| valor | numeric | Calculado al registrar |
| personas | integer | Solo colectiva |
| extras | integer | Solo colectiva |
| adicional | integer | Solo particular/requerida |
| comentario | text | Opcional |
| horas | numeric | Default 1 |
| disciplina_clase | text | "ski" o "snow" |
| created_at | timestamptz | |

### descuentos
| Columna | Tipo |
|---|---|
| id | uuid PK |
| user_id | uuid FK |
| valor | numeric |
| fecha | timestamptz |

### otros
| Columna | Tipo |
|---|---|
| id | uuid PK |
| user_id | uuid FK |
| nombre | text |
| tipo | text ("gasto" o "ingreso") |
| valor | numeric |
| fecha | timestamptz |

### push_subs
| Columna | Tipo | Constraint |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid FK | UNIQUE, ON DELETE CASCADE |
| endpoint | text | |
| auth | text | |
| p256dh | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: "Users can manage their own push sub" FOR ALL USING (auth.uid() = user_id)

### sesiones
| Columna | Tipo |
|---|---|
| id | uuid PK |
| user_id | uuid FK |
| created_at | timestamptz |

## Variables de entorno

### Frontend (VITE_)
- `VITE_SUPABASE_URL` — URL del proyecto Supabase
- `VITE_SUPABASE_KEY` — Anon key de Supabase
- `VITE_VAPID_PUBLIC_KEY` — (opcional, tiene fallback hardcodeado)

### Serverless (Vercel)
- `SUPABASE_URL` — URL de Supabase
- `SUPABASE_ANON_KEY` — Anon key
- `RESEND_KEY` — API key de Resend
- `CRON_SECRET` — Secret para autenticar crons
- `VAPID_PUBLIC_KEY` — Web Push public key
- `VAPID_PRIVATE_KEY` — Web Push private key
- `VAPID_SUBJECT` — Default: mailto:admin@statclass.com

## APIs (Vercel Serverless)

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/api/recordatorio?secret=X` | Cron 21h: push + email recordatorio |
| GET | `/api/resumen-mensual?secret=X` | Cron día 1: resumen financiero |
| POST | `/api/subscribe` | Guardar suscripción push |
| DELETE | `/api/subscribe` | Eliminar suscripción push |

## Crons (vercel.json)

```json
{ "crons": [
  { "path": "/api/recordatorio", "schedule": "0 21 * * *" },
  { "path": "/api/resumen-mensual", "schedule": "0 9 1 * *" }
]}
```

## Funciones principales en App.jsx

| Función | Línea aprox | Qué hace |
|---|---|---|
| `handleAuth(u)` | ~1204 | Login: crea sesión, carga perfil/precios/clases |
| `calcularValor(tipo, horas, adicional)` | ~1254 | Calcula valor según tipo y horas |
| `agregarClase(tipo)` | ~1264 | INSERT en Supabase + limpia estados |
| `handleCalendarAdd(data)` | ~1282 | INSERT desde calendario |
| `handleEliminarClase(id)` | ~1289 | DELETE clase |
| `handleGuardarEdit(clase)` | ~1295 | UPDATE clase editada |
| `agregarDescuento()` | ~1305 | INSERT descuento |
| `agregarOtro()` | ~1318 | INSERT otro ingreso/gasto |
| `togglePush(v)` | ~1331 | Activa/desactiva push notifications |
| `guardarPrecios()` | ~1360 | Guarda precios + preferencias |

## Componentes

| Componente | Props | Qué hace |
|---|---|---|
| `AuthScreen` | onAuth | Login/register/recovery |
| `PendienteScreen` | user, onLogout | Cuenta pendiente de aprobación |
| `AdminPanel` | onBack | Gestión de usuarios, historial, stats |
| `EditarPerfil` | profile, onGuardar, onCerrar | Editar nombre y foto |
| `Calendario` | clases, disc, onDelete, onEdit, onAddForDate | Vista mensual con dots de color |
| `PorDia` | clases, disc, onDelete, onEdit | Lista día por día |
| `PorMes` | clases | Comparación mensual anual + temporadas |
| `PorDisciplina` | clases | Ski vs Snow (solo polivalente) |
| `CalendarAddModal` | fecha, tipo, precios, personas, disc, onConfirm, onCancel | Modal completo para agregar desde calendario |
| `Toggle` | value, onChange, label, desc | Switch toggle |
| `Avatar` | url, nombre, email, color, bg, size | Foto o iniciales |

## Paleta de colores

| Color | Hex | Uso |
|---|---|---|
| Azul primario | `#4FC3F7` | Headers, links, tabs activos, ski |
| Verde | `#81C784` | Colectiva, aprobado, ingresos |
| Naranja | `#FFB74D` | Requerida, pendiente, mejor mes |
| Rojo | `#ef5350` | Eliminar, errores, descuentos |
| Fondo oscuro | `#0a1628` | Background principal |
| Fondo cards | `#0d2a3a` | Inputs, cards |
| Texto primario | `#e8f4f8` | Texto principal |
| Texto secundario | `#90CAF9` | Labels, info secundaria |
| Texto muted | `#607d8b` | Hints, inactivo |

## Patrones de UI

- **Mobile-first**: Todo diseñado para pantallas verticales, max-width 400px en modales
- **Bottom sheet modals**: Se abren desde abajo con border-radius 20px arriba
- **Glassmorphism**: Cards con fondos semitransparentes `rgba(255,255,255,0.03-0.05)`
- **Steppers circulares**: Botones +/- de 30px con bordes de color del tipo
- **Hoy en naranja**: `#FF8C00` con badge "hoy"
- **Emojis como íconos**: No se usan librerías de íconos

## Comandos

```bash
npm run dev      # Dev server local
npm run build    # Build producción → dist/
npm run preview  # Preview del build
```

## Deploy

Vercel deploya automáticamente al hacer push a `main` en GitHub. El build se verifica con `npm run build` antes de cada push.

## Notas importantes

1. **Todo está en un solo archivo** (`src/App.jsx`) — no hay componentes separados
2. **Sin React Router** — la navegación es con states (`tab`, `subTabCal`)
3. **Sin CSS files** — todo es inline styles en JSX
4. **La fecha de clases** se guarda con timezone local usando `localISOString()`
5. **El admin debe aprobar** a cada usuario nuevo antes de que pueda usar la app
6. **Polivalente** permite registrar clases de ski y snow en la misma cuenta
7. **El resumen mensual** calcula retención del 15.25% automáticamente
