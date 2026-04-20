import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, Loader2, Tag, X, Minus, Plus, Trash2 } from "lucide-react";
import { useUser } from "@clerk/react";
import { useCart } from "@/context/cart-context";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";

function safeNum(v: any): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function BarLoader({ visible }: { visible: boolean }) {
  return (
    <div style={{
      position:"fixed",inset:0,zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",
      backgroundColor:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",
      opacity:visible?1:0,pointerEvents:visible?"all":"none",transition:"opacity 0.2s ease-out",
    }}>
      <style>{`
        @keyframes barBounce{0%,100%{transform:scaleY(0.25);opacity:0.35}50%{transform:scaleY(1);opacity:1}}
        .pp-bar{width:7px;height:44px;border-radius:4px;background:#e8d5b0;transform-origin:bottom;animation:barBounce 1.1s ease-in-out infinite;}
        .pp-bar:nth-child(1){animation-delay:0s}.pp-bar:nth-child(2){animation-delay:.15s}
        .pp-bar:nth-child(3){animation-delay:.30s}.pp-bar:nth-child(4){animation-delay:.45s}
        .pp-bar:nth-child(5){animation-delay:.60s}
      `}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"20px"}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:"6px"}}>
          <div className="pp-bar"/><div className="pp-bar"/><div className="pp-bar"/>
          <div className="pp-bar"/><div className="pp-bar"/>
        </div>
        <p style={{fontSize:"11px",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,0.55)"}}>Loading payment…</p>
      </div>
    </div>
  );
}

