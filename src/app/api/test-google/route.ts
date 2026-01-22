import { NextResponse } from "next/server"

export async function GET() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env. GOOGLE_CLIENT_SECRET

  return NextResponse.json({
    googleConfigured: ! !(googleClientId && googleClientSecret),
    clientIdExists: !!googleClientId,
    clientSecretExists: !! googleClientSecret,
    clientIdPreview: googleClientId ?  googleClientId.substring(0, 20) + "..." : "❌ Non défini",
  })
}