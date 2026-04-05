# Servidor de Impresión Local - POS Espantapájaros

Este servidor Node.js debe correr en tu iMac para recibir solicitudes de impresión desde el iPad y enviarlas a la impresora térmica ESC/POS.

## 📋 Requisitos

- Node.js instalado en la iMac
- Impresora térmica conectada a la red local en `192.168.0.200:9100`
- iMac y iPad en la misma red WiFi

## 🚀 Instalación

1. **Copia esta carpeta `print-server` a tu iMac**

2. **Instala las dependencias:**
   ```bash
   cd print-server
   npm install
   ```

3. **Verifica que el logo esté en la ruta correcta:**
   - El servidor busca el logo en `../public/logo.jpg`
   - Asegúrate de que el archivo existe

## ▶️ Iniciar el servidor

```bash
npm start
```

El servidor correrá en `http://localhost:3001`

## 🌐 Exponer el servidor a internet (para Vercel)

Para que Vercel pueda conectarse desde la nube, necesitas exponer tu servidor local usando **ngrok**:

### 1. Instalar ngrok

**Opción A - Con Homebrew (recomendado):**
```bash
brew install ngrok/ngrok/ngrok
```

**Opción B - Descarga manual:**
- Ve a https://ngrok.com/download
- Descarga e instala ngrok

### 2. Crear cuenta en ngrok (gratis)

- Regístrate en https://dashboard.ngrok.com/signup
- Copia tu authtoken
- Configúralo:
```bash
ngrok config add-authtoken TU_TOKEN_AQUI
```

### 3. Iniciar ngrok

En una **segunda terminal** (mientras el servidor corre):
```bash
ngrok http 3001
```

Verás algo como:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3001
```

### 4. Configurar la URL en Vercel

En tu proyecto de Vercel, agrega la variable de entorno:
```
NEXT_PUBLIC_PRINT_SERVER_URL=https://abc123.ngrok.io
```

⚠️ **Importante:** La URL de ngrok cambia cada vez que lo reinicias (en plan gratuito). Para URL fija, considera el plan de pago de ngrok.

## 🔧 Configuración

### Cambiar IP de la impresora

Si tu impresora tiene una IP diferente, edita `server.js`:

```javascript
const PRINTER_IP = "192.168.0.200";  // Cambia esto
const PRINTER_PORT = 9100;
```

### Cambiar puerto del servidor

Si el puerto 3001 está ocupado, edita `server.js`:

```javascript
const PORT = 3001;  // Cambia esto
```

### Configurar IP del servidor en el POS

En tu archivo `.env.local` del proyecto principal, agrega:

```
NEXT_PUBLIC_PRINT_SERVER_URL=http://192.168.0.XXX:3001
```

Donde `192.168.0.XXX` es la IP de tu iMac en la red local.

## 🧪 Probar la conexión

Abre en tu navegador:
```
http://localhost:3001/health
```

Deberías ver:
```json
{
  "status": "ok",
  "printer": "192.168.0.200:9100"
}
```

## 🔄 Mantener el servidor corriendo

### Opción 1: Dejar la terminal abierta
Simplemente deja la terminal abierta con `npm start`

### Opción 2: Usar PM2 (recomendado para producción)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar el servidor con PM2
pm2 start server.js --name "pos-printer"

# Ver logs
pm2 logs pos-printer

# Reiniciar
pm2 restart pos-printer

# Detener
pm2 stop pos-printer

# Hacer que se inicie automáticamente al arrancar la iMac
pm2 startup
pm2 save
```

## 🐛 Solución de problemas

### Error: Cannot find module 'express'
```bash
npm install
```

### Error: ECONNREFUSED al imprimir
- Verifica que la impresora esté encendida
- Verifica la IP de la impresora: `ping 192.168.0.200`
- Verifica que el puerto 9100 esté abierto

### El iPad no puede conectarse al servidor
- Verifica que la iMac y el iPad estén en la misma red WiFi
- Verifica la IP de la iMac: `ifconfig | grep inet`
- Actualiza `NEXT_PUBLIC_PRINT_SERVER_URL` con la IP correcta
- Verifica que el firewall de la iMac permita conexiones en el puerto 3001

### El logo no aparece
- Verifica que `../public/logo.jpg` exista
- Verifica los permisos del archivo
- Revisa los logs del servidor para ver errores

## 📝 Logs

El servidor imprime logs en la consola:
- ✅ "Conectado a la impresora" - Conexión exitosa
- ❌ "Error de conexión" - No se pudo conectar a la impresora
- 🖨️ "Respuesta de impresora" - La impresora respondió

## 🔐 Seguridad

Este servidor está configurado con CORS abierto para desarrollo. En producción, considera:
- Limitar CORS solo a tu dominio
- Agregar autenticación
- Usar HTTPS
