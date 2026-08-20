import { all, get, run, transaccion, db } from "./db";
import { hashPin } from "./pin";
import type {
  FamiliaRow,
  MiembroRow,
  MovimientoRow,
  ObjetivoRow,
  PedidoRow,
  PresupuestoRow,
  WalletRow,
} from "@/lib/tipos";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS familias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  pin_hash TEXT,
  pin_salt TEXT,
  creada_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS miembros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  familia_id INTEGER NOT NULL REFERENCES familias(id),
  usuario TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('parent','child')),
  nombre TEXT NOT NULL,
  fecha_nacimiento TEXT,
  avatar TEXT,
  nivel INTEGER NOT NULL DEFAULT 2,
  mesada_monto INTEGER NOT NULL DEFAULT 0,
  mesada_periodo TEXT NOT NULL DEFAULT 'mensual',
  mesada_ultimo_pago TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(familia_id, usuario)
);

CREATE TABLE IF NOT EXISTS wallets (
  miembro_id INTEGER PRIMARY KEY REFERENCES miembros(id) ON DELETE CASCADE,
  saldo INTEGER NOT NULL DEFAULT 0,
  ahorrado INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  familia_id INTEGER NOT NULL REFERENCES familias(id),
  miembro_id INTEGER NOT NULL REFERENCES miembros(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('mesada','extra','gasto','ahorro','aporte_objetivo')),
  monto INTEGER NOT NULL,
  categoria TEXT,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'aprobado' CHECK (estado IN ('aprobado','pendiente','rechazado')),
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS presupuestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  miembro_id INTEGER NOT NULL REFERENCES miembros(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  limite_mensual INTEGER NOT NULL,
  UNIQUE(miembro_id, categoria)
);

CREATE TABLE IF NOT EXISTS objetivos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  miembro_id INTEGER NOT NULL REFERENCES miembros(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  meta INTEGER NOT NULL,
  ahorrado INTEGER NOT NULL DEFAULT 0,
  fecha_deseada TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  familia_id INTEGER NOT NULL REFERENCES familias(id),
  miembro_id INTEGER NOT NULL REFERENCES miembros(id),
  monto INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado','contraoferta')),
  respuesta TEXT,
  monto_oferta INTEGER,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function iniciarBase(): void {
  db.exec(SCHEMA);
  const columnas = db.prepare("PRAGMA table_info(pedidos)").all() as {
    name: string;
  }[];
  if (!columnas.some((c) => c.name === "monto_oferta")) {
    db.exec("ALTER TABLE pedidos ADD COLUMN monto_oferta INTEGER;");
  }
  const famColumnas = db.prepare("PRAGMA table_info(familias)").all() as {
    name: string;
  }[];
  if (!famColumnas.some((c) => c.name === "pin_hash")) {
    db.exec("ALTER TABLE familias ADD COLUMN pin_hash TEXT;");
  }
  if (!famColumnas.some((c) => c.name === "pin_salt")) {
    db.exec("ALTER TABLE familias ADD COLUMN pin_salt TEXT;");
  }
  sembrarSiVacio();
}

iniciarBase();

function fechaOffset(dias: number): string {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  return f.toISOString().slice(0, 10);
}

export function sembrarSiVacio(): void {
  const filas = get<{ n: number }>("SELECT COUNT(*) AS n FROM familias");
  if (filas && filas.n > 0) return;

  transaccion(() => {
    const { hash, salt } = hashPin("1234");
    const fId = run(
      "INSERT INTO familias (nombre, pin_hash, pin_salt) VALUES (?,?,?)",
      "Los López", hash, salt
    ).lastInsertRowid;

    run(
      `INSERT INTO miembros (familia_id, usuario, rol, nombre, avatar, mesada_periodo)
       VALUES (?,?,?,?,?, 'mensual')`,
      fId, "papa", "parent", "Pablo", "👨"
    );
    run(
      `INSERT INTO miembros (familia_id, usuario, rol, nombre, avatar, mesada_periodo)
       VALUES (?,?,?,?,?, 'mensual')`,
      fId, "mama", "parent", "Mariana", "👩"
    );

    const santi = run(
      `INSERT INTO miembros (familia_id, usuario, rol, nombre, fecha_nacimiento, avatar, nivel, mesada_monto, mesada_periodo, mesada_ultimo_pago)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      fId, "santi", "child", "Santiago", "2011-01-12", "🦊", 2, 20000, "mensual", fechaOffset(-1)
    ).lastInsertRowid;
    const vale = run(
      `INSERT INTO miembros (familia_id, usuario, rol, nombre, fecha_nacimiento, avatar, nivel, mesada_monto, mesada_periodo, mesada_ultimo_pago)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      fId, "vale", "child", "Valentina", "2013-03-08", "🐱", 3, 15000, "mensual", fechaOffset(-1)
    ).lastInsertRowid;

    run("INSERT INTO wallets (miembro_id, saldo, ahorrado) VALUES (?,?,?)", santi, 85000, 15000);
    run("INSERT INTO wallets (miembro_id, saldo, ahorrado) VALUES (?,?,?)", vale, 42000, 8000);

    const mov = (
      tipo: string, miembro: number, monto: number, estado: string,
      descripcion: string | null, categoria: string | null, dias: number
    ) =>
      run(
        `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, categoria, descripcion, estado, creado_en)
         VALUES (?,?,?,?,?,?,?, datetime('now', ?))`,
        fId, miembro, tipo, monto, categoria, descripcion, estado, `-${dias} days`
      );

    // Movimientos de Santiago
    mov("mesada", santi, 20000, "aprobado", "Mesada", null, 28);
    mov("mesada", santi, 20000, "aprobado", "Mesada", null, 21);
    mov("mesada", santi, 20000, "aprobado", "Mesada", null, 14);
    mov("mesada", santi, 20000, "aprobado", "Mesada", null, 1);
    mov("extra", santi, 10000, "aprobado", "Plata de la abuela", null, 10);
    mov("gasto", santi, 8000, "aprobado", "Streaming y jueguitos", "Entretenimiento", 5);
    mov("gasto", santi, 8000, "aprobado", "Torneo de la play", "Entretenimiento", 2);
    mov("gasto", santi, 12000, "aprobado", "Salidas con amigos", "Comidas", 3);
    mov("gasto", santi, 5000, "aprobado", "Lapiceras y cuaderno", "Otros", 1);
    mov("ahorro", santi, 15000, "aprobado", "Para la bici", null, 12);

    // Movimientos de Valentina
    mov("mesada", vale, 15000, "aprobado", "Mesada", null, 1);
    mov("mesada", vale, 15000, "aprobado", "Mesada", null, 8);
    mov("gasto", vale, 15000, "aprobado", "Ropa y accesorios", "Entretenimiento", 2);
    mov("gasto", vale, 4000, "aprobado", "Snacks y birras de finde", "Comidas", 4);
    mov("ahorro", vale, 8000, "aprobado", "Ahorro para el viaje", null, 6);

    // Objetivos
    run(
      "INSERT INTO objetivos (miembro_id, nombre, meta, ahorrado, fecha_deseada) VALUES (?,?,?,?,?)",
      santi, "Bicicleta MTB", 180000, 15000, fechaOffset(90)
    );
    run(
      "INSERT INTO objetivos (miembro_id, nombre, meta, ahorrado, fecha_deseada) VALUES (?,?,?,?,?)",
      vale, "Viaje a la costa", 90000, 0, null
    );

    // Presupuestos
    run("INSERT INTO presupuestos (miembro_id, categoria, limite_mensual) VALUES (?,?,?)", santi, "Entretenimiento", 20000);
    run("INSERT INTO presupuestos (miembro_id, categoria, limite_mensual) VALUES (?,?,?)", santi, "Comidas", 25000);
    run("INSERT INTO presupuestos (miembro_id, categoria, limite_mensual) VALUES (?,?,?)", vale, "Entretenimiento", 15000);

    // Pedidos
    run(
      "INSERT INTO pedidos (familia_id, miembro_id, monto, motivo, estado) VALUES (?,?,?,?,'pendiente')",
      fId, santi, 30000, "Zapatillas para el torneo"
    );
    run(
      "INSERT INTO pedidos (familia_id, miembro_id, monto, motivo, estado, respuesta, creado_en) VALUES (?,?,?,?,'aprobado',?, datetime('now','-4 days'))",
      fId, vale, 5000, "Salida al cine con las amigas", "Dale, disfrutá"
    );
  });
}

// ---------------------------------------------------------------------------
// Consultas de dominio
// ---------------------------------------------------------------------------

export function getFamilia(id: number): FamiliaRow | undefined {
  return get<FamiliaRow>("SELECT * FROM familias WHERE id = ?", id);
}

export function getFamiliaPorNombre(nombre: string): FamiliaRow | undefined {
  return get<FamiliaRow>("SELECT * FROM familias WHERE nombre = ? COLLATE NOCASE", nombre);
}

export function getMiembro(id: number): MiembroRow | undefined {
  return get<MiembroRow>("SELECT * FROM miembros WHERE id = ?", id);
}

export function getMiembroEnFamilia(
  familiaId: number,
  usuario: string
): MiembroRow | undefined {
  return get<MiembroRow>(
    "SELECT * FROM miembros WHERE familia_id = ? AND usuario = ? COLLATE NOCASE",
    familiaId,
    usuario
  );
}

export function getMiembrosFamilia(familiaId: number): MiembroRow[] {
  return all<MiembroRow>(
    "SELECT * FROM miembros WHERE familia_id = ? ORDER BY rol DESC, id ASC",
    familiaId
  );
}

export function getWallet(miembroId: number): WalletRow | undefined {
  return get<WalletRow>("SELECT * FROM wallets WHERE miembro_id = ?", miembroId);
}

export function getWalletResumen(miembroId: number): {
  saldo: number;
  ahorrado: number;
  reservadoObjetivos: number;
  disponible: number;
} {
  const wallet = getWallet(miembroId);
  const saldo = wallet?.saldo ?? 0;
  const ahorrado = wallet?.ahorrado ?? 0;
  const reservado = get<{ n: number }>(
    "SELECT COALESCE(SUM(ahorrado),0) AS n FROM objetivos WHERE miembro_id = ?",
    miembroId
  )?.n ?? 0;
  return { saldo, ahorrado, reservadoObjetivos: reservado, disponible: saldo - ahorrado - reservado };
}

export function getMovimientos(miembroId: number, limite = 15): MovimientoRow[] {
  return all<MovimientoRow>(
    "SELECT * FROM movimientos WHERE miembro_id = ? ORDER BY creado_en DESC, id DESC LIMIT ?",
    miembroId,
    limite
  );
}

export function getMovimientosPendientes(
  familiaId: number
): (MovimientoRow & {
  miembro_usuario: string;
  miembro_nombre: string;
  miembro_avatar: string | null;
})[] {
  return all<MovimientoRow & { miembro_usuario: string; miembro_nombre: string; miembro_avatar: string | null }>(
    `SELECT m.*, mm.usuario AS miembro_usuario, mm.nombre AS miembro_nombre, mm.avatar AS miembro_avatar
     FROM movimientos m JOIN miembros mm ON mm.id = m.miembro_id
     WHERE m.familia_id = ? AND m.estado = 'pendiente' AND m.tipo = 'gasto'
     ORDER BY m.creado_en DESC`,
    familiaId
  );
}

export function getPresupuestos(miembroId: number): PresupuestoRow[] {
  return all<PresupuestoRow>(
    "SELECT * FROM presupuestos WHERE miembro_id = ? ORDER BY categoria",
    miembroId
  );
}

export function getGastadoCategoriaMes(miembroId: number, categoria: string): number {
  const r = get<{ n: number }>(
    `SELECT COALESCE(SUM(monto),0) AS n FROM movimientos
     WHERE miembro_id = ? AND tipo = 'gasto' AND categoria = ?
       AND estado IN ('aprobado','pendiente')
       AND strftime('%Y-%m', creado_en) = strftime('%Y-%m','now')`,
    miembroId,
    categoria
  );
  return r?.n ?? 0;
}

export function getGastosDelMesFamilia(familiaId: number): number {
  const r = get<{ n: number }>(
    `SELECT COALESCE(SUM(monto),0) AS n FROM movimientos
     WHERE familia_id = ? AND tipo = 'gasto' AND estado = 'aprobado'
       AND strftime('%Y-%m', creado_en) = strftime('%Y-%m','now')`,
    familiaId
  );
  return r?.n ?? 0;
}

export function getAhorradoFamilia(familiaId: number): {
  ahorrado: number;
  reservadoObjetivos: number;
} {
  const ahorrado = get<{ n: number }>(
    `SELECT COALESCE(SUM(w.ahorrado),0) AS n FROM wallets w
     JOIN miembros mm ON mm.id = w.miembro_id
     WHERE mm.familia_id = ?`,
    familiaId
  )?.n ?? 0;
  const reservado = get<{ n: number }>(
    `SELECT COALESCE(SUM(o.ahorrado),0) AS n FROM objetivos o
     JOIN miembros mm ON mm.id = o.miembro_id
     WHERE mm.familia_id = ?`,
    familiaId
  )?.n ?? 0;
  return { ahorrado, reservadoObjetivos: reservado };
}

export function getTotalAsignadoFamilia(familiaId: number): number {
  const r = get<{ n: number }>(
    `SELECT COALESCE(SUM(w.saldo),0) AS n FROM wallets w
     JOIN miembros mm ON mm.id = w.miembro_id
     WHERE mm.familia_id = ? AND mm.rol = 'child'`,
    familiaId
  );
  return r?.n ?? 0;
}

export function getObjetivos(miembroId: number): ObjetivoRow[] {
  return all<ObjetivoRow>(
    "SELECT * FROM objetivos WHERE miembro_id = ? ORDER BY id DESC",
    miembroId
  );
}

export function getObjetivo(id: number): ObjetivoRow | undefined {
  return get<ObjetivoRow>("SELECT * FROM objetivos WHERE id = ?", id);
}

export function getPedidos(miembroId: number): PedidoRow[] {
  return all<PedidoRow>(
    "SELECT * FROM pedidos WHERE miembro_id = ? ORDER BY creado_en DESC LIMIT 10",
    miembroId
  );
}

export function getPedidosPendientesFamilia(
  familiaId: number
): (PedidoRow & {
  miembro_usuario: string;
  miembro_nombre: string;
  miembro_avatar: string | null;
})[] {
  return all<
    PedidoRow & {
      miembro_usuario: string;
      miembro_nombre: string;
      miembro_avatar: string | null;
    }
  >(
    `SELECT p.*, mm.usuario AS miembro_usuario, mm.nombre AS miembro_nombre, mm.avatar AS miembro_avatar
     FROM pedidos p JOIN miembros mm ON mm.id = p.miembro_id
     WHERE p.familia_id = ? AND p.estado = 'pendiente'
     ORDER BY p.creado_en DESC`,
    familiaId
  );
}

export function getPedido(id: number): PedidoRow | undefined {
  return get<PedidoRow>("SELECT * FROM pedidos WHERE id = ?", id);
}

// ---------------------------------------------------------------------------
// Mesada automática (bonus): chequeo al cargar el dashboard
// ---------------------------------------------------------------------------

export function procesarMesadasAutomaticas(familiaId: number): void {
  const hijos = all<MiembroRow>(
    "SELECT * FROM miembros WHERE familia_id = ? AND rol = 'child' AND mesada_monto > 0",
    familiaId
  );
  for (const hijo of hijos) {
    const ultimo = hijo.mesada_ultimo_pago;
    let toca = false;
    if (!ultimo) {
      toca = true;
    } else if (hijo.mesada_periodo === "mensual") {
      toca = get<{ d: string }>(
        "SELECT date(?) AS d WHERE d < date('now','start of month')",
        ultimo
      ) !== undefined;
    } else {
      const dias = get<{ d: number }>(
        "SELECT CAST(julianday('now') - julianday(?) AS INTEGER) AS d",
        ultimo
      )?.d ?? 0;
      toca = dias >= 7;
    }
    if (toca) {
      run(
        `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, descripcion, estado)
         VALUES (?,?,'mesada',?, 'Mesada automática', 'aprobado')`,
        familiaId, hijo.id, hijo.mesada_monto
      );
      run("UPDATE wallets SET saldo = saldo + ? WHERE miembro_id = ?", hijo.mesada_monto, hijo.id);
      run("UPDATE miembros SET mesada_ultimo_pago = date('now') WHERE id = ?", hijo.id);
    }
  }
}