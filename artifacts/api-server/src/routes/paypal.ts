import { Router, type IRouter } from "express";

const router: IRouter = Router();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || "";
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_BASE = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// Lấy access token từ PayPal
async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error_description || "Failed to get PayPal token");
  return data.access_token;
}

// POST /payments/paypal/create-order
router.post("/payments/paypal/create-order", async (req, res): Promise<void> => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    res.status(500).json({ error: "PayPal is not configured" });
    return;
  }

  try {
    const { items, total, orderId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "No items provided" });
      return;
    }

    const accessToken = await getAccessToken();

    // Build PayPal order items
    const paypalItems = items.map((item: any) => ({
      name: item.title,
      quantity: String(item.quantity || 1),
      unit_amount: {
        currency_code: "USD",
        value: Number(item.price).toFixed(2),
      },
    }));

    const itemTotal = items.reduce((sum: number, i: any) =>
      sum + Number(i.price) * Number(i.quantity || 1), 0
    );

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: String(orderId || ""),
          description: `naman.atelier Order #${orderId}`,
          items: paypalItems,
          amount: {
            currency_code: "USD",
            value: itemTotal.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: itemTotal.toFixed(2),
              },
            },
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: `${process.env.APP_URL}/checkout/success`,
            cancel_url: `${process.env.APP_URL}/checkout`,
          },
        },
      },
    };

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `order-${orderId}-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const order = await orderRes.json() as any;

    if (!orderRes.ok) {
      console.error("PayPal create order error:", order);
      res.status(400).json({ error: order.message || "PayPal order creation failed" });
      return;
    }

    res.json({ paypalOrderId: order.id, status: order.status });
  } catch (err: any) {
    console.error("PayPal error:", err);
    res.status(500).json({ error: err.message || "PayPal error" });
  }
});

// POST /payments/paypal/capture-order
router.post("/payments/paypal/capture-order", async (req, res): Promise<void> => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    res.status(500).json({ error: "PayPal is not configured" });
    return;
  }

  try {
    const { paypalOrderId } = req.body;
    if (!paypalOrderId) {
      res.status(400).json({ error: "paypalOrderId required" });
      return;
    }

    const accessToken = await getAccessToken();

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const capture = await captureRes.json() as any;

    if (!captureRes.ok) {
      console.error("PayPal capture error:", capture);
      res.status(400).json({ error: capture.message || "Capture failed" });
      return;
    }

    const status = capture.status; // "COMPLETED"
    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    res.json({
      success: status === "COMPLETED",
      status,
      captureId,
      paypalOrderId,
    });
  } catch (err: any) {
    console.error("PayPal capture error:", err);
    res.status(500).json({ error: err.message || "Capture error" });
  }
});

export default router;
