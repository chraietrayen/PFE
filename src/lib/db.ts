import mysql from 'mysql2/promise'

// Pool de connexion pour le serveur distant
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
})

// Fonction helper pour les requêtes SELECT
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const [results] = await pool.execute(sql, params)
  return results as T
}

// Fonction pour INSERT, UPDATE, DELETE
export async function execute(sql: string, params?: any[]) {
  const [result] = await pool.execute(sql, params)
  return result
}

// Test de connexion
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Connexion MySQL réussie!')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ Erreur connexion:', error)
    return false
  }
}