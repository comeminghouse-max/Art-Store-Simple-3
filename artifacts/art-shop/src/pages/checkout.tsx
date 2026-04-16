import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useUser } from "@clerk/react";
import { useCart } from "@/context/cart-context";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: user?.fullName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    address: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          items: items.map((i) => ({
            artworkId: i.artworkId,
            title: i.title,
            price: i.price,
            imageUrl: i.imageUrl,
          })),
          total,
          customerName: form.name,
          customerEmail: form.email,
          shippingAddress: form.address,
          notes: form.notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setOrderId(data.orderId);
      clearCart();
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !success) {
    return (
      <main className="min-h-screen pt-32 pb-24 px-6 md:px-12">
        <div className="container mx-auto max-w-lg text-center">
          <h1 className="font-serif text-4xl mb-6">Your cart is empty</h1>
          <Link href="/gallery/original" className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-0.5">
            Browse artworks
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CheckCircle size={56} strokeWidth={0.75} className="mx-auto mb-6 text-green-500" />
          <h1 className="font-serif text-4xl mb-4">Order Received</h1>
          <p className="text-muted-foreground font-light leading-relaxed mb-2">
            Thank you for your order #{orderId}. The artist will review your request and reach out personally to confirm the details.
          </p>
          <p className="text-muted-foreground text-sm mb-10">
            A confirmation will be sent to <span className="font-medium text-foreground">{form.email}</span>.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-0.5"
          >
            Return home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <div className="container mx-auto">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft size={16} strokeWidth={1} />
          Back to Gallery
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Order summary */}
          <div>
            <h2 className="font-serif text-3xl mb-8">Order Summary</h2>
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.artworkId} className="flex gap-5 items-start">
                  <div className="w-20 h-20 bg-muted flex-shrink-0 overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg">{item.title}</h3>
                    <p className="text-muted-foreground text-xs mt-1">{item.medium}</p>
                  </div>
                  <p className="font-medium text-sm flex-shrink-0">${item.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-border flex justify-between items-baseline">
              <span className="text-sm uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="font-serif text-3xl">${total.toLocaleString()}</span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Original artworks require personal confirmation from the artist. Payment instructions will be sent directly after your order is reviewed.
            </p>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="font-serif text-3xl mb-8">Your Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Shipping Address</label>
                <input
                  name="address"
                  type="text"
                  required
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
                  placeholder="Street, City, Country"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Notes (optional)</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                  placeholder="Any special requests or questions…"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
