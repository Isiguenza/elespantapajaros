# Sistema de Reservas - Instrucciones de Instalación

## ✅ Completado

1. **Base de Datos**
   - ✅ Migraciones creadas (`0009_add_reservations.sql`, `0010_add_table_layout_fields.sql`)
   - ✅ Schema actualizado con tabla `reservations` y campos de layout en `tables`
   - ✅ Tipos TypeScript agregados

2. **API Endpoints**
   - ✅ `/api/reservations` - GET (listar), POST (crear)
   - ✅ `/api/reservations/[id]` - GET, PATCH, DELETE
   - ✅ `/api/reservations/[id]/confirm` - POST (confirmar llegada)
   - ✅ `/api/tables/layout` - GET, PUT (gestionar layout de mesas)

3. **Componentes UI**
   - ✅ `Sidebar.tsx` - Navegación entre POS y Reservas
   - ✅ `ReservationsView.tsx` - Vista principal de reservas
   - ✅ `ReservationDialog.tsx` - Crear/editar reservas
   - ✅ `ReservationsList.tsx` - Lista de reservas con filtros
   - ✅ `TablesMap.tsx` - Mapa visual de mesas

4. **Integración**
   - ✅ POS integrado con sidebar
   - ✅ Navegación entre vistas

## 🔧 Pasos Pendientes

### 1. Instalar Dependencias

```bash
cd /Users/inakisiguenza/Desktop/Dev/POS\ Espantapajaros/pos-espantapajaros
npm install lucide-react --legacy-peer-deps
```

Si hay problemas con npm, intenta:
```bash
rm -rf node_modules package-lock.json
npm install
npm install lucide-react
```

### 2. Ejecutar Migraciones de Base de Datos

Conecta a tu base de datos de Neon y ejecuta las migraciones:

```sql
-- Ejecutar en orden:
-- 1. lib/db/migrations/0009_add_reservations.sql
-- 2. lib/db/migrations/0010_add_table_layout_fields.sql
```

O si usas Drizzle Kit:
```bash
npx drizzle-kit push
```

### 3. Verificar que Todo Funciona

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a `http://localhost:3000/bar`

3. Deberías ver el sidebar en el lado izquierdo con dos opciones:
   - **POS** (ícono de carrito)
   - **Reservas** (ícono de calendario)

4. Haz clic en "Reservas" para ver el sistema de reservas

## 📋 Características Implementadas

### Sistema de Reservas

- **Crear Reservas**: Formulario completo con validación
  - Fecha y hora
  - Duración (1-3 horas)
  - Nombre del cliente y teléfono
  - Número de personas
  - Selección de mesa (filtrada por capacidad)
  - Notas especiales

- **Gestión de Reservas**:
  - Lista agrupada por fecha
  - Filtros por fecha, estado y búsqueda
  - Estados: Pendiente, Confirmada, Llegó, Cancelada, No Show
  - Confirmar llegada con un clic
  - Editar y cancelar reservas

- **Mapa de Mesas**:
  - Vista visual del restaurante
  - Indicadores de estado (Disponible/Reservada/Ocupada)
  - Información de reserva en hover
  - Soporte para layout personalizado (drag-and-drop)

- **Validaciones**:
  - Verificación de disponibilidad de mesa
  - Prevención de reservas conflictivas
  - Capacidad de mesa vs número de personas
  - No permitir reservas en el pasado

### Integración con POS

- **Bloqueo de Mesas**: Las mesas reservadas aparecen como "reserved" en el POS
- **Liberación Automática**: Al confirmar llegada, la mesa se libera para tomar órdenes
- **Sidebar Colapsable**: No interfiere con el workflow del POS
- **Estado Persistente**: La vista seleccionada se guarda en localStorage

## 🎨 Próximas Mejoras (Opcionales)

1. **Editor de Layout Drag-and-Drop**
   - Mover mesas arrastrando
   - Cambiar forma (cuadrada/redonda)
   - Rotar mesas
   - Agregar/eliminar mesas

2. **Notificaciones**
   - Alertas para reservas próximas
   - Recordatorios automáticos

3. **Reportes**
   - Estadísticas de reservas
   - Tasa de no-show
   - Mesas más populares

4. **Integración con WhatsApp**
   - Confirmaciones automáticas
   - Recordatorios por mensaje

## 🐛 Solución de Problemas

### Error: "Cannot find module 'lucide-react'"
```bash
npm install lucide-react --legacy-peer-deps
```

### Error: "Table 'reservations' doesn't exist"
Ejecuta las migraciones SQL en tu base de datos.

### El sidebar no aparece
Verifica que los componentes se importaron correctamente en `/app/bar/page.tsx`.

### Las reservas no se guardan
Verifica la conexión a la base de datos y que las migraciones se ejecutaron.

## 📞 Soporte

Si encuentras algún problema, verifica:
1. Que todas las dependencias estén instaladas
2. Que las migraciones se hayan ejecutado
3. Que el servidor de desarrollo esté corriendo
4. Los logs de la consola del navegador y del servidor

¡Disfruta tu nuevo sistema de reservas! 🎉
