import { Router, type IRouter } from "express";

const router: IRouter = Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const APP_URL = process.env.APP_URL || "http://localhost:5173";

// POST /payments/stripe/create-session
router.post("/payments/stripe/create-session", async (req, res): Promise<void> => {
  if (!STRIPE_SECRET_KEY) {
    res.status(500).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env" });
    return;
  }

  try {
    const { items, customerEmail, orderId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "No items provided" });
      return;
    }

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId || ""}`);
    params.append("cancel_url", `${APP_URL}/checkout`);
    params.append("customer_email", customerEmail || "");
    params.append("metadata[order_id]", String(orderId || ""));

    // Dùng automatic_payment_methods để Stripe tự hiện TẤT CẢ phương thức
    // đã bật trong Dashboard: Visa, MC, Amex, JCB, PayPal, Alipay, v.v.
    params.append("automatic_payment_methods[enabled]", "true");

    items.forEach((item: { title: string; price: number; quantity: number; imageUrl?: string }, idx: number) => {
      const priceInCents = Math.round(Number(item.price) * 100);
      params.append(`line_items[${idx}][price_data][currency]`, "usd");
      params.append(`line_items[${idx}][price_data][unit_amount]`, String(priceInCents));
      params.append(`line_items[${idx}][price_data][product_data][name]`, item.title);
      if (item.imageUrl) {
        params.append(`line_items[${idx}][price_data][product_data][images][0]`, item.imageUrl);
      }
      params.append(`line_items[${idx}][quantity]`, String(item.quantity || 1));
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json() as any;

    if (!stripeRes.ok) {
      res.status(400).json({ error: session.error?.message || "Stripe error" });
      return;
    }

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Payment session creation failed" });
  }
});

// GET /payments/stripe/verify/:sessionId
router.get("/payments/stripe/verify/:sessionId", async (req, res): Promise<void> => {
  if (!STRIPE_SECRET_KEY) { res.status(500).json({ error: "Stripe not configured" }); return; }
  try {
    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${req.params.sessionId}`, {
      headers: { "Authorization": `Bearer ${STRIPE_SECRET_KEY}` },
    });
    const session = await stripeRes.json() as any;
    res.json({
      paid: session.payment_status === "paid",
      status: session.payment_status,
      orderId: session.metadata?.order_id,
      customerEmail: session.customer_email,
    });
  } catch {
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
