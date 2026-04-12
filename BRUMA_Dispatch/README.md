# BRUMA Dispatch - iOS Kitchen Monitor

App de iOS para monitorear órdenes de cocina en tiempo real.

## 🚀 Características

- ✅ Consulta automática de órdenes cada 3 segundos
- ✅ Notificación sonora cuando llega una orden nueva
- ✅ Vibración del dispositivo al recibir orden
- ✅ Indicadores de urgencia por color (gris, amarillo, naranja, rojo)
- ✅ Temporizador en tiempo real para cada orden
- ✅ Agrupación de items por:
  - Bebidas (siempre arriba)
  - Tiempos de comida (curso 1, 2, 3...)
  - Asientos (A, B, C, Centro)
- ✅ Slide to confirm para marcar órdenes como listas
- ✅ Toggle de sonido activado/desactivado
- ✅ UI optimizada para iPad

## 📋 Requisitos

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+

## ⚙️ Configuración

### 1. Configurar URL del servidor

Abre `APIService.swift` y configura tu dominio de producción:

```swift
case .production:
    return "https://tu-dominio.com"  // Cambiar por tu dominio real
```

**Ejemplos:**
- Producción: `https://bruma-pos.com`
- Desarrollo: `http://localhost:3000` (ya configurado)

**Cambiar entre entornos:**
```swift
private let environment: Environment = .production  // Para producción
private let environment: Environment = .development // Para desarrollo local
```

**IMPORTANTE:** La app está configurada por defecto en modo `.production` para que funcione directamente con tu servidor en internet, sin necesidad de estar en la misma red local.

### 2. Permisos en Info.plist

La app ya está configurada para:
- Reproducir audio en background
- Acceder a la red local

### 3. Archivo de sonido

El archivo `notification_sound.wav` ya está incluido en el proyecto.

## 🎯 Uso

1. **Abrir la app** - Se conectará automáticamente al servidor
2. **Activar sonido** - Toca el botón de altavoz en la esquina superior derecha
3. **Ver órdenes** - Las órdenes aparecen en un grid de 2 columnas
4. **Marcar como lista** - Desliza el botón verde hacia la derecha

## 🎨 Indicadores de Urgencia

- **Gris** - Menos de 4 minutos
- **Amarillo** - 4-7 minutos
- **Naranja** - 7-10 minutos
- **Rojo** - Más de 10 minutos

## 🔧 Estructura del Proyecto

```
BRUMA_Dispatch/
├── Models.swift              # Modelos de datos
├── APIService.swift          # Servicio de API
├── SoundPlayer.swift         # Reproductor de sonido
├── OrdersViewModel.swift     # Lógica de negocio
├── ContentView.swift         # Vista principal
├── OrderCardView.swift       # Componente de tarjeta
└── notification_sound.wav    # Archivo de sonido
```

## 🐛 Troubleshooting

### No se conecta al servidor
- Verifica que el servidor esté corriendo
- Asegúrate de que la URL en `APIService.swift` sea correcta (tu dominio de producción)
- Verifica que el iPad tenga conexión a internet
- Si usas HTTPS, asegúrate de que el certificado SSL sea válido

### No suena la notificación
- Activa el sonido con el botón de altavoz
- Verifica que el volumen del dispositivo esté alto
- Asegúrate de que el modo silencio esté desactivado

### Las órdenes no se actualizan
- Verifica la conexión a internet
- Revisa los logs en Xcode para ver errores

## 📱 Optimización para iPad

La app está optimizada para iPad con:
- Grid de 2 columnas
- Fuentes grandes y legibles
- Espaciado generoso
- Controles táctiles grandes

## 🔄 Actualización Automática

La app consulta nuevas órdenes cada 3 segundos automáticamente.
No es necesario refrescar manualmente.

## 📝 Notas

- La app debe permanecer abierta para recibir notificaciones
- Se recomienda usar en iPad para mejor experiencia
- El sonido solo funciona si la app está en primer plano
