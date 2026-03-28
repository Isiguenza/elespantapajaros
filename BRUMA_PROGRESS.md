# BRUMA - Progreso de Transformación

## ✅ COMPLETADO

### 1. Rebrand Visual
- ✅ Colores actualizados (#004b49 main, #f5f2e9 secondary)
- ✅ Logo component creado (`/components/bruma-logo.tsx`)
- ✅ Carpeta `/public/branding` lista para assets
- ✅ Metadata actualizada a "BRUMA POS - Marisquería"
- ✅ Sidebar con logo BRUMA

### 2. Base de Datos - Sistema de Mesas
- ✅ Migración ejecutada exitosamente
- ✅ Tabla `tables` creada con campos: number, name, capacity, status
- ✅ Campo `tableId` agregado a tabla `orders`
- ✅ 20 mesas iniciales creadas (1-10 para 4 personas, 11-20 para 6)

### 3. Backend - API de Mesas
- ✅ `GET /api/tables` - Listar mesas
- ✅ `POST /api/tables` - Crear mesa
- ✅ `GET /api/tables/[id]` - Obtener mesa con orden activa
- ✅ `PUT /api/tables/[id]` - Actualizar mesa
- ✅ `DELETE /api/tables/[id]` - Eliminar mesa (soft delete)

### 4. Dashboard - Gestión de Mesas
- ✅ Página `/tables` creada con CRUD completo
- ✅ Crear, editar, eliminar mesas desde dashboard
- ✅ Estados visuales (Disponible, Ocupada, Reservada)
- ✅ Agregado al sidebar del dashboard

### 5. Frontend - Preparación /bar
- ✅ Estados de mesas agregados (`tables`, `selectedTable`, `showTableSelection`)
- ✅ Tipo `Table` agregado a TypeScript
- ✅ Función `fetchTables()` creada

## 🚧 EN PROGRESO / PENDIENTE

### 1. Modificar `/bar` - Sistema de Mesas
**Estado:** Iniciado, falta implementar UI

**Tareas pendientes:**
- [ ] Agregar función `handleSelectTable(table)` para seleccionar mesa
- [ ] Crear vista de grid de mesas (mostrar cuando `showTableSelection === true`)
- [ ] Modificar flujo: mostrar mesas → seleccionar → ver productos
- [ ] Implementar lógica de cuentas abiertas por mesa
- [ ] Al seleccionar mesa ocupada, cargar orden existente
- [ ] Permitir agregar items a cuenta existente
- [ ] Botón "Cambiar mesa" para volver a selección
- [ ] Actualizar estado de mesa al crear/cerrar orden

**Ubicación del código:**
- Archivo: `/app/bar/page.tsx` (2053 líneas)
- Agregar vista de selección de mesas antes del contenido principal
- Modificar `handleCheckout` para incluir `tableId`

### 2. Simplificar Flow de Productos
**Estado:** Pendiente

**Cambios necesarios:**
- [ ] Remover sistema de toppings/frostings/escarchados
- [ ] Mostrar productos directamente en categorías
- [ ] Mantener opción de personalización simple (notas/extras)
- [ ] Actualizar sidebar: quitar "Escarchados"

### 3. Actualizar Textos a BRUMA
**Estado:** Parcial (solo metadata y sidebar)

**Pendiente:**
- [ ] Cambiar "Espantapájaros" → "BRUMA" en toda la app
- [ ] Actualizar "bebidas" → "platillos/mariscos"
- [ ] Revisar textos en `/bar`, `/dispatch`, `/dashboard`
- [ ] Actualizar mensajes de toast/notificaciones

## 📝 PRÓXIMOS PASOS INMEDIATOS

1. **Completar vista de selección de mesas en `/bar`:**
   ```tsx
   // Agregar antes del return principal
   if (showTableSelection) {
     return (
       <div className="grid grid-cols-4 gap-4 p-8">
         {tables.map(table => (
           <Card onClick={() => handleSelectTable(table)}>
             Mesa {table.number}
             Status: {table.status}
           </Card>
         ))}
       </div>
     );
   }
   ```

2. **Implementar `handleSelectTable`:**
   ```tsx
   async function handleSelectTable(table: Table) {
     setSelectedTable(table);
     setShowTableSelection(false);
     
     // Si la mesa tiene orden activa, cargarla
     if (table.activeOrder) {
       // Cargar items al carrito
     }
   }
   ```

3. **Modificar `handleCheckout` para incluir tableId**

4. **Actualizar estado de mesa al crear orden**

## 🎨 Assets Pendientes

Colocar en `/public/branding/`:
- `logo.svg` o `logo.png`
- `logo-white.svg`
- `favicon.ico`

## 🔧 Scripts Útiles

```bash
# Migrar base de datos
npx tsx scripts/migrate-tables.ts

# Poblar mesas
npx tsx scripts/seed-tables.ts

# Ver mesas en DB
# Usar Drizzle Studio o consultar directamente
```
