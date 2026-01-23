import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Check if user is SUPER_ADMIN or RH
    if (!["SUPER_ADMIN", "RH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    console.log("Fetching employees for user:", session.user.email, "Role:", session.user.role)

    const [rows] = await pool.execute(
      `SELECT id, email, name, password, role, image 
       FROM User 
       ORDER BY id DESC`
    )

    console.log("Found employees:", (rows as any[]).length)

    return NextResponse.json({ employees: rows })
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des employés" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Check if user is SUPER_ADMIN or RH
    if (!["SUPER_ADMIN", "RH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { cin, name, lastName, email, password, role, sexe, rib } = body

    // Validation
    if (!email || !name || !lastName) {
      return NextResponse.json(
        { error: "Email, nom et prénom sont requis" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    )

    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      )
    }

    // Hash password if provided
    let hashedPassword = null
    if (password) {
      const bcrypt = require("bcryptjs")
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // Insert new employee
    const [result] = await pool.execute(
      `INSERT INTO users (cin, name, last_name, email, password, role, sexe, rib, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [cin || null, name, lastName, email, hashedPassword, role || "USER", sexe || null, rib || null]
    )

    return NextResponse.json(
      { message: "Employé créé avec succès", id: (result as any).insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'employé" },
      { status: 500 }
    )
  }
}