function usePayPalScript(clientId: string) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!clientId) return;
    if ((window as any).paypal) { setLoaded(true); return; }
    const script = document.createElement("script");
    // FIX 1: thêm locale=en_US để hiển thị tiếng Anh
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons&enable-funding=card&disable-funding=venmo,paylater&locale=en_US`;
    script.setAttribute("data-namespace","paypal_sdk");
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setFailed(true);
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [clientId]);
  return { loaded, failed };
}

export default function Checkout() {
  const { items, total, clearCart, pendingOrderId, setPendingOrderId, removeItem, updateQuantity } = useCart();
  const { user } = useUser();
  const { loaded: paypalLoaded, failed: paypalFailed } = usePayPalScript(PAYPAL_CLIENT_ID);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);
  const loaderTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const [step, setStep] = useState<"details"|"payment"|"success">("details");
  const [loading, setLoading] = useState(false);
  const [ppLoading, setPpLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number|null>(pendingOrderId);
  const [payerEmail, setPayerEmail] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string; discount: number; discountType: string; discountValue: number; finalTotal: number;
  }|null>(null);

  const [form, setForm] = useState({
    name: user?.fullName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    address: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const safeTotal = safeNum(total);
  const finalTotal = appliedCoupon ? appliedCoupon.finalTotal : safeTotal;

  const stopLoader = () => {
    setPpLoading(false);
    if (loaderTimerRef.current) { clearTimeout(loaderTimerRef.current); loaderTimerRef.current = null; }
  };
  const startLoader = () => {
    setPpLoading(true);
    if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
    loaderTimerRef.current = setTimeout(() => { setPpLoading(false); loaderTimerRef.current = null; }, 2000);
  };
  useEffect(() => () => { if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current); }, []);

  // ── Coupon ────────────────────────────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponCode.trim()) { setCouponError("Please enter a discount code"); return; }
    setCouponLoading(true); setCouponError("");
    try {
      const res = await fetch(`${API}/api/coupons/validate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), total: safeTotal }),
      });
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error || "Invalid discount code"); return; }
      setAppliedCoupon({ code:data.code, discount:data.discount, discountType:data.discountType, discountValue:data.discountValue, finalTotal:data.finalTotal });
      setCouponCode("");
    } catch { setCouponError("Could not connect to server"); }
    finally { setCouponLoading(false); }
  };
  const removeCoupon = () => { setAppliedCoupon(null); setCouponError(""); setCouponCode(""); };

  // ── Tạo order ─────────────────────────────────────────────────────────────
  const createOrder = async () => {
    const orderItems = items.map(i => ({
      artworkId: i.artworkId,
      title: i.title,
      price: safeNum(i.price),
      imageUrl: i.imageUrl,
      medium: i.medium,
      quantity: safeNum(i.quantity) || 1,
    }));

    const res = await fetch(`${API}/api/orders`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.id,
        items: orderItems,
        total: finalTotal,
        customerName: form.name, customerEmail: form.email,
        shippingAddress: form.address, notes: form.notes || undefined,
      }),
    });
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error("API server error.");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Order creation failed");
    return data.orderId as number;
  };

  const deductPrintStock = async () => {
    const printItems = items.filter(i =>
      i.medium?.toLowerCase().includes("fine art print") ||
      i.medium?.toLowerCase().includes("giclée") ||
      i.medium?.toLowerCase().includes("giclee")
    );
    for (const item of printItems) {
      const realId = Math.floor(item.artworkId / 10);
      try {
        await fetch(`${API}/api/artworks/${realId}/sell`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: safeNum(item.quantity) || 1 }),
        });
      } catch (err) { console.error("Deduct stock error:", err); }
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.address) { setError("Please fill in all required fields."); return; }
    setLoading(true); setError("");
    try {
      const newOrderId = await createOrder();
      setOrderId(newOrderId);
      setPendingOrderId(newOrderId);
      setStep("payment");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  // ── PayPal ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "payment" || !paypalLoaded || !orderId || paypalRendered.current) return;
    if (!paypalContainerRef.current) return;
    const paypal = (window as any).paypal_sdk || (window as any).paypal;
    if (!paypal) return;
    paypalRendered.current = true;

    paypal.Buttons({
      // FIX 2: dùng label:"paypal" để logo hiển thị đúng, không bị đè chữ
      style: { layout:"vertical", color:"gold", shape:"rect", label:"paypal", height:48, tagline:false },

      onClick: (_data: any, actions: any) => { startLoader(); return actions.resolve(); },

      createOrder: async () => {
        const res = await fetch(`${API}/api/payments/paypal/create-order`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(i => ({ title:i.title, price:safeNum(i.price), quantity:safeNum(i.quantity)||1 })),
            total: finalTotal, orderId,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.paypalOrderId) { stopLoader(); throw new Error(data.error || "PayPal order failed"); }
        return data.paypalOrderId;
      },

      onApprove: async (data: any) => {
        stopLoader(); setPpLoading(true); setError("");
        try {
          // 1. Capture
          const res = await fetch(`${API}/api/payments/paypal/capture-order`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paypalOrderId: data.orderID }),
          });
          const result = await res.json();
          if (!res.ok || !result.success) throw new Error(result.error || "Capture failed");

          // 2. Update status + paypalOrderId
          await fetch(`${API}/api/orders/${orderId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status:"paid", paypalOrderId:data.orderID }),
          });

          // 3. Trừ kho Print
          await deductPrintStock();

          // 4. Trừ lượt coupon
          if (appliedCoupon) {
            await fetch(`${API}/api/coupons/use`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: appliedCoupon.code }),
            });
          }

          setPayerEmail(form.email);
          clearCart();
          setPpLoading(false);
          setStep("success");
        } catch (err: any) {
          setPpLoading(false);
          setError(err.message || "Payment failed. Please try again.");
        }
      },

      onError: (err: any) => { console.error("PayPal error:",err); stopLoader(); setError("PayPal encountered an error."); },
      onCancel: () => { stopLoader(); setError("Payment was cancelled. You can try again below."); },
    }).render(paypalContainerRef.current).catch((err: any) => {
      console.error("PayPal render error:",err); stopLoader();
      setError("Could not load PayPal. Please refresh and try again.");
    });
  }, [step, paypalLoaded, orderId]);

  useEffect(() => { if (paypalFailed) { stopLoader(); setError("Could not load PayPal SDK."); } }, [paypalFailed]);

  // ── Empty cart ────────────────────────────────────────────────────────────
  if (items.length === 0 && step !== "success") {
    return (
      <main className="min-h-screen pt-32 pb-24 px-6 md:px-12">
        <div className="container mx-auto max-w-lg text-center">
          <h1 className="font-serif text-4xl mb-6">Your cart is empty</h1>
          <Link href="/gallery" className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-0.5">Browse artworks</Link>
        </div>
      </main>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CheckCircle size={56} strokeWidth={0.75} className="mx-auto mb-6 text-green-500" />
          <h1 className="font-serif text-4xl mb-4">Payment Successful!</h1>
          <p className="text-muted-foreground font-light mb-2">Thank you for your order.</p>
          {appliedCoupon && <p className="text-green-400 text-sm mb-2">Applied code {appliedCoupon.code} — saved ${appliedCoupon.discount.toLocaleString()}</p>}
          <p className="text-muted-foreground text-sm mb-10">Confirmation sent to <span className="font-medium text-foreground">{payerEmail||form.email}</span></p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-0.5">Return home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <BarLoader visible={ppLoading} />
      <div className="container mx-auto">
        <Link href="/gallery" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12">
          <ArrowLeft size={16} strokeWidth={1} /> Back to Gallery
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Order Summary */}
          <div>
            <h2 className="font-serif text-3xl mb-8">Order Summary</h2>
            <div className="space-y-6">
              {items.map(item => {
                const price = safeNum(item.price);
                const qty = safeNum(item.quantity) || 1;
                return (
                  <div key={item.artworkId} className="flex gap-5 items-start">
                    <div className="w-20 h-20 bg-muted flex-shrink-0 overflow-hidden">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-lg">{item.title.replace(/\s*\((A5|A4|A3)\)/,"")}</h3>
                      <p className="text-muted-foreground text-xs mt-1">{item.medium}</p>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.artworkId, qty - 1)}
                          disabled={qty <= 1}
                          className="w-6 h-6 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30">
                          <Minus size={10} />
                        </button>
                        <span className="text-sm w-5 text-center">{qty}</span>
                        <button onClick={() => updateQuantity(item.artworkId, qty + 1)}
                          className="w-6 h-6 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-medium text-sm">${(price*qty).toLocaleString()}</p>
                      <button onClick={() => removeItem(item.artworkId)}
                        className="text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="mt-8 pt-6 border-t border-border space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>${safeTotal.toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-400">
                  <span className="flex items-center gap-1.5"><Tag size={13}/> Discount ({appliedCoupon.code}{appliedCoupon.discountType==="percent"?` −${appliedCoupon.discountValue}%`:""})</span>
                  <span>−${appliedCoupon.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-border">
                <span className="text-sm uppercase tracking-widest text-muted-foreground">Total</span>
                <span className="font-serif text-3xl">${finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">Payment processed securely via PayPal.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[{label:"PayPal",cls:"text-blue-500 border-blue-500/30"},{label:"VISA",cls:"text-blue-400 border-blue-400/30"},{label:"Mastercard",cls:"text-red-500 border-red-500/30"},{label:"Amex",cls:"text-blue-300 border-blue-300/30"}]
                .map(c=><span key={c.label} className={`text-[10px] border px-1.5 py-0.5 ${c.cls}`}>{c.label}</span>)}
            </div>
          </div>

          {/* Form / Payment */}
          <div>
            {step === "details" && (
              <>
                <h2 className="font-serif text-3xl mb-8">Your Details</h2>
                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                  {[
                    {label:"Full Name *",name:"name",type:"text",placeholder:"Your full name"},
                    {label:"Email Address *",name:"email",type:"email",placeholder:"your@email.com"},
                    {label:"Shipping Address *",name:"address",type:"text",placeholder:"Street, City, Country"},
                  ].map(f=>(
                    <div key={f.name} className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">{f.label}</label>
                      <input name={f.name} type={f.type} required={f.label.includes("*")}
                        value={(form as any)[f.name]} onChange={handleChange} placeholder={f.placeholder}
                        className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors" />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Notes (optional)</label>
                    <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                      className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                      placeholder="Any special requests…" />
                  </div>

                  {/* Coupon */}
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Discount Code</label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between border border-green-500/30 bg-green-500/5 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Tag size={15} className="text-green-400 flex-shrink-0" />
                          <div>
                            <p className="text-green-400 text-sm font-medium">{appliedCoupon.code}</p>
                            <p className="text-green-400/70 text-xs">Save {appliedCoupon.discountType==="percent"?`${appliedCoupon.discountValue}%`:`$${appliedCoupon.discountValue}`} · You save ${appliedCoupon.discount.toLocaleString()}</p>
                          </div>
                        </div>
                        <button type="button" onClick={removeCoupon} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input type="text" value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setCouponError("");}}
                            onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),applyCoupon())}
                            placeholder="Enter code (e.g. DEAL30)"
                            className="flex-1 border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors tracking-widest uppercase" />
                          <button type="button" onClick={applyCoupon} disabled={couponLoading||!couponCode.trim()}
                            className="px-5 py-3 border border-border text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40 flex items-center gap-2">
                            {couponLoading?<Loader2 size={14} className="animate-spin"/>:null} Apply
                          </button>
                        </div>
                        {couponError && (
                          <p className={`text-xs px-3 py-2 border ${couponError.includes("Minimum") ? "text-amber-400 border-amber-500/30 bg-amber-500/5" : "text-red-400 border-red-500/30 bg-red-500/5"}`}>
                            {couponError.includes("Minimum") ? "⚠ " : "✕ "}{couponError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {error && <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 text-red-400 text-sm">{error}</div>}

                  <button type="submit" disabled={loading}
                    className="w-full py-4 px-6 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-3 disabled:opacity-60">
                    {loading?<><Loader2 size={16} className="animate-spin"/> Processing…</>:"Continue to Payment →"}
                  </button>
                </form>
              </>
            )}

            {step === "payment" && (
              <div>
                <h2 className="font-serif text-3xl mb-2">Payment</h2>
                <p className="text-muted-foreground text-sm mb-2">Order #{orderId}</p>
                <div className="mb-6 p-4 border border-border space-y-1.5">
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span className="flex items-center gap-1"><Tag size={12}/> {appliedCoupon.code}</span>
                      <span>−${appliedCoupon.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground uppercase tracking-widest">Total</span>
                    <span className="font-serif text-2xl">${finalTotal.toLocaleString()} USD</span>
                  </div>
                </div>

                {!paypalLoaded
                  ? <div className="flex items-center gap-3 text-muted-foreground py-8"><Loader2 size={20} className="animate-spin"/><span className="text-sm">Loading PayPal…</span></div>
                  : (
                    // FIX 3: thêm space-y-3 để tạo khoảng cách giữa các nút PayPal
                    <div ref={paypalContainerRef} className="min-h-[120px] [&_.paypal-buttons]:!gap-3 [&_.paypal-buttons-context-iframe]:!mb-3"/>
                  )
                }
                {error && <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 text-red-400 text-sm mt-4">{error}</div>}

                <button onClick={()=>{setStep("details");paypalRendered.current=false;setError("");stopLoader();}}
                  className="mt-6 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <ArrowLeft size={12}/> Edit details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
