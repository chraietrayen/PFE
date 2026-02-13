import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { isDevMode } from "@/lib/services/email-service"

// ========================================
// OTP VERIFICATION CONFIGURATION
// ========================================
const MAX_ATTEMPTS = 5 // Max verification attempts before invalidation
const DEV_OTP_CODE = "000000" // Fixed OTP code for DEV mode

/**
 * POST /api/auth/verify-otp
 * 
 * Verifies the OTP code entered by the user
 */
export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    // Validate required fields
    if (!email || !code) {
      return NextResponse.json(
        { error: "Email et code OTP requis" },
        { status: 400 }
      )
    }

    // ========================================
    // DEV MODE: Accept "000000" directly
    // ========================================
    if (isDevMode() && code === DEV_OTP_CODE) {
      console.log("========================================");
      console.log("[DEV MODE] OTP Verification");
      console.log("Email:", email);
      console.log("Code:", code);
      console.log("Status: ACCEPTED (dev mode bypass)");
      console.log("========================================");

      // Get user data for session
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, image: true, role: true, status: true },
      })

      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        )
      }

      // Clean up any existing OTPs for this email
      await prisma.otp_tokens.deleteMany({ where: { email } })

      return NextResponse.json({
        success: true,
        verified: true,
        devMode: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          status: user.status,
        },
      })
    }

    // ========================================
    // PROD MODE: Verify against database
    // ========================================
    
    // Find the OTP token
    const otpToken = await prisma.otp_tokens.findFirst({
      where: {
        email,
        verified: false,
      },
      orderBy: { created_at: "desc" },
    })

    if (!otpToken) {
      return NextResponse.json(
        { error: "Aucun code OTP trouvé. Veuillez en demander un nouveau." },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date() > new Date(otpToken.expires)) {
      await prisma.otp_tokens.delete({ where: { id: otpToken.id } })
      return NextResponse.json(
        { error: "Code OTP expiré. Veuillez en demander un nouveau." },
        { status: 400 }
      )
    }

    // Check max attempts
    if ((otpToken.attempts ?? 0) >= MAX_ATTEMPTS) {
      await prisma.otp_tokens.delete({ where: { id: otpToken.id } })
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez demander un nouveau code." },
        { status: 400 }
      )
    }

    // Verify OTP (compare with hashed code)
    const isValid = await bcrypt.compare(code, otpToken.code)

    if (!isValid) {
      // Increment attempts
      await prisma.otp_tokens.update({
        where: { id: otpToken.id },
        data: { attempts: { increment: 1 } },
      })

      const remainingAttempts = MAX_ATTEMPTS - (otpToken.attempts ?? 0) - 1

      return NextResponse.json(
        {
          error: `Code OTP invalide. ${remainingAttempts} tentative(s) restante(s).`,
          remainingAttempts,
        },
        { status: 400 }
      )
    }

    // ========================================
    // OTP VALID: Get user and create session
    // ========================================
    
    // Mark as verified
    await prisma.otp_tokens.update({
      where: { id: otpToken.id },
      data: { verified: true },
    })

    // Get user data for session
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, image: true, role: true, status: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Clean up old OTPs for this email
    await prisma.otp_tokens.deleteMany({ where: { email, verified: true } })
    return NextResponse.json({
      success: true,
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        status: user.status,
      },
    })
  } catch (error) {
    console.error("[OTP ERROR] Error verifying OTP:", error)
    return NextResponse.json(
      { error: "Erreur lors de la vérification du code OTP" },
      { status: 500 }
    )
  }
}


