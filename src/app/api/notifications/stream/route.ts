import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/mysql-direct";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const userRole = session.user.role;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let isControllerClosed = false;
      let timer: NodeJS.Timeout | null = null;

      const send = (payload: unknown) => {
        if (isControllerClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (error) {
          // Controller is closed, ignore
          isControllerClosed = true;
          if (timer) clearInterval(timer);
        }
      };

      const tick = async () => {
        if (isControllerClosed) return;
        
        try {
          const isAdmin = userRole === "RH" || userRole === "SUPER_ADMIN";
          
          const notifications = await query(
            isAdmin
              ? `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`
              : `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
            isAdmin ? [] : [userId]
          ) as any[];
          
          const unreadCountResult = await query(
            isAdmin
              ? `SELECT COUNT(*) as count FROM notifications WHERE is_read = 0`
              : `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
            isAdmin ? [] : [userId]
          ) as any[];

          send({
            unreadCount: unreadCountResult?.[0]?.count || 0,
            notifications: notifications || [],
            timestamp: new Date().toISOString(),
          });
        } catch (error: any) {
          if (!isControllerClosed) {
            send({ error: "STREAM_ERROR", message: error.message });
          }
        }
      };

      tick();
      timer = setInterval(tick, 10000); // Increased interval to reduce load

      req.signal.addEventListener("abort", () => {
        isControllerClosed = true;
        if (timer) clearInterval(timer);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
