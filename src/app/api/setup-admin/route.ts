import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import bcrypt from "bcryptjs"
import { v4 as uuid } from "uuid"

export async function GET() {
  try {
    // Vérifier si l'admin existe déjà
    const [existingUsers] = await pool. execute(
      `SELECT id FROM User WHERE email = ?`,
      ["admin@santec.com"]
    )

    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json({
        success: true,
        message:  "⚠️ Admin existe déjà! ",
        credentials: {
          email: "admin@santec.com",
          password: "Admin123!",
        },
      })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash("Admin123!", 10)
    const id = uuid()

    // Créer l'admin
    await pool.execute(
      `INSERT INTO User (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)`,
      [id, "admin@santec.com", "Super Admin", hashedPassword, "SUPER_ADMIN"]
    )

    return NextResponse.json({
      success: true,
      message: "✅ Admin créé avec succès!",
      credentials: {
        email: "admin@santec.com",
        password: "Admin123!",
      },
    })

  } catch (error: any) {
    console.error("Erreur setup-admin:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    )
  }
}