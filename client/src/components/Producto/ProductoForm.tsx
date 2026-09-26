import {
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Box,
  Stack,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  TextField as MuiTextField,
} from '@mui/material';
import TextField from '../UppercaseTextField';
import { useState, useEffect, useRef } from 'react';
import type { Producto, TipoProducto, Talle, Color } from '../../types/producto.types';
import { productoService } from '../../services/producto.service';
import { impuestoService } from '../../services/impuesto.service';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

type QuickCreateTipo = 'tipoProducto' | 'talle' | 'color';

const QUICK_CREATE_CONFIG: Record<QuickCreateTipo, { nombre: string; titulo: string; label: string; maxLength: number }> = {
  tipoProducto: { nombre: 'tipo de producto', titulo: 'Crear Tipo de Producto Rápido', label: 'Nombre del Tipo de Producto', maxLength: 30 },
  talle: { nombre: 'talle', titulo: 'Crear Talle Rápido', label: 'Nombre del Talle', maxLength: 25 },
  color: { nombre: 'color', titulo: 'Crear Color Rápido', label: 'Nombre del Color', maxLength: 25 },
};

const quickCreateButtonSx = {
  backgroundColor: 'action.hover',
  '&:hover': {
    backgroundColor: 'primary.light',
    color: 'primary.contrastText',
  }
};

interface ProductoFormProps {
  formData: Producto;
  setFormData: React.Dispatch<React.SetStateAction<Producto>>;
  guardarRef?: React.RefObject<HTMLButtonElement>;
}

