import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // Show all tables
    const [tables] = await pool.execute(`SHOW TABLES`)
    
    return NextResponse.json({ 
      success: true,
      tables: tables 
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
