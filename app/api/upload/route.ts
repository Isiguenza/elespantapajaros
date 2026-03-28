import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Upload request received");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    console.log("📁 File received:", file ? `${file.name} (${file.type}, ${file.size} bytes)` : "null");

    if (!file) {
      console.error("❌ No file provided");
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    console.log("🔍 Validating file type:", file.type);
    if (!validTypes.includes(file.type)) {
      console.error("❌ Invalid file type:", file.type);
      return NextResponse.json({ error: `Tipo de archivo no válido: ${file.type}` }, { status: 400 });
    }

    // Validate file size (max 5MB para base64)
    const maxSize = 5 * 1024 * 1024;
    console.log("📏 File size:", file.size, "/ Max:", maxSize);
    if (file.size > maxSize) {
      console.error("❌ File too large:", file.size);
      return NextResponse.json({ error: `Archivo muy grande (${(file.size / 1024 / 1024).toFixed(2)}MB, máx 5MB)` }, { status: 400 });
    }

    // Convert to base64
    console.log("🔄 Converting to base64...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // Create data URL
    const imageUrl = `data:${file.type};base64,${base64}`;
    console.log("✅ Image converted successfully, data URL length:", imageUrl.length);

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error("❌ Error uploading file:", error);
    console.error("Error details:", error.message, error.stack);
    return NextResponse.json({ error: `Error subiendo archivo: ${error.message}` }, { status: 500 });
  }
}
