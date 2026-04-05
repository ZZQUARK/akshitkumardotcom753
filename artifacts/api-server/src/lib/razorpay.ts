import crypto from "crypto";

const PRICES: Record<string, Record<string, number>> = {
  IN: { monthly: 15000, yearly: 150000 },
  INTL: { monthly: 399, yearly: 3999 },
};

const CURRENCIES: Record<string, string> = {
  IN: "INR",
  INTL: "USD",
};

export function getPriceAndCurrency(plan: string, region: string) {
  const amount = (PRICES[region] ?? PRICES.IN)[plan] ?? 19900;
  const currency = CURRENCIES[region] ?? "INR";
  return { amount, currency };
}

export async function createRazorpayOrder(opts: {
  amount: number;
  currency: string;
  receipt: string;
}): Promise<{ id: string; amount: number; currency: string }> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (!keyId || !keySecret) {
    if (isProd) {
      throw new Error(
        "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in production",
      );
    }
    console.warn("[razorpay] Keys not set — returning mock order (dev only)");
    return {
      id: `order_mock_${Date.now()}`,
      amount: opts.amount,
      currency: opts.currency,
    };
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: opts.amount,
      currency: opts.currency,
      receipt: opts.receipt,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay order creation failed: ${body}`);
  }

  return res.json() as Promise<{ id: string; amount: number; currency: string }>;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

export function verifyPaymentSignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const body = `${opts.orderId}|${opts.paymentId}`;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(opts.signature, "hex"),
    );
  } catch {
    return false;
  }
}
