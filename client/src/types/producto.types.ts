export interface Producto {
  idProducto?: number;
  nombre: string;
  codigo: string;
  codigoBarra: string;
  precio: number;
  costo: number;
  idTipoProducto: number;
  idTalle: number;
  idColor: number;
  idUsuarioAlta?: number;
  idStock?: number;
  activo?: boolean;
  idImpuesto?: number;
  imagenUrl?: string;
}

export interface Talle {
  idTalle: number;
  nombreTalle: string;
}

export interface Color {
  idColor: number;
  nombreColor: string;
}

export interface TipoProducto {
  idTipoProducto: number;
  nombreTipo: string;
  activo: boolean;
  habilitarDecimal: boolean;
}
