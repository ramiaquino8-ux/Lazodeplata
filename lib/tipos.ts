export type Rol = "parent" | "child";
export type Nivel = 1 | 2 | 3;
export type EstadoMovimiento = "aprobado" | "pendiente" | "rechazado";
export type EstadoPedido = "pendiente" | "aprobado" | "rechazado" | "contraoferta";
export type PeriodoMesada = "mensual" | "semanal";

export interface FamiliaRow {
  id: number;
  nombre: string;
  pin_hash: string | null;
  pin_salt: string | null;
  creada_en: string;
}

export interface MiembroRow {
  id: number;
  familia_id: number;
  usuario: string;
  rol: Rol;
  nombre: string;
  fecha_nacimiento: string | null;
  avatar: string | null;
  nivel: Nivel;
  mesada_monto: number;
  mesada_periodo: PeriodoMesada;
  mesada_ultimo_pago: string | null;
  creado_en: string;
}

export interface WalletRow {
  miembro_id: number;
  saldo: number;
  ahorrado: number;
}

export interface MovimientoRow {
  id: number;
  familia_id: number;
  miembro_id: number;
  tipo: string;
  monto: number;
  categoria: string | null;
  descripcion: string | null;
  estado: EstadoMovimiento;
  creado_en: string;
}

export interface PresupuestoRow {
  id: number;
  miembro_id: number;
  categoria: string;
  limite_mensual: number;
}

export interface ObjetivoRow {
  id: number;
  miembro_id: number;
  nombre: string;
  meta: number;
  ahorrado: number;
  fecha_deseada: string | null;
  creado_en: string;
}

export interface PedidoRow {
  id: number;
  familia_id: number;
  miembro_id: number;
  monto: number;
  monto_oferta: number | null;
  motivo: string;
  estado: EstadoPedido;
  respuesta: string | null;
  creado_en: string;
}

export interface EstadoAction {
  ok: boolean;
  error?: string;
  mensaje?: string;
}

export const NIVELES: Record<Nivel, string> = {
  1: "Supervisado",
  2: "Guiado",
  3: "Autónomo",
};

export const DESCRIPCION_NIVEL: Record<Nivel, string> = {
  1: "Cada gasto necesita aprobación del adulto.",
  2: "Gasta libre, con límites por categoría.",
  3: "Administra solo; el adulto solo mira reportes.",
};