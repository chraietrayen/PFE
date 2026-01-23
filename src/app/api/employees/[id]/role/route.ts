import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Only SUPER_ADMIN and RH can change roles
    if (!["SUPER_ADMIN", "RH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { role } = body

    // Validate role
    if (!["SUPER_ADMIN", "RH", "USER"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
    }

    // Prevent user from changing their own role
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      )
    }

    await pool.execute(
      `UPDATE User SET role = ? WHERE id = ?`,
      [role, id]
    )

    return NextResponse.json({ 
      success: true,
      message: "Rôle mis à jour avec succès" 
    })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rôle" },
      { status: 500 }
    )
  }
}
