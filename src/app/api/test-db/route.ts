import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function GET() {
  try {
    // Connexion directe avec mysql2
    const connection = await mysql.createConnection({
      host: process. env.DB_HOST,
      port: Number(process.env. DB_PORT) || 3307,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })

    // Test une requête simple
    const [rows] = await connection.execute('SELECT 1 + 1 AS result')
    
    await connection.end()

    return NextResponse.json({ 
      success: true, 
      message: '✅ Connexion MySQL réussie!',
      result: rows 
    })

  } catch (error:  any) {
    return NextResponse.json({ 
      success: false, 
      message: '❌ Erreur de connexion',
      error: error.message 
    }, { status: 500 })
  }
}