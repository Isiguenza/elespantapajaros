import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loyaltyCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import zlib from "zlib";

function generateMinimalPng(): Buffer {
  const width = 29, height = 29;
  const raw: number[] = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter: none
    for (let x = 0; x < width; x++) {
      raw.push(79, 70, 229, 255); // RGBA indigo
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw));

  function crc32(buf: Buffer): number {
    let c: number;
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // 8-bit RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const card = await db.query.loyaltyCards.findFirst({
      where: eq(loyaltyCards.id, id),
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Check if Apple Wallet certificates are configured
    const passTypeId = process.env.APPLE_PASS_TYPE_ID;
    const teamId = process.env.APPLE_TEAM_ID;

    if (!passTypeId || !teamId) {
      // Return a JSON representation if Apple Wallet is not configured
      return NextResponse.json(
        {
          error: "Apple Wallet not configured",
          message:
            "Configure APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, and certificate files to generate .pkpass files. See SETUP.md for instructions.",
          card: {
            customerName: card.customerName,
            barcodeValue: card.barcodeValue,
            stamps: card.stamps,
            stampsPerReward: card.stampsPerReward,
            rewardsAvailable: card.rewardsAvailable,
          },
        },
        { status: 501 }
      );
    }

    // Generate Apple Wallet pass using passkit-generator
    // This requires proper certificates to be set up
    try {
      const { PKPass } = await import("passkit-generator");

      // Read certificates: prefer env vars (base64), fallback to files for local dev
      let wwdr: string;
      let signerCert: string;
      let signerKey: string;

      if (process.env.APPLE_WWDR_PEM_B64) {
        wwdr = Buffer.from(process.env.APPLE_WWDR_PEM_B64, "base64").toString("utf-8");
        signerCert = Buffer.from(process.env.APPLE_SIGNER_CERT_B64!, "base64").toString("utf-8");
        signerKey = Buffer.from(process.env.APPLE_SIGNER_KEY_B64!, "base64").toString("utf-8");
      } else {
        const certsPath = path.resolve(process.cwd(), "certs");
        wwdr = fs.readFileSync(path.join(certsPath, "wwdr.pem"), "utf-8");
        signerCert = fs.readFileSync(path.join(certsPath, "signerCert.pem"), "utf-8");
        signerKey = fs.readFileSync(path.join(certsPath, "signerKey.pem"), "utf-8");
      }

      // Read pass asset files (local only; on Vercel, generate minimal icon)
      const buffers: Record<string, Buffer> = {};
      const assetsPath = path.resolve(process.cwd(), "certs", "pass-assets");
      if (fs.existsSync(assetsPath)) {
        const assetFiles = fs.readdirSync(assetsPath);
        for (const file of assetFiles) {
          buffers[file] = fs.readFileSync(path.join(assetsPath, file));
        }
      } else {
        // Generate a minimal 1x1 indigo PNG for required icon
        const minimalPng = generateMinimalPng();
        buffers["icon.png"] = minimalPng;
        buffers["icon@2x.png"] = minimalPng;
        buffers["logo.png"] = minimalPng;
        buffers["logo@2x.png"] = minimalPng;
      }

      const pass = new PKPass(
        buffers,
        {
          wwdr,
          signerCert,
          signerKey,
        },
        {
          serialNumber: card.id,
          passTypeIdentifier: passTypeId,
          teamIdentifier: teamId,
          organizationName: "Espantapájaros",
          description: "Tarjeta de Cliente Frecuente",
          foregroundColor: "rgb(255, 255, 255)",
          backgroundColor: "rgb(79, 70, 229)",
          logoText: "Espantapájaros",
        }
      );

      pass.type = "storeCard";

      // Set barcode
      pass.setBarcodes({
        message: card.barcodeValue,
        format: "PKBarcodeFormatPDF417",
        messageEncoding: "iso-8859-1",
      });

      // Header fields
      pass.headerFields.push({
        key: "stamps",
        label: "SELLOS",
        value: `${card.stamps}/${card.stampsPerReward}`,
      });

      // Primary fields
      pass.primaryFields.push({
        key: "customerName",
        label: "CLIENTE",
        value: card.customerName,
      });

      // Secondary fields
      pass.secondaryFields.push(
        {
          key: "currentStamps",
          label: "SELLOS ACTUALES",
          value: `${card.stamps} sellos`,
        },
        {
          key: "rewards",
          label: "PREMIOS DISPONIBLES",
          value: `${card.rewardsAvailable} premios`,
        }
      );

      // Back fields
      pass.backFields.push(
        {
          key: "totalStamps",
          label: "Total de sellos acumulados",
          value: card.totalStamps.toString(),
        },
        {
          key: "rewardsRedeemed",
          label: "Premios canjeados",
          value: card.rewardsRedeemed.toString(),
        },
        {
          key: "phone",
          label: "Teléfono",
          value: card.customerPhone || "No registrado",
        }
      );

      const buffer = pass.getAsBuffer();

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.apple.pkpass",
          "Content-Disposition": `attachment; filename="espantapajaros-${card.barcodeValue}.pkpass"`,
        },
      });
    } catch (passError) {
      console.error("Error generating pass:", passError);
      return NextResponse.json(
        {
          error: "Error generating Apple Wallet pass",
          details: String(passError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
