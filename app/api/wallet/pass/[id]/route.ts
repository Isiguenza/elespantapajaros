import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loyaltyCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

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

      const certsPath = path.resolve(process.cwd(), "certs");
      const assetsPath = path.resolve(certsPath, "pass-assets");

      // Read certificates as utf-8 strings
      const wwdr = fs.readFileSync(path.join(certsPath, "wwdr.pem"), "utf-8");
      const signerCert = fs.readFileSync(path.join(certsPath, "signerCert.pem"), "utf-8");
      const signerKey = fs.readFileSync(path.join(certsPath, "signerKey.pem"), "utf-8");

      // Read pass asset files
      const buffers: Record<string, Buffer> = {};
      if (fs.existsSync(assetsPath)) {
        const assetFiles = fs.readdirSync(assetsPath);
        for (const file of assetFiles) {
          buffers[file] = fs.readFileSync(path.join(assetsPath, file));
        }
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
