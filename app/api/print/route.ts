import { NextRequest, NextResponse } from "next/server";
import net from "net";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const PRINTER_IP = "192.168.0.200";
const PRINTER_PORT = 9100;

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
async function imageToEscPosBitmap(imagePath: string, maxWidth: number = 384): Promise<string> {
  try {
    // Leer y procesar la imagen
    const imageBuffer = await sharp(imagePath)
      .resize({ width: maxWidth, fit: 'contain' })
      .greyscale()
      .threshold(128) // Convertir a blanco y negro
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = imageBuffer;
    const width = info.width;
    const height = info.height;

    // Calcular bytes por línea (debe ser múltiplo de 8)
    const bytesPerLine = Math.ceil(width / 8);

    // Convertir a bitmap
    let bitmap = "";
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < bytesPerLine; x++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const pixelX = x * 8 + bit;
          if (pixelX < width) {
            const pixelIndex = (y * width + pixelX);
            const pixelValue = data[pixelIndex];
            // Si el pixel es blanco (255), poner bit en 0
            // Si el pixel es negro (0), poner bit en 1
            if (pixelValue < 128) {
              byte |= (1 << (7 - bit));
            }
          }
        }
        bitmap += String.fromCharCode(byte);
      }
    }

    // Comando ESC/POS para imprimir bitmap
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerName, 
      orderNumber, 
      items, 
      subtotal, 
      tip, 
      total, 
      tableNumber,
      isDelivery 
    } = body;

    // Construir contenido del ticket
    let content = "";
    
    // Inicializar impresora
    content += commands.init;
    
    // Logo centrado sin espacio arriba
    content += commands.alignCenter;
    
    // Imprimir logo desde archivo
    const logoPath = path.join(process.cwd(), "public", "logo.jpg");
    if (fs.existsSync(logoPath)) {
      const logoBitmap = await imageToEscPosBitmap(logoPath, 400);
      content += logoBitmap;
      content += commands.feedLine;
      content += commands.feedLine;
    } else {
      // Fallback a texto si no hay logo
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
    // Calcular espacios para justificar (24 chars por lado en tamaño doble)
    const orderText = `#${orderNumber}`;
    const spaces = Math.max(1, 24 - label.length - orderText.length);
    content += " ".repeat(spaces);
    content += commands.bold;
    content += orderText + "\n";
    content += commands.boldOff;
    content += commands.textSizeNormal;
    content += commands.feedLine;
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Línea separadora continua (80mm)
    content += commands.alignLeft;
    content += "────────────────────────────────────────────────\n";
    content += commands.feedLine;
    
    // Items agrupados por asiento
    for (const seat of Object.keys(items)) {
      const seatItems = items[seat];
      
      // Header de asiento alineado a la izquierda
      if (Object.keys(items).length > 1 || seat !== "C") {
        content += commands.bold;
        const seatLabel = seat === "C" ? "Centro:" : `${seat}:`;
        content += seatLabel + "\n";
        content += commands.boldOff;
        content += commands.feedLine;
      }
      
      // Items del asiento con más espaciado (80mm = ~48 caracteres)
      for (const item of seatItems) {
        const qtyName = `${item.qty}x ${item.name}`;
        const price = `$${item.total}`;
        const spaces = Math.max(1, 48 - qtyName.length - price.length);
        content += qtyName + " ".repeat(spaces) + price + "\n";
        content += commands.feedLine;
      }
      content += commands.feedLine;
      content += commands.feedLine;
    }
    
    // Espacio antes del total
    content += commands.feedLine;
    content += commands.feedLine;
    
    // Línea separadora continua (80mm)
    content += "────────────────────────────────────────────────\n";
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
    // En tamaño doble, el ancho es la mitad (24 chars)
    content += " ".repeat(Math.max(1, 24 - 6 - totalStr.length)) + totalStr + "\n";
    content += commands.textSizeNormal;
    content += commands.boldOff;
    
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error printing:", error);
    return NextResponse.json(
      { error: "Error al imprimir" },
      { status: 500 }
    );
  }
}

function sendToPrinter(content: string): Promise<void> {
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
    
    // Timeout de 5 segundos
    setTimeout(() => {
      client.destroy();
      resolve();
    }, 5000);
  });
}
