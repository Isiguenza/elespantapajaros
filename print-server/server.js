const express = require('express');
const cors = require('cors');
const net = require('net');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const PRINTER_IP = "192.168.0.200"; // IP reservada de la impresora
const PRINTER_PORT = 9100;

// Middleware
app.use(cors());
app.use(express.json());

// Comandos ESC/POS
const ESC = "\x1B";
const GS = "\x1D";

const commands = {
  init: ESC + "@",
  alignCenter: ESC + "a" + "\x01",
  alignLeft: ESC + "a" + "\x00",
  alignRight: ESC + "a" + "\x02",
  bold: ESC + "E" + "\x01",
  boldOff: ESC + "E" + "\x00",
  cut: GS + "V" + "\x00",
  feed: ESC + "d" + "\x03",
  feedLine: "\n",
  textSizeNormal: GS + "!" + "\x00",
  textSizeDouble: GS + "!" + "\x11",
  textSizeLarge: GS + "!" + "\x22",
};

// Función para convertir imagen a bitmap ESC/POS
async function imageToEscPosBitmap(imagePath, maxWidth = 384) {
  try {
    const imageBuffer = await sharp(imagePath)
      .resize({ width: maxWidth, fit: 'contain' })
      .greyscale()
      .threshold(128)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = imageBuffer;
    const width = info.width;
    const height = info.height;

    const bytesPerLine = Math.ceil(width / 8);

    let bitmap = "";
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < bytesPerLine; x++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const pixelX = x * 8 + bit;
          if (pixelX < width) {
            const pixelIndex = (y * width + pixelX);
            const pixelValue = data[pixelIndex];
            if (pixelValue < 128) {
              byte |= (1 << (7 - bit));
            }
          }
        }
        bitmap += String.fromCharCode(byte);
      }
    }

    const xL = bytesPerLine & 0xFF;
    const xH = (bytesPerLine >> 8) & 0xFF;
    const yL = height & 0xFF;
    const yH = (height >> 8) & 0xFF;

    return GS + "v0" + String.fromCharCode(0, xL, xH, yL, yH) + bitmap;
  } catch (error) {
    console.error("Error processing image:", error);
    return "";
  }
}

// Función para enviar a la impresora
function sendToPrinter(content) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.connect(PRINTER_PORT, PRINTER_IP, () => {
      console.log("Conectado a la impresora");
      client.write(content, "binary");
    });
    
    client.on("data", (data) => {
      console.log("Respuesta de impresora:", data);
      client.destroy();
      resolve();
    });
    
    client.on("close", () => {
      console.log("Conexión cerrada");
      resolve();
    });
    
    client.on("error", (err) => {
      console.error("Error de conexión:", err);
      reject(err);
    });
    
    setTimeout(() => {
      client.destroy();
      resolve();
    }, 5000);
  });
}

