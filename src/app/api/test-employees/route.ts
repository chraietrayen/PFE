import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // Test simple query
    const [rows] = await pool.execute(`SELECT * FROM users LIMIT 5`)
    
    return NextResponse.json({ 
      success: true,
      count: (rows as any[]).length,
      employees: rows 
    })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error
      },
      { status: 500 }
    )
  }
}
