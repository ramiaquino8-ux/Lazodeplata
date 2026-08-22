# LazoDePlata

Plata simulada para que chicos aprendan a administrar su plata.

Cada familia elige el nombre de la familia, un **PIN** (4 a 10 números) y los
usuarios. Al entrar se guarda una cookie (`lazo_sesion`, httpOnly, 1 año) y toda
la información queda en una base SQLite local. El PIN se guarda **hasheado**
(`scrypt`), nunca en texto plano.

## Requisitos

- Node.js **22.5+** (usa `node:sqlite`, nativo). Probado con Node 26.

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:3000
```

La base se crea sola en `data/lazodeplata.db` la primera vez que arranca y se
siembra con una familia de ejemplo:

- Familia **Los López** — PIN `1234`, entrar con usuario `papa`, `mama`, `santi`
  o `vale`.
  - `santi`: nivel 2 (Guiado), con presupuestos y el objetivo “Bicicleta MTB”.
  - `vale`: nivel 3 (Autónomo), con su objetivo al 100 %.

> Para volver a sembrar la base desde cero, borrá la carpeta `data/` y reiniciá
> el servidor. Al borrarla se pierden todas las familias creadas.

## Cómo funciona

### Roles y niveles

| Nivel | Nombre      | Qué puede hacer el hijo                                   |
|-------|-------------|-----------------------------------------------------------|
| 1     | Supervisado | Cada gasto queda pendiente hasta que un adulto lo aprueba |
| 2     | Guiado      | Gasta directo, pero con límites por categoría que lo bloquean |
| 3     | Autónomo    | Administra solo; los presupuestos solo avisan             |

El adulto puede cambiar el nivel de cada hijo desde el dashboard del padre.

### Lo que puede hacer cada uno

**Adulto**
- Crear familia y agregar hijos (usuario, nombre, fecha de nacimiento, avatar, mesada opcional).
- Mandar mesada manual o configurar mesada mensual/semanal.
- Dar plata extra, configurar presupuestos por categoría por hijo.
- Aportar directo a un objetivo del hijo.
- Aprobar/rechazar gastos pendientes (nivel 1) y pedidos de plata, o hacer una contraoferta.

**Hijo**
- Ver su plata disponible, su ahorro y sus objetivos.
- Registrar gastos (con avisos al llegar al 80 % y 100 % del presupuesto).
- Ahorrar (la plata ahorrada no se puede sacar).
- Crear objetivos con fecha deseada (se le sugiere cuánto ahorrar por semana) y aportarles.
- Pedir plata con motivo, y aceptar o rechazar contraofertas.

### Reglas de la plata

- El **disponible** es lo que el hijo puede gastar: `saldo − ahorro − ahorro de objetivos`.
- El gasto del mes por categoría cuenta gastos **aprobados + pendientes**.
- Los hijos solo operan dentro de su propia familia (aislamiento total entre familias).
- Mesadas automáticas: si el hijo tiene mesada configurada, se le deposita al
  entrar al dashboard cuando corresponde (mensual al inicio del mes, o semanal
  a los 7 días).
- Montos en pesos argentinos: `$45.200` (formato `es-AR`).

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4**
- **Zod** para validar formularios
- **node:sqlite** para persistencia (sin dependencias externas)
- **scrypt** (nativo de Node) para el PIN de la familia
- Escrituras 100 % vía **Server Actions**; las páginas de los dashboards son
  server components con `force-dynamic`.

## Deploy en Render

> Requisito: el **plan free** de Render no permite disco persistente, así que la
> base se reinicia con cada deploy. Para que los datos duren necesitás un plan
> de pago (Starter) o el disco montado.

1. Subí el proyecto a un repo de GitHub.
2. En [render.com](https://render.com) → **New → Web Service** → conectá el repo.
3. Build: `npm ci && npm run build` · Start: `npm run start` · Node 22+.
4. Montá un **Persistent Disk** (1 GB) en `/var/data` y creá la variable de
   entorno `LAZO_DATA_DIR=/var/data`. Para la cookie `secure` en HTTPS agregá
   `LAZO_SECURE_COOKIE=true`.
5. Te queda un subdominio `algo.onrender.com`. Para tu dominio propio, en
   **Settings → Custom Domain** apuntás tu dominio (CNAME hacia el de Render).

También incluí un `render.yaml` con la configuración lista: en Render usá
**New → Blueprint** y te crea el servicio con disco y variables ya puestas.

## Estructura

```
lib/
  db.ts            Conexión SQLite (WAL, transacciones)
  data.ts          Schema, seed y consultas de dominio
  tipos.ts         Tipos y constantes (niveles, etc.)
  dinero.ts        Formateo de pesos y fechas
  validaciones.ts  Esquemas Zod, categorías y avatares
  session.ts       Cookie de sesión
  pin.ts           Hash y verificación del PIN (scrypt)
app/
  actions.ts       Todas las Server Actions (reglas de negocio)
  login/           Acceso (armar familia / entrar)
  f/[id]/padre/    Dashboard del adulto
  f/[id]/hijo/     Dashboard del hijo
  f/[id]/hijo/objetivo/  Objetivos del hijo
  components/      Componentes compartidos
```

## Tests manuales

Levantá el server y probá: entrar como `santi` (hijo) y como `papa` (adulto)
con el PIN `1234`, crear una familia nueva con otro PIN, registrar gastos en
cada nivel y aprobar pedidos.