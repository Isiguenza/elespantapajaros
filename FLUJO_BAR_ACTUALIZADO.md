# 🔄 Nuevo Flujo de Vista de Bar

## Cambios Implementados

### 1. ✅ Dispatch Minimalista
- Diseño limpio y compacto
- Colores sutiles (amber/emerald)
- Sin emojis
- Tarjetas más pequeñas
- Header minimalista

### 2. ✅ Schema Actualizado
**Nuevas tablas**:
- `dryToppings` - Escarchados secos (Miguelito, Tajín, etc.)
- `extras` - Extras con precio (Shot, azúcar, etc.)

**Campos agregados a `orderItems`**:
- `dryToppingId` / `dryToppingName`
- `extraId` / `extraName`

### 3. 🔄 Nuevo Flujo de /bar (Sin Pop-ups)

**Flujo de pantallas**:
```
1. Grid de Bebidas
   ↓ (selecciona bebida)
2. Grid de Escarchados (incluye opción "Ninguno")
   ↓ (selecciona escarchado)
3. Grid de Escarchados Secos (incluye opción "Ninguno")
   ↓ (selecciona escarchado seco)
4. Grid de Extras (incluye opción "Ninguno")
   ↓ (selecciona extra)
5. Item agregado al carrito
   ↓ (vuelve automáticamente al grid de bebidas)
```

**Características**:
- Navegación fluida entre pantallas
- Siempre opción "Ninguno" en personalizaciones
- Carrito visible en todo momento (sidebar derecho)
- Mínimo clicks
- Experiencia rápida para bartender

---

## Próximos Pasos

### Pendiente
1. Crear APIs para dryToppings y extras
2. Implementar nuevo flujo de pantallas en /bar
3. Migrar DB con nuevas tablas
4. Testing completo

### Variables de Entorno
```bash
JWT_SECRET=...
CASH_TOLERANCE=10
```

### Migración DB
```bash
pnpm run db:push
```

---

## Estructura de Datos

### CartItem (actualizado)
```typescript
{
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes: string;
  frostingId?: string | null;
  frostingName?: string | null;
  dryToppingId?: string | null;      // NUEVO
  dryToppingName?: string | null;    // NUEVO
  extraId?: string | null;           // NUEVO
  extraName?: string | null;         // NUEVO
}
```

### Ejemplo de Orden
```json
{
  "productName": "Margarita",
  "frostingName": "Sal",
  "dryToppingName": "Tajín",
  "extraName": "Shot Extra",
  "unitPrice": 80.00,  // precio base + extra
  "quantity": 1
}
```

---

## UI/UX

### Minimalismo
- Colores neutros y sutiles
- Tipografía clara
- Espacios amplios
- Sin decoraciones innecesarias
- Botones grandes y accesibles

### Performance
- Transiciones rápidas entre pantallas
- No recargar productos cada vez
- Estados locales eficientes
- Feedback visual inmediato
