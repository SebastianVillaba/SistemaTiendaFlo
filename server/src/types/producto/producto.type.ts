export interface InsertarProductoRequest {
  nombre?: string;
  codigo?: number | string;
  codigoBarra?: string;
  precio?: number;
  idUsuarioAlta?: number;
  idTipoProducto?: number;
  idTalle?: number;
  idColor?: number;
  activo?: boolean;
  idImpuesto?: number;
  imagenUrl?: string;
}

export interface InsertarProductoResponse {
  success: boolean;                  // Indica si la operación fue exitosa
  message: string;                   // Mensaje descriptivo del resultado
  rowsAffected?: number;             // Número de filas afectadas (opcional)
}

export interface BuscarProductoRequest {
  tipoBusqueda: number;
  busqueda: string;
}

export interface ModificarProductoRequest {
  idProducto: number;
  nombre: string;
  codigo?: number | string;
  codigoBarra?: string;
  precio?: number;
  idUsuarioMod: number;
  idTipoProducto?: number;
  idTalle?: number;
  idColor?: number;
  activo?: boolean;
  idImpuesto?: number;
  imagenUrl?: string;
}

export interface InsertarTipoProductoRequest {
  nombre: string;
  idUsuarioAlta: number;
}

export interface InsertarTalleColorRequest {
  nombre: string;
  idUsuarioAlta: number;
}