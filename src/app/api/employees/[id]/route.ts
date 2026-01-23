import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!["SUPER_ADMIN", "RH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const [rows] = await pool.execute(
      `SELECT id, email, name, password, role, image 
       FROM User 
       WHERE id = ?`,
      [params.id]
    )

    const users = rows as any[]

    if (users.length === 0) {
      return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ employee: users[0] })
  } catch (error) {
    console.error("Error fetching employee:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'employé" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!["SUPER_ADMIN", "RH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role } = body

    await pool.execute(
      `UPDATE User 
       SET name = ?, email = ?, role = ? 
       WHERE id = ?`,
      [name, email, role, params.id]
    )

    return NextResponse.json({ message: "Employé mis à jour avec succès" })
  } catch (error) {
    console.error("Error updating employee:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'employé" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!["SUPER_ADMIN", "RH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Prevent deleting yourself
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      )
    }

    await pool.execute(`DELETE FROM User WHERE id = ?`, [params.id])

    return NextResponse.json({ message: "Employé supprimé avec succès" })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'employé" },
      { status: 500 }
    )
  }
}
