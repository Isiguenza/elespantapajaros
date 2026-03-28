# BRUMA - Migración y Cambios

## ✅ Cambios Completados

### 1. **Rebrand Visual**
- ✅ Colores actualizados:
  - Primary: `#004b49` (verde azulado oscuro)
  - Secondary/Background: `#f5f2e9` (crema cálido)
- ✅ Logo component creado en `/components/bruma-logo.tsx`
- ✅ Carpeta `/public/branding` creada para assets
- ✅ Metadata actualizada: "BRUMA POS - Marisquería"
- ✅ Sidebar actualizado con logo BRUMA

### 2. **Base de Datos - Sistema de Mesas**
- ✅ Enum `table_status` agregado: `available`, `occupied`, `reserved`
- ✅ Tabla `tables` creada con campos:
  - `id`, `number` (único), `name`, `capacity`
  - `status`, `active`, timestamps
- ✅ Campo `tableId` agregado a tabla `orders`

## 📋 Próximos Pasos

### 1. **Migración de Base de Datos**
Ejecutar:
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 2. **Crear Mesas Iniciales**
Crear endpoint `/api/tables` y poblar con mesas iniciales (1-20 por ejemplo)

### 3. **Modificar /bar para Sistema de Mesas**
- Mostrar grid de mesas al inicio
- Permitir seleccionar mesa
- Mostrar órdenes abiertas por mesa
- Permitir agregar items a cuenta existente
- Mantener cuenta abierta hasta cerrar/pagar

### 4. **Simplificar Flow de Productos**
- Mostrar productos directamente en categorías
- Mantener opción de personalización pero simplificada
- Remover flow de toppings/frostings específico de bebidas

### 5. **Actualizar Nombres en Toda la App**
- Cambiar referencias de "Espantapájaros" a "BRUMA"
- Actualizar textos de "bebidas" a "platillos/mariscos"
- Remover referencias a "escarchados" y "toppings"

## 🎨 Assets Pendientes

Coloca los siguientes archivos en `/public/branding/`:
- `logo.svg` - Logo principal
- `logo.png` - Logo en PNG
- `logo-white.svg` - Logo para fondos oscuros
- `favicon.ico` - Favicon

## 🔧 Configuración

Los colores ya están configurados en `app/globals.css`:
- `--primary`: BRUMA teal (#004b49)
- `--secondary`: Crema (#f5f2e9)
- `--background`: Crema cálido
