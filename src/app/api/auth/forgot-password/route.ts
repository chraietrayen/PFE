import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"
import { emailService, isDevMode } from "@/lib/services/email-service"

// ========================================
// PASSWORD RESET CONFIGURATION
// ========================================
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT = 3 // Max requests per hour per email
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour window

/**
 * Generate a secure random token for password reset
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * POST /api/auth/forgot-password
 * 
 * Sends a password reset email to the user
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // ========================================
    // STEP 1: Check if user exists
    // ========================================
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true, password: true },
    })

    // For security, always return success even if user doesn't exist
    if (!user) {
      console.log("[FORGOT PASSWORD] User not found:", normalizedEmail)
      return NextResponse.json({
        success: true,
        message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
      })
    }

    // Check if user uses OAuth (no password set)
    if (!user.password) {
      console.log("[FORGOT PASSWORD] OAuth user:", normalizedEmail)
      return NextResponse.json({
        success: true,
        message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
      })
    }

    // ========================================
    // STEP 2: Check rate limiting
    // ========================================
    const rateWindow = new Date(Date.now() - RATE_WINDOW);

    const recentRequests = await prisma.password_reset_tokens.count({
      where: {
        email: normalizedEmail,
        created_at: { gte: rateWindow },
      },
    })

    if (recentRequests >= RATE_LIMIT) {
      console.log("[FORGOT PASSWORD] Rate limit exceeded:", normalizedEmail)
      return NextResponse.json(
        { error: "Trop de demandes. Veuillez réessayer plus tard." },
        { status: 429 }
      )
    }

    // ========================================
    // STEP 3: Generate reset token
    // ========================================
    const resetToken = generateResetToken()
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY)

    // Delete any existing tokens for this email
    await prisma.password_reset_tokens.deleteMany({
      where: { email: normalizedEmail },
    })

    // Store new token
    await prisma.password_reset_tokens.create({
      data: {
        id: uuidv4(),
        email: normalizedEmail,
        token: resetToken,
        expires: expiresAt,
      },
    })

    // ========================================
    // STEP 4: Send reset email
    // ========================================
    if (isDevMode()) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
      console.log("========================================")
      console.log("[DEV MODE] Password Reset Request")
      console.log("Email:", normalizedEmail)
      console.log("Token:", resetToken)
      console.log("Reset Link:", `${baseUrl}/reset-password?token=${resetToken}`)
      console.log("Expires:", expiresAt.toISOString())
      console.log("========================================")
    }

    await emailService.sendPasswordResetEmail(
      normalizedEmail,
      resetToken,
      user.name || "Utilisateur"
    )

    return NextResponse.json({
      success: true,
      message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
      ...(isDevMode() && { devToken: resetToken }),
    })
  } catch (error) {
    console.error("[FORGOT PASSWORD ERROR]:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    )
  }
}