export default function ProductoForm({ formData, setFormData, guardarRef }: ProductoFormProps): JSX.Element {
  const [tiposProducto, setTiposProducto] = useState<TipoProducto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [impuestos, setImpuestos] = useState<any[]>([]);
  const [talles, setTalles] = useState<Talle[]>([]);
  const [colores, setColores] = useState<Color[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // States for Quick Create Tipo Producto Modal
  const nombreRef = useRef<HTMLInputElement>(null);
  const codigoRef = useRef<HTMLInputElement>(null);
  const codigoBarraRef = useRef<HTMLInputElement>(null);
  const precioRef = useRef<HTMLInputElement>(null);
  const tipoProductoRef = useRef<HTMLInputElement>(null);
  const talleRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const impuestoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the Nombre field when the form is mounted
    setTimeout(() => {
      nombreRef.current?.focus();
    }, 100);
  }, []);

  // Creación rápida de Tipo de Producto / Talle / Color (null = cerrado)
  const [quickCreate, setQuickCreate] = useState<QuickCreateTipo | null>(null);
  const [quickCreateNombre, setQuickCreateNombre] = useState<string>('');
  const [quickCreateError, setQuickCreateError] = useState<string>('');
  const [quickCreateLoading, setQuickCreateLoading] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await handleFileUpload(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecciona un archivo de imagen válido.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no debe superar los 5MB.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const result = await productoService.uploadImagen(file);
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          imagenUrl: result.imagenUrl
        }));
      } else {
        setUploadError('Error al subir la imagen.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imagenUrl: ''
    }));
    setUploadError('');
  };

  console.log(formData);

  const fetchTiposProducto = async (): Promise<TipoProducto[]> => {
    setLoading(true);
    try {
      const tipos = await productoService.obtenerTiposProducto();
      setTiposProducto(tipos);
      return tipos;
    } catch (error) {
      console.error('Error al cargar tipos de producto:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTalles = async (): Promise<Talle[]> => {
    const lista = await productoService.obtenerTalles();
    setTalles(lista);
    return lista;
  };

  const fetchColores = async (): Promise<Color[]> => {
    const lista = await productoService.obtenerColores();
    setColores(lista);
    return lista;
  };

  const handleOpenQuickCreate = (tipo: QuickCreateTipo) => {
    setQuickCreateNombre('');
    setQuickCreateError('');
    setQuickCreate(tipo);
  };

  const handleCloseQuickCreate = () => {
    setQuickCreate(null);
  };

  /**
   * Crea el registro, refresca el combo y deja seleccionado el nuevo valor.
   */
  const crearYSeleccionar = async (tipo: QuickCreateTipo, nombre: string): Promise<void> => {
    // Usamos el ID de usuario 1 como default (o el que corresponda)
    const idUsuario = 1;
    const mismoNombre = (valor: string) => valor.trim().toUpperCase() === nombre.toUpperCase();

    if (tipo === 'tipoProducto') {
      const response = await productoService.insertarTipoProducto(nombre, idUsuario);
      if (!response.success) throw new Error(response.message || 'Error al crear el tipo de producto');
      // Buscar el tipo recién creado en la lista actualizada (case insensitive)
      const creado = (await fetchTiposProducto()).find((t) => mismoNombre(t.nombreTipo));
      if (creado) setFormData((prev) => ({ ...prev, idTipoProducto: creado.idTipoProducto }));
    } else if (tipo === 'talle') {
      const response = await productoService.insertarTalle(nombre, idUsuario);
      if (!response.success) throw new Error(response.message || 'Error al crear el talle');
      const lista = await fetchTalles();
      const idTalle = response.idTalle ?? lista.find((t) => mismoNombre(t.nombreTalle))?.idTalle;
      if (idTalle) setFormData((prev) => ({ ...prev, idTalle }));
    } else {
      const response = await productoService.insertarColor(nombre, idUsuario);
      if (!response.success) throw new Error(response.message || 'Error al crear el color');
      const lista = await fetchColores();
      const idColor = response.idColor ?? lista.find((c) => mismoNombre(c.nombreColor))?.idColor;
      if (idColor) setFormData((prev) => ({ ...prev, idColor }));
    }
  };

  const handleSaveQuickCreate = async () => {
    if (!quickCreate) return;

    if (!quickCreateNombre.trim()) {
      setQuickCreateError('El nombre es obligatorio');
      return;
    }

    setQuickCreateLoading(true);
    setQuickCreateError('');

    try {
      await crearYSeleccionar(quickCreate, quickCreateNombre.trim());
      handleCloseQuickCreate();
    } catch (err: any) {
      console.error(`Error al crear ${QUICK_CREATE_CONFIG[quickCreate].nombre} rápido:`, err);
      setQuickCreateError(err.message || `Error al crear el ${QUICK_CREATE_CONFIG[quickCreate].nombre}`);
    } finally {
      setQuickCreateLoading(false);
    }
  };

  useEffect(() => {
    const fetchImpuesto = async () => {
      setLoading(true);
      try {
        const tipos = await impuestoService.consultaImpuesto();
        setImpuestos(tipos);
      } catch (error) {
        console.error('Error al cargar tipos de producto:', error);
      } finally {
        setLoading(false);
      }
    }

    const fetchTallesColores = async () => {
      try {
        await Promise.all([fetchTalles(), fetchColores()]);
      } catch (error) {
        console.error('Error al cargar talles y colores:', error);
      }
    }

    fetchTiposProducto();
    fetchImpuesto();
    fetchTallesColores();
  }, []);

  const handleChange = (field: keyof Producto) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box>
      <Typography variant="caption" color="error" sx={{ my: 2, display: 'block' }}>
        * Datos Obligatorios
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        gap: 4, 
        flexDirection: { xs: 'column', md: 'row' }, 
        alignItems: 'flex-start' 
      }}>
        {/* Columna Izquierda: Formulario de Datos */}
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          <Stack spacing={2.5}>
            {/* Fila 1: ID y Nombre */}
            <Stack direction="column" spacing={2}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <TextField
                  label="ID Producto"
                  value={formData.idProducto || ''}
                  disabled
                  size="small"
                  sx={{ width: '150px' }}
                />
                <TextField
                  label="Costo"
                  value={formData.costo || ''}
                  disabled
                  size="small"
                  sx={{ width: '150px' }}
                />
              </Box>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.nombre}
                onChange={handleChange('nombre')}
                required
                size="small"
                error={!formData.nombre}
                helperText={!formData.nombre ? 'Campo obligatorio' : ''}
                inputRef={nombreRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    codigoRef.current?.focus();
                  }
                }}
              />
            </Stack>

            {/* Fila 2: Código */}
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Código"
                value={formData.codigo ?? ''}
                onChange={(e) => {
                  // Solo dígitos, hasta 11 (columna decimal(11,0))
                  const codigo = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setFormData((prev) => ({ ...prev, codigo }));
                }}
                size="small"
                helperText="Hasta 11 dígitos. Vacío = automático"
                inputProps={{ inputMode: 'numeric', maxLength: 11 }}
                inputRef={codigoRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    codigoBarraRef.current?.focus();
                  }
                }}
              />
            </Stack>

            {/* Fila 3: Código de Barra */}
            <TextField
              fullWidth
              label="Código de Barra"
              value={formData.codigoBarra}
              onChange={handleChange('codigoBarra')}
              size="small"
              inputRef={codigoBarraRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  precioRef.current?.focus();
                }
              }}
            />

            {/* Fila 4: Precio */}
            <TextField
              fullWidth
              label="Precio"
              type="number"
              value={formData.precio}
              onChange={handleChange('precio')}
              required
              size="small"
              error={formData.precio <= 0}
              helperText={formData.precio <= 0 ? 'Precio debe ser mayor a 0' : ''}
              inputProps={{ min: 0, step: 0.01 }}
              inputRef={precioRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  tipoProductoRef.current?.focus();
                }
              }}
            />

            {/* Fila 5: Tipo de Producto */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Producto</InputLabel>
                <Select
                  value={formData.idTipoProducto || ''}
                  onChange={handleChange('idTipoProducto')}
                  label="Tipo de Producto"
                  disabled={loading}
                  inputRef={tipoProductoRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      talleRef.current?.focus();
                    }
                  }}
                >
                  {tiposProducto.map((tipo) => (
                    <MenuItem key={tipo.idTipoProducto} value={tipo.idTipoProducto}>
                      {tipo.nombreTipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                color="primary"
                onClick={() => handleOpenQuickCreate('tipoProducto')}
                disabled={loading}
                title="Crear tipo de producto rápido"
                sx={quickCreateButtonSx}
              >
                <AddIcon />
              </IconButton>
            </Box>

            {/* Fila 6: Talle y Color */}
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl fullWidth size="small" required error={!formData.idTalle}>
                <InputLabel>Talle</InputLabel>
                <Select
                  value={formData.idTalle || ''}
                  onChange={handleChange('idTalle')}
                  label="Talle"
                  inputRef={talleRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      colorRef.current?.focus();
                    }
                  }}
                >
                  {talles.map((talle) => (
                    <MenuItem key={talle.idTalle} value={talle.idTalle}>
                      {talle.nombreTalle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                color="primary"
                onClick={() => handleOpenQuickCreate('talle')}
                title="Crear talle rápido"
                sx={quickCreateButtonSx}
              >
                <AddIcon />
              </IconButton>
              <FormControl fullWidth size="small" required error={!formData.idColor}>
                <InputLabel>Color</InputLabel>
                <Select
                  value={formData.idColor || ''}
                  onChange={handleChange('idColor')}
                  label="Color"
                  inputRef={colorRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      impuestoRef.current?.focus();
                    }
                  }}
                >
                  {colores.map((color) => (
                    <MenuItem key={color.idColor} value={color.idColor}>
                      {color.nombreColor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                color="primary"
                onClick={() => handleOpenQuickCreate('color')}
                title="Crear color rápido"
                sx={quickCreateButtonSx}
              >
                <AddIcon />
              </IconButton>
            </Stack>

            {/* Fila 7: Impuesto */}
            <FormControl fullWidth size="small">
              <InputLabel>Impuesto</InputLabel>
              <Select
                value={formData.idImpuesto || ''}
                onChange={handleChange('idImpuesto')}
                label="Impuesto"
                disabled={loading}
                inputRef={impuestoRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    guardarRef?.current?.focus();
                  }
                }}
              >
                {impuestos.map((impuesto) => (
                  <MenuItem key={impuesto.idImpuesto} value={impuesto.idImpuesto}>
                    {impuesto.nombreImpuesto}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Fila 8: Activo */}
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.activo !== undefined ? formData.activo : true}
                    onChange={handleChange('activo')}
                    name="activo"
                  />
                }
                label="Activo"
              />
            </Stack>
          </Stack>
        </Box>

        {/* Columna Derecha: Imagen del Producto */}
        <Box sx={{ 
          width: { xs: '100%', md: '280px' }, 
          flexShrink: 0, 
          display: 'flex', 
          flexDirection: 'column',
          gap: 1.5,
          alignItems: 'center' 
        }}>
          <Typography variant="subtitle2" color="text.secondary" align="left" sx={{ width: '100%', fontWeight: 600 }}>
            Imagen del Producto
          </Typography>
          
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!formData.imagenUrl && !uploading) {
                document.getElementById('product-image-input')?.click();
              }
            }}
            sx={{
              width: '280px',
              height: '280px',
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'divider',
              borderRadius: 2,
              backgroundColor: isDragging ? 'action.hover' : 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              cursor: formData.imagenUrl ? 'default' : 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: formData.imagenUrl ? 'divider' : 'primary.main',
                backgroundColor: formData.imagenUrl ? 'background.paper' : 'action.hover',
              }
            }}
          >
            <input
              type="file"
              id="product-image-input"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {uploading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">
                  Subiendo imagen...
                </Typography>
              </Box>
            ) : formData.imagenUrl ? (
              <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <img
                  src={productoService.obtenerUrlImagen(formData.imagenUrl)}
                  alt={formData.nombre || 'Producto'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#f5f5f5',
                  }}
                />
                <IconButton
                  onClick={handleRemoveImage}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 0, 0, 0.8)',
                    }
                  }}
                >
                  <DeleteIcon size="small" />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                  Arrastra una imagen aquí
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  o haz clic para seleccionar (Máx. 5MB)
                </Typography>
              </Box>
            )}
          </Box>

          {uploadError && (
            <Typography variant="caption" color="error" sx={{ mt: 1, width: '100%', textAlign: 'center' }}>
              {uploadError}
            </Typography>
          )}

          {formData.imagenUrl && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer', textDecoration: 'underline', mt: 0.5 }}
              onClick={() => document.getElementById('product-image-input')?.click()}
            >
              Cambiar imagen
            </Typography>
          )}
        </Box>
      </Box>

      {/* Dialogo para creacion rapida de Tipo de Producto / Talle / Color */}
      <Dialog
        open={quickCreate !== null}
        onClose={handleCloseQuickCreate}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{quickCreate && QUICK_CREATE_CONFIG[quickCreate].titulo}</DialogTitle>
        <DialogContent>
          {quickCreateError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {quickCreateError}
            </Alert>
          )}
          <MuiTextField
            autoFocus
            margin="dense"
            label={quickCreate ? QUICK_CREATE_CONFIG[quickCreate].label : ''}
            type="text"
            fullWidth
            variant="outlined"
            value={quickCreateNombre}
            onChange={(e) => setQuickCreateNombre(e.target.value.toUpperCase())}
            disabled={quickCreateLoading}
            inputProps={{ maxLength: quickCreate ? QUICK_CREATE_CONFIG[quickCreate].maxLength : 30, style: { textTransform: 'uppercase' } }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveQuickCreate();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button 
            onClick={handleCloseQuickCreate} 
            color="inherit"
            disabled={quickCreateLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveQuickCreate} 
            variant="contained" 
            color="primary"
            disabled={quickCreateLoading}
          >
            {quickCreateLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
