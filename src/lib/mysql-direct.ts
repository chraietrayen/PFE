import mysql, { RowDataPacket, OkPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    })
  }
  return pool
}

export async function getConnection(): Promise<PoolConnection> {
  return await getPool().getConnection()
}

export async function query<T extends RowDataPacket[] = RowDataPacket[]>(
  sql: string, 
  params?: any[]
): Promise<T> {
  const connection = await getPool().getConnection()
  try {
    const [rows] = await connection.execute<T>(sql, params)
    return rows
  } finally {
    connection.release()
  }
}

export async function execute(
  sql: string, 
  params?: any[]
): Promise<OkPacket | ResultSetHeader> {
  const connection = await getPool().getConnection()
  try {
    const [result] = await connection.execute<OkPacket | ResultSetHeader>(sql, params)
    return result
  } finally {
    connection.release()
  }
}
