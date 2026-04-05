import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: "subscriber" | "admin";
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.session.userRole === "admin") {
    next();
    return;
  }
  const now = new Date();
  const activeSub = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, req.session.userId),
        eq(subscriptionsTable.status, "active"),
        gte(subscriptionsTable.endsAt, now),
      ),
    )
    .limit(1);

  if (activeSub.length === 0) {
    res.status(403).json({ error: "Active subscription required" });
    return;
  }
  next();
}

export async function getIsActiveSubscriber(
  userId: number,
): Promise<boolean> {
  const now = new Date();
  const activeSub = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "active"),
        gte(subscriptionsTable.endsAt, now),
      ),
    )
    .limit(1);
  return activeSub.length > 0;
}