// Endpoint de impresión
app.post('/print', async (req, res) => {
  try {
    const { 
      customerName, 
      orderNumber, 
      items, 
      subtotal, 
      tip, 
      total, 
      tableNumber,
      isDelivery,
      paymentMethod 
    } = req.body;

    let content = "";
    
    // Inicializar impresora
    content += commands.init;
    
    // Logo centrado sin espacio arriba
    content += commands.alignCenter;
    
    // Imprimir logo desde archivo
    const logoPath = path.join(__dirname, "public", "logo.jpg");
    if (fs.existsSync(logoPath)) {
      const logoBitmap = await imageToEscPosBitmap(logoPath, 400);
      content += logoBitmap;
      content += commands.feedLine;
      content += commands.feedLine;
    } else {
      content += commands.textSizeLarge;
      content += commands.bold;
      content += "BRUMA\n";
      content += commands.boldOff;
      content += commands.textSizeNormal;
    }
    content += commands.feedLine;
    
    // Dirección centrada
    content += "Av. Panamericana Casa B14\n";
    content += "Col. Pedregal de Carrasco, CDMX\n";
    content += commands.feedLine;
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Fecha y hora centrada
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-MX");
    const timeStr = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    content += `${dateStr} ${timeStr}\n`;
    content += commands.feedLine;
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Mesa/Para Llevar y # de Orden con espacio justificado y más grandes
    content += commands.alignLeft;
    content += commands.textSizeDouble;
    content += commands.bold;
    const label = isDelivery ? "PARA LLEVAR" : `MESA ${tableNumber}`;
    content += label;
    content += commands.boldOff;
    const orderText = `#${orderNumber}`;
    const spaces = Math.max(1, 24 - label.length - orderText.length);
    content += " ".repeat(spaces);
    content += commands.bold;
    content += orderText + "\n";
    content += commands.boldOff;
    content += commands.textSizeNormal;
    content += commands.feedLine;
    
    // Si es delivery de plataforma (Uber/Rappi/Didi), mostrar info de plataforma
    if (isDelivery && customerName) {
      const platformMatch = customerName.match(/^(Uber|Rappi|Didi)\s*#(\d{4})/);
      if (platformMatch) {
        const platform = platformMatch[1];
        const orderDigits = platformMatch[2];
        content += commands.alignCenter;
        content += commands.textSizeLarge;
        content += commands.bold;
        content += `${platform} #${orderDigits}\n`;
        content += commands.boldOff;
        content += commands.textSizeNormal;
        content += commands.alignLeft;
        content += commands.feedLine;
      }
    }
    
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Línea separadora continua (80mm)
    content += commands.alignLeft;
    content += "------------------------------------------------\n";
    content += commands.feedLine;
    
    // Items todos juntos (más compacto, sin separar por asientos)
    const allItems = [];
    for (const seat of Object.keys(items)) {
      allItems.push(...items[seat]);
    }
    
    // Imprimir todos los items juntos
    for (const item of allItems) {
      const qtyName = `${item.qty}x ${item.name}`;
      const price = `$${item.total}`;
      const itemSpaces = Math.max(1, 48 - qtyName.length - price.length);
      content += qtyName + " ".repeat(itemSpaces) + price + "\n";
    }
    
    // Espacio antes del total
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Línea separadora continua (80mm)
    content += "------------------------------------------------\n";
    content += commands.feedLine;
    
    // Subtotal
    content += "Subtotal:";
    const subtotalStr = `$${subtotal}`;
    content += " ".repeat(48 - 9 - subtotalStr.length) + subtotalStr + "\n";
    content += commands.feedLine;
    
    // Propina (si hay)
    if (tip > 0) {
      content += "Propina:";
      const tipStr = `$${tip}`;
      content += " ".repeat(48 - 8 - tipStr.length) + tipStr + "\n";
      content += commands.feedLine;
    }
    
    // Total en negritas y más grande
    content += commands.feedLine;
    content += "────────────────────────────────────────────────\n";
    content += commands.feedLine;
    content += commands.bold;
    content += commands.textSizeDouble;
    content += "TOTAL:";
    const totalStr = `$${total}`;
    content += " ".repeat(Math.max(1, 24 - 6 - totalStr.length)) + totalStr + "\n";
    content += commands.textSizeNormal;
    content += commands.boldOff;
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Información de pago (solo si está pagado)
    if (paymentMethod) {
      content += "────────────────────────────────────────────────\n";
      content += commands.feedLine;
      content += commands.bold;
      content += "PAGADO\n";
      content += commands.boldOff;
      content += commands.feedLine;
      
      const methodLabel = paymentMethod === 'cash' ? 'Efectivo' : 
                         paymentMethod === 'card' ? 'Tarjeta' : 
                         paymentMethod === 'transfer' ? 'Transferencia' : 
                         paymentMethod === 'terminal_mercadopago' ? 'Terminal' : paymentMethod;
      content += `Metodo: ${methodLabel}\n`;
      content += commands.feedLine;
      
      // Propina si hay
      if (tip > 0) {
        content += `Propina: $${tip}\n`;
        content += commands.feedLine;
      }
    }
    
    // Footer
    content += commands.feedLine;
    content += commands.feedLine;
    content += commands.feedLine;
    content += commands.feedLine;
    content += commands.alignCenter;
    content += "Gracias por su preferencia\n";
    
    // Espacio final antes de cortar
    content += commands.feedLine;
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Cortar papel
    content += commands.feed;
    content += commands.cut;

    // Enviar a la impresora
    await sendToPrinter(content);

    res.json({ success: true });
  } catch (error) {
    console.error("Error printing:", error);
    res.status(500).json({ error: "Error al imprimir" });
  }
});

// Endpoint para imprimir resumen de ventas
app.post('/print-summary', async (req, res) => {
  try {
    const { 
      date,
      registerName,
      totalOrders,
      cashTotal,
      cardTotal,
      transferTotal,
      totalTips,
      grandTotal,
      products
    } = req.body;

    let content = "";
    
    // Inicializar impresora
    content += commands.init;
    
    // Header centrado
    content += commands.alignCenter;
    content += commands.feedLine;
    content += commands.bold;
    content += "BRUMA\n";
    content += commands.boldOff;
    content += "Mariscos y Cocteles\n";
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Título
    content += commands.bold;
    content += commands.textSizeDouble;
    content += "RESUMEN DE VENTAS\n";
    content += commands.textSizeNormal;
    content += commands.boldOff;
    content += commands.feedLine;
    
    // Fecha y hora
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const timeStr = dateObj.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    content += `${dateStr} - ${timeStr}\n`;
    content += `${registerName}\n`;
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Línea separadora
    content += commands.alignLeft;
    content += "------------------------------------------------\n";
    content += commands.feedLine;
    
    // Totales por método de pago
    content += commands.bold;
    content += "VENTAS POR METODO DE PAGO\n";
    content += commands.boldOff;
    content += commands.feedLine;
    
    if (cashTotal > 0) {
      content += "Efectivo:";
      const cashStr = `$${Math.round(cashTotal)}`;
      content += " ".repeat(48 - 9 - cashStr.length) + cashStr + "\n";
    }
    
    if (cardTotal > 0) {
      content += "Tarjeta:";
      const cardStr = `$${Math.round(cardTotal)}`;
      content += " ".repeat(48 - 8 - cardStr.length) + cardStr + "\n";
    }
    
    if (transferTotal > 0) {
      content += "Transferencia:";
      const transferStr = `$${Math.round(transferTotal)}`;
      content += " ".repeat(48 - 14 - transferStr.length) + transferStr + "\n";
    }
    
    content += commands.feedLine;
    
    // Propinas
    if (totalTips > 0) {
      content += "Propinas:";
      const tipsStr = `$${Math.round(totalTips)}`;
      content += " ".repeat(48 - 9 - tipsStr.length) + tipsStr + "\n";
      content += commands.feedLine;
    }
    
    // Línea separadora
    content += "------------------------------------------------\n";
    content += commands.feedLine;
    
    // Total general
    content += commands.bold;
    content += commands.textSizeDouble;
    content += "TOTAL:";
    const totalStr = `$${Math.round(grandTotal)}`;
    content += " ".repeat(Math.max(1, 24 - 6 - totalStr.length)) + totalStr + "\n";
    content += commands.textSizeNormal;
    content += commands.boldOff;
    content += commands.feedLine;
    
    content += `Ordenes: ${totalOrders}\n`;
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Productos vendidos
    if (products && products.length > 0) {
      content += "------------------------------------------------\n";
      content += commands.feedLine;
      content += commands.bold;
      content += "PRODUCTOS VENDIDOS\n";
      content += commands.boldOff;
      content += commands.feedLine;
      
      for (const product of products) {
        const qtyName = `${product.qty}x ${product.name}`;
        // Limitar longitud del nombre si es muy largo
        const displayName = qtyName.length > 48 ? qtyName.slice(0, 45) + "..." : qtyName;
        content += displayName + "\n";
      }
      
      content += commands.feedLine;
    }
    
    // Footer
    content += commands.feedLine;
    content += commands.feedLine;
    content += commands.alignCenter;
    content += "Gracias por su preferencia\n";
    content += commands.feedLine;
    content += commands.feedLine;
    content += commands.feedLine;
    content += commands.cut;
    
    // Enviar a impresora
    const client = new net.Socket();
    let responseSent = false;
    
    client.connect(PRINTER_PORT, PRINTER_IP, () => {
      console.log('✅ Conectado a impresora para resumen');
      client.write(content);
      client.end();
    });
    
    client.on('error', (err) => {
      console.error('❌ Error de conexión:', err.message);
      if (!responseSent) {
        responseSent = true;
        res.status(500).json({ error: 'Error de conexión con impresora' });
      }
    });
    
    client.on('close', () => {
      console.log('✅ Resumen enviado a impresora');
      if (!responseSent) {
        responseSent = true;
        res.json({ success: true });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', printer: `${PRINTER_IP}:${PRINTER_PORT}` });
});

app.listen(PORT, () => {
  console.log(`🖨️  Servidor de impresión corriendo en http://localhost:${PORT}`);
  console.log(`📡 Impresora configurada en ${PRINTER_IP}:${PRINTER_PORT}`);
});
