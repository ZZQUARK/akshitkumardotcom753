import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  usersTable,
  pendingSubscribersTable,
  subscriptionsTable,
} from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  createRazorpayOrder,
  getPriceAndCurrency,
} from "../lib/razorpay";
import {
  sendMagicLink,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from "../lib/email";
import { getIsActiveSubscriber } from "../middlewares/auth";

const router = Router();

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    res.json({ user: null });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId))
    .limit(1);

  if (!user) {
    req.session.destroy(() => {});
    res.json({ user: null });
    return;
  }

  const isActive =
    user.role === "admin" || (await getIsActiveSubscriber(user.id));

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive,
    },
  });
});

router.post("/subscribe-initiate", async (req, res) => {
  const { email, name, phone, plan, region } = req.body as {
    email: string;
    name: string;
    phone?: string;
    plan: "monthly" | "yearly";
    region: "IN" | "INTL";
  };

  if (!email || !name || !plan || !region) {
    res.status(400).json({ error: "email, name, plan and region are required" });
    return;
  }
  if (!["monthly", "yearly"].includes(plan)) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }
  if (!["IN", "INTL"].includes(region)) {
    res.status(400).json({ error: "Invalid region" });
    return;
  }

  const { amount, currency } = getPriceAndCurrency(plan, region);
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const receipt = `tink_${Date.now()}`;

  let razorpayOrderId: string;
  try {
    const order = await createRazorpayOrder({ amount, currency, receipt });
    razorpayOrderId = order.id;
  } catch (err) {
    res.status(500).json({ error: "Payment gateway error" });
    return;
  }

  await db.insert(pendingSubscribersTable).values({
    email,
    name,
    phone: phone ?? null,
    plan,
    region,
    token,
    expiresAt,
    razorpayOrderId,
  });

  await sendMagicLink({ to: email, name, token, plan });

  res.json({
    razorpayOrderId,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
    amount,
    currency,
  });
});

router.post("/verify-token", async (req, res) => {
  const { token } = req.body as { token: string };
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }

  const [pending] = await db
    .select()
    .from(pendingSubscribersTable)
    .where(
      and(
        eq(pendingSubscribersTable.token, token),
        gt(pendingSubscribersTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!pending) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  res.json({
    email: pending.email,
    name: pending.name,
    plan: pending.plan,
    region: pending.region,
  });
});

router.post("/create-account", async (req, res) => {
  const { token, password } = req.body as { token: string; password: string };
  if (!token || !password) {
    res.status(400).json({ error: "token and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [pending] = await db
    .select()
    .from(pendingSubscribersTable)
    .where(
      and(
        eq(pendingSubscribersTable.token, token),
        gt(pendingSubscribersTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!pending) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  const razorpayKeysConfigured =
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

  if (razorpayKeysConfigured && !pending.paymentConfirmed) {
    res.status(402).json({
      error: "Payment not yet confirmed. Please wait a moment and try again.",
    });
    return;
  }

  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, pending.email))
    .limit(1);

  if (existingUser.length > 0) {
    res.status(400).json({ error: "Account already exists for this email" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const now = new Date();
  const endsAt = new Date(
    now.getTime() +
      (pending.plan === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000,
  );

  const user = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(usersTable)
      .values({
        email: pending.email,
        name: pending.name,
        phone: pending.phone ?? null,
        passwordHash,
        role: "subscriber",
      })
      .returning();

    await tx.insert(subscriptionsTable).values({
      userId: newUser.id,
      plan: pending.plan,
      razorpayOrderId: pending.razorpayOrderId ?? null,
      razorpayPaymentId: pending.razorpayPaymentId ?? null,
      status: "active",
      region: pending.region,
      startsAt: now,
      endsAt,
    });

    await tx
      .delete(pendingSubscribersTable)
      .where(eq(pendingSubscribersTable.id, pending.id));

    return newUser;
  });

  await sendWelcomeEmail({ to: user.email, name: user.name });

  req.session.userId = user.id;
  req.session.userRole = "subscriber";

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: true,
    },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isActive =
    user.role === "admin" || (await getIsActiveSubscriber(user.id));

  req.session.userId = user.id;
  req.session.userRole = user.role;

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive,
    },
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {});
  res.json({ success: true });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body as { email: string };
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db
      .update(usersTable)
      .set({ resetToken, resetTokenExpiresAt: expiresAt })
      .where(eq(usersTable.id, user.id));

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: resetToken,
    });
  }

  res.json({ success: true });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body as { token: string; password: string };
  if (!token || !password) {
    res.status(400).json({ error: "token and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.resetToken, token),
        gt(usersTable.resetTokenExpiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!user) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .update(usersTable)
    .set({ passwordHash, resetToken: null, resetTokenExpiresAt: null })
    .where(eq(usersTable.id, user.id));

  res.json({ success: true });
});

export default router;
