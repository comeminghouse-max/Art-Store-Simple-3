import { X, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/context/cart-context";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, total } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background z-[70] flex flex-col transition-transform duration-400 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div>
            <h2 className="font-serif text-2xl">Your Cart</h2>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
              {items.length === 0 ? "Empty" : `${items.length} item${items.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={closeCart}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={20} strokeWidth={1} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag size={48} strokeWidth={0.75} className="text-muted-foreground/40" />
              <p className="text-muted-foreground font-light">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-0.5"
              >
                Continue browsing
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.artworkId} className="flex gap-4 items-start">
                  <div className="w-20 h-20 bg-muted flex-shrink-0 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg leading-tight">{item.title}</h3>
                    <p className="text-muted-foreground text-xs mt-1">{item.medium}</p>
                    <p className="text-sm font-medium mt-2">${item.price.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.artworkId)}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-1"
                    title="Remove"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-8 py-6 border-t border-border space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="font-serif text-2xl">${total.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground font-light">
              Original paintings are one-of-a-kind. Your order will be confirmed personally by the artist.
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full py-4 px-6 bg-foreground text-background text-center text-sm uppercase tracking-widest font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-3 group"
            >
              Proceed to Checkout
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
