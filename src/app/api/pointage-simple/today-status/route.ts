import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/mysql-direct";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier s'il y a un check-in aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkInResult = await query(
      `SELECT COUNT(*) as count FROM pointages 
       WHERE user_id = ? AND type = 'IN' 
       AND timestamp >= ? AND timestamp < ?`,
      [session.user.id, today, tomorrow]
    ) as any[];

    const checkOutResult = await query(
      `SELECT COUNT(*) as count FROM pointages 
       WHERE user_id = ? AND type = 'OUT' 
       AND timestamp >= ? AND timestamp < ?`,
      [session.user.id, today, tomorrow]
    ) as any[];

    return NextResponse.json({
      hasCheckedIn: (checkInResult[0]?.count || 0) > 0,
      hasCheckedOut: (checkOutResult[0]?.count || 0) > 0
    });
  } catch (error: any) {
    console.error("Error checking today status:", error);
    return NextResponse.json(
      { hasCheckedIn: false, hasCheckedOut: false },
      { status: 500 }
    );
  }
}
