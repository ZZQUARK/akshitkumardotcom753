import express, { Router } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable, pendingSubscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "../lib/razorpay";

const router = Router();

router.post(
  "/razorpay",
  express.raw({ type: "*/*" }),
  async (req, res) => {
    const rawBody = req.body as Buffer;
    const rawStr = rawBody.toString("utf8");
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const isProd = process.env.NODE_ENV === "production";

    if (secret) {
      if (!signature) {
        res.status(400).json({ error: "Missing signature" });
        return;
      }
      const valid = verifyWebhookSignature(rawStr, signature, secret);
      if (!valid) {
        res.status(400).json({ error: "Invalid signature" });
        return;
      }
    } else if (isProd) {
      res.status(400).json({ error: "Webhook secret not configured" });
      return;
    } else {
      console.warn(
        "[webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification (dev mode)",
      );
    }

    let payload: { event: string; payload: Record<string, unknown> };
    try {
      payload = JSON.parse(rawStr);
    } catch {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }

    if (payload.event === "payment.captured") {
      const payment = (
        payload.payload as {
          payment?: { entity?: { order_id?: string; id?: string } };
        }
      ).payment?.entity;

      if (payment?.order_id && payment?.id) {
        const orderId = payment.order_id;
        const paymentId = payment.id;

        await db
          .update(pendingSubscribersTable)
          .set({ paymentConfirmed: true, razorpayPaymentId: paymentId })
          .where(eq(pendingSubscribersTable.razorpayOrderId, orderId));

        await db
          .update(subscriptionsTable)
          .set({ status: "active", razorpayPaymentId: paymentId })
          .where(eq(subscriptionsTable.razorpayOrderId, orderId));
      }
    }

    res.json({ received: true });
  },
);

export default router;
