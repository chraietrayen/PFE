import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { execute, testConnection } from "@/lib/db";

const migrations = [
  // LoginHistory table
  `CREATE TABLE IF NOT EXISTS login_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_method VARCHAR(50) DEFAULT 'credentials',
    success BOOLEAN DEFAULT true,
    failure_reason VARCHAR(255),
    device_fingerprint VARCHAR(255),
    is_suspicious BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_login_history_user (user_id),
    INDEX idx_login_history_created (created_at),
    INDEX idx_login_history_suspicious (is_suspicious)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // UserPreferences table
  `CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'fr',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sound_notifications BOOLEAN DEFAULT false,
    compact_mode BOOLEAN DEFAULT false,
    accessibility_mode BOOLEAN DEFAULT false,
    sidebar_collapsed BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

/**
 * POST /api/debug/migrate
 * Run database migrations (SUPER_ADMIN only, or DEV mode with secret key)
 */
export async function POST(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === "development";
    const { searchParams } = new URL(req.url);
    const devKey = searchParams.get("key");
    
    // In development, allow migration with a secret key
    const devKeyValid = isDev && devKey === "migrate-dev-2024";
    
    if (!devKeyValid) {
      const session = await getServerSession(authOptions);
      
      // Only allow SUPER_ADMIN to run migrations in production
      if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Accès refusé. Seul un SUPER_ADMIN peut exécuter les migrations." },
          { status: 403 }
        );
      }
    }

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: "Impossible de se connecter à la base de données" },
        { status: 500 }
      );
    }

    const results: { table: string; success: boolean; message: string }[] = [];

    for (const migration of migrations) {
      const tableName = migration.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || "Unknown";
      
      try {
        await execute(migration);
        results.push({
          table: tableName,
          success: true,
          message: `Table ${tableName} créée avec succès`,
        });
      } catch (error: any) {
        if (error.code === "ER_TABLE_EXISTS_ERROR") {
          results.push({
            table: tableName,
            success: true,
            message: `Table ${tableName} existe déjà`,
          });
        } else {
          results.push({
            table: tableName,
            success: false,
            message: error.message,
          });
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: errorCount === 0,
      message: `Migration terminée: ${successCount} succès, ${errorCount} erreurs`,
      results,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exécution des migrations" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/debug/migrate
 * Check migration status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const isConnected = await testConnection();
    
    return NextResponse.json({
      connected: isConnected,
      tables: [
        "login_history",
        "user_preferences",
      ],
      instruction: "Envoyez une requête POST pour exécuter les migrations",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
