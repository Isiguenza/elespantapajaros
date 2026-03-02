# Sistema de Flujos Personalizados por Categoría

## ✅ Implementación Completada

El sistema de flujos personalizados ha sido implementado exitosamente. Ahora cada categoría puede tener su propio flujo de modificadores personalizado.

## 🎯 ¿Qué se implementó?

### 1. Base de Datos
- **Nueva tabla:** `modifier_steps` - Define los pasos del flujo para cada categoría
- **Nueva tabla:** `modifier_options` - Opciones personalizadas para cada paso
- **Campo actualizado:** `order_items.customModifiers` - Guarda selecciones de modificadores personalizados

### 2. API Endpoints

#### Flujos de Categoría
- `GET /api/categories/{id}/flow` - Obtener flujo configurado
- `POST /api/categories/{id}/flow` - Guardar/actualizar flujo completo

#### Pasos de Modificadores
- `POST /api/modifier-steps` - Crear paso
- `PUT /api/modifier-steps/{id}` - Actualizar paso
- `DELETE /api/modifier-steps/{id}` - Eliminar paso

#### Opciones de Modificadores
- `POST /api/modifier-options` - Crear opción
- `PUT /api/modifier-options/{id}` - Actualizar opción
- `DELETE /api/modifier-options/{id}` - Eliminar opción

### 3. Dashboard - Configuración de Flujos

**Ubicación:** `/inventory/categories/{id}/flow`

**Acceso:** En la página de Categorías, cada categoría ahora tiene un botón con ícono de flujo (→) para configurar su flujo.

### 4. /bar - Flujo Dinámico

El POS `/bar` ahora adapta automáticamente el flujo de modificadores según la categoría del producto seleccionado.

## 📖 Cómo Usar

### Configurar Flujo Personalizado

1. **Ir a Categorías**
   - Navega a `Dashboard → Inventario → Categorías`

2. **Seleccionar Categoría**
   - Haz clic en el ícono de flujo (→) de la categoría que deseas configurar

3. **Elegir Tipo de Flujo**
   - **Flujo Predeterminado:** Usa el flujo estándar (Escarchado → Topping → Extras)
   - **Flujo Personalizado:** Crea tu propio flujo con pasos específicos

4. **Agregar Pasos (si es personalizado)**
   - Haz clic en "Agregar Paso"
   - Configura el paso:
     - **Nombre:** ej. "Tipo de Cerveza", "Salsa", "Tamaño"
     - **Tipo:**
       - `Escarchado` - Usa los escarchados existentes
       - `Topping Seco` - Usa los toppings secos existentes
       - `Extras` - Usa los extras existentes
       - `Personalizado` - Crea opciones únicas para este paso
     - **¿Es requerido?** - Si es obligatorio seleccionar una opción
     - **¿Permite múltiple?** - Si permite seleccionar varias opciones

5. **Opciones Personalizadas**
   - Si el tipo es "Personalizado", agrega opciones:
     - Nombre de la opción (ej: "Clara", "Oscura", "IPA")
     - Precio adicional (puede ser 0)
     - Orden de aparición

6. **Ordenar Pasos**
   - Usa los botones ↑↓ para reordenar los pasos
   - El orden define cómo aparecerán en el flujo de venta

7. **Guardar**
   - Haz clic en "Guardar Cambios"

### Ejemplos Prácticos

#### Ejemplo 1: Cervezas
**Flujo:** Tipo de Cerveza → Escarchado → Extras

**Configuración:**
1. Paso 1: "Tipo de Cerveza" (Personalizado, Requerido)
   - Opciones: Clara ($0), Oscura ($5), IPA ($10)
2. Paso 2: "Escarchado" (Usar existentes, Opcional)
3. Paso 3: "Extras" (Usar existentes, Múltiple)

#### Ejemplo 2: Snacks
**Flujo:** Producto → Toppings

**Configuración:**
1. Paso 1: "Toppings" (Personalizado, Requerido)
   - Opciones: Queso ($15), Jalapeños ($10), Crema ($8)

#### Ejemplo 3: Postres
**Flujo:** Tamaño → Extras

**Configuración:**
1. Paso 1: "Tamaño" (Personalizado, Requerido)
   - Opciones: Chico ($0), Mediano ($20), Grande ($40)
2. Paso 2: "Extras" (Usar existentes, Múltiple)

### Usar en el POS

Una vez configurado el flujo:

1. El empleado selecciona una categoría en `/bar`
2. El sistema carga automáticamente el flujo de esa categoría
3. Al seleccionar un producto, el flujo personalizado se activa
4. El empleado navega por cada paso configurado
5. Al finalizar, el producto se agrega al carrito con todos los modificadores

**Precios:** Los modificadores personalizados con precio se suman automáticamente al precio base del producto.

## 🔍 Características Técnicas

### Flujo Predeterminado
Si una categoría no tiene flujo personalizado configurado, usa el flujo predeterminado:
1. Escarchado (opcional)
2. Topping Seco (opcional)
3. Extras (múltiple, opcional)

### Productos sin Flujo
Si una categoría tiene el toggle "Usar flujo predeterminado" activado pero sin pasos configurados, el producto se agrega directamente al carrito al seleccionarlo.

### Compatibilidad
- Los productos existentes funcionan sin cambios
- Los modificadores tradicionales (frostingId, dryToppingId, extraId) se mantienen
- Los modificadores personalizados se guardan en `customModifiers` como JSON

### Datos Guardados
Estructura de `customModifiers` en `order_items`:
```json
{
  "step-id-1": {
    "stepName": "Tipo de Cerveza",
    "options": [
      {
        "id": "option-id",
        "name": "IPA",
        "price": "10"
      }
    ]
  }
}
```

## 🎨 Vista Previa del Flujo

En la página de configuración, la sección "Vista Previa del Flujo" muestra cómo se verá el flujo:

```
Producto → Tipo de Cerveza → Escarchado → Carrito
```

## 🚀 Próximos Pasos

El sistema está listo para usar. Recomendaciones:

1. **Configurar flujos de categorías principales**
   - Identifica qué categorías necesitan flujos personalizados
   - Configura los flujos más críticos primero

2. **Capacitar al personal**
   - Muestra a los empleados cómo usar el nuevo sistema
   - Los flujos personalizados son intuitivos y similares al flujo predeterminado

3. **Monitorear órdenes**
   - Revisa que los modificadores personalizados se guarden correctamente
   - Verifica los precios calculados

## ⚙️ Archivos Modificados

### Schema y Types
- `/lib/db/schema.ts` - Nuevas tablas y relaciones
- `/lib/types.ts` - Nuevas interfaces TypeScript

### API
- `/app/api/categories/[id]/flow/route.ts`
- `/app/api/modifier-steps/route.ts`
- `/app/api/modifier-steps/[id]/route.ts`
- `/app/api/modifier-options/route.ts`
- `/app/api/modifier-options/[id]/route.ts`

### Dashboard
- `/app/(dashboard)/inventory/categories/[id]/flow/page.tsx` - Configuración de flujos
- `/app/(dashboard)/inventory/categories/page.tsx` - Botón de acceso a flujos

### POS
- `/app/bar/page.tsx` - Renderizado dinámico de flujos

## 📊 Base de Datos

**Migraciones aplicadas:**
- `drizzle/0002_bright_maddog.sql` - Creación de tablas y campos

**Comando ejecutado:**
```bash
npm run db:generate
npm run db:push
```

## ✅ Build Exitoso

El proyecto compila sin errores. Todos los tipos están correctos y el sistema está listo para producción.

---

**Implementado:** Mar 1, 2026
**Estado:** ✅ Completado y Funcional
