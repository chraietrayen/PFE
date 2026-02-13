import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

// ========================================
// PASSWORD VALIDATION
// ========================================
const MIN_PASSWORD_LENGTH = 8

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`,
    }
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: "Le mot de passe doit contenir au moins une majuscule",
    }
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: "Le mot de passe doit contenir au moins une minuscule",
    }
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: "Le mot de passe doit contenir au moins un chiffre",
    }
  }

  return { valid: true }
}

/**
 * POST /api/auth/reset-password
 * 
 * Resets the user's password using a valid reset token
 */
export async function POST(request: Request) {
  try {
    const { token, password, confirmPassword } = await request.json()

    // ========================================
    // STEP 1: Validate input
    // ========================================
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token de réinitialisation requis" },
        { status: 400 }
      )
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: "Mot de passe requis" },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Les mots de passe ne correspondent pas" },
        { status: 400 }
      )
    }

    const validation = validatePassword(password)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // ========================================
    // STEP 2: Find and validate token
    // ========================================
    const resetToken = await prisma.password_reset_tokens.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "Lien de réinitialisation invalide ou déjà utilisé" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > new Date(resetToken.expires)) {
      await prisma.password_reset_tokens.delete({ where: { id: resetToken.id } })
      return NextResponse.json(
        { error: "Ce lien de réinitialisation a expiré. Veuillez en demander un nouveau." },
        { status: 400 }
      )
    }

    // ========================================
    // STEP 3: Find user
    // ========================================
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // ========================================
    // STEP 4: Update password
    // ========================================
    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, updatedAt: new Date() },
    })

    // Clean up all reset tokens for this user
    await prisma.password_reset_tokens.deleteMany({
      where: { email: resetToken.email },
    })

    console.log("[RESET PASSWORD] Password reset successful for:", resetToken.email)

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été réinitialisé avec succès",
    })
  } catch (error) {
    console.error("[RESET PASSWORD ERROR]:", error)
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation du mot de passe" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * 
 * Validates if a reset token is still valid
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token manquant" },
        { status: 400 }
      )
    }

    const resetToken = await prisma.password_reset_tokens.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json({
        valid: false,
        error: "Lien invalide ou déjà utilisé",
      })
    }

    if (new Date() > new Date(resetToken.expires)) {
      return NextResponse.json({
        valid: false,
        error: "Ce lien a expiré",
      })
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.email,
    })
  } catch (error) {
    console.error("[VALIDATE TOKEN ERROR]:", error)
    return NextResponse.json(
      { valid: false, error: "Erreur de validation" },
      { status: 500 }
    )
  }
}
