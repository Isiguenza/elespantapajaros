import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  const allowedFiles = ["hat.png", "hat@2x.png", "mojito-empty.png", "mojito-empty@2x.png", "logo.png", "logo@2x.png"];
  
  if (!allowedFiles.includes(filename)) {
    return new NextResponse(null, { status: 404 });
  }

  const assetsPath = path.resolve(process.cwd(), "certs", "pass-assets");
  const filePath = path.join(assetsPath, filename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse(null, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
