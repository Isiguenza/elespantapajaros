import { NextResponse } from "next/server";

export async function GET() {
  const wwdrPem = process.env.APPLE_WWDR_PEM;
  const wwdrB64 = process.env.APPLE_WWDR_PEM_B64;
  const certPem = process.env.APPLE_SIGNER_CERT_PEM;
  const certB64 = process.env.APPLE_SIGNER_CERT_B64;
  const keyPem = process.env.APPLE_SIGNER_KEY_PEM;
  const keyB64 = process.env.APPLE_SIGNER_KEY_B64;

  function inspect(name: string, val: string | undefined) {
    if (!val) return { name, set: false };
    return {
      name,
      set: true,
      length: val.length,
      first30: val.substring(0, 30),
      last30: val.substring(val.length - 30),
      hasRealNewlines: val.includes("\n"),
      hasLiteralBackslashN: val.includes("\\n"),
      startsWithBegin: val.startsWith("-----BEGIN"),
    };
  }

  return NextResponse.json({
    envVars: [
      inspect("APPLE_WWDR_PEM", wwdrPem),
      inspect("APPLE_WWDR_PEM_B64", wwdrB64),
      inspect("APPLE_SIGNER_CERT_PEM", certPem),
      inspect("APPLE_SIGNER_CERT_B64", certB64),
      inspect("APPLE_SIGNER_KEY_PEM", keyPem),
      inspect("APPLE_SIGNER_KEY_B64", keyB64),
    ],
  });
}
