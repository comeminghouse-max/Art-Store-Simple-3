import { X, Trash2, ArrowRight, ArrowLeft, ShoppingBag, Minus, Plus } from "lucide-react";
import { Link } from "wouter";
import { useCart, type CartItem } from "@/context/cart-context";

// Nhận diện Print
function isPrintItem(item: CartItem): boolean {
  if (item.medium?.toLowerCase().includes("fine art print")) return true;
  if (item.medium?.toLowerCase().includes("giclée") || item.medium?.toLowerCase().includes("giclee")) return true;
  if (/\((A5|A4|A3)\)/.test(item.title)) return true;
  return false;
}

// Nhận diện Khung tranh
function isFrameItem(item: CartItem): boolean {
  const anyItem = item as any;
  if (anyItem.type === "frame" || anyItem.category === "frame") return true;
  if (anyItem.material) return true; // Có chất liệu -> Khung
  if (!item.medium) return true; // Tranh luôn có medium, không có -> Khung
  return false;
}

function parsePrintInfo(item: CartItem): { size: string; dims: string } {
  // Thử parse từ medium: "Fine Art Print — A4 (8.3 × 11.7")"
  const mediumMatch = item.medium?.match(/—\s*(\w+)\s*\(([^)]+)\)/);
  if (mediumMatch) return { size: mediumMatch[1], dims: mediumMatch[2] };
  // Fallback: lấy size từ title "(A5)"
  const titleMatch = item.title?.match(/\((A5|A4|A3)\)/);
  if (titleMatch) return { size: titleMatch[1], dims: "" };
  return { size: "", dims: "" };
}

function safePrice(price: any): number {
  const n = Number(price);
  return isNaN(n) ? 0 : n;
}

function CartItemRow({ item, onRemove, onQtyChange }: {
  item: CartItem;
  onRemove: () => void;
  onQtyChange: (qty: number) => void;
}) {
  const isFrame = isFrameItem(item);
  const isPrint = !isFrame && isPrintItem(item);
  const printInfo = isPrint ? parsePrintInfo(item) : null;
  const unitPrice = safePrice(item.price);
  const qty = Math.max(1, Number(item.quantity) || 1);
  const lineTotal = unitPrice * qty;

  return (
    <li className="flex gap-4 items-start">
      <div className="w-20 h-20 bg-muted flex-shrink-0 overflow-hidden">
        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        {/* Tên — bỏ phần "(A5)" trong title nếu có */}
        <h3 className="font-serif text-base leading-tight">
          {item.title.replace(/\s*\((A5|A4|A3)\)/, "")}
        </h3>

        {isFrame ? (
          <p className="text-muted-foreground text-xs mt-1">{(item as any).material || "Khung tranh / Frame"}</p>
        ) : isPrint && printInfo ? (
          <>
            <p className="text-muted-foreground text-xs mt-1">Fine Art Print</p>
            {printInfo.size && (
              <p className="text-muted-foreground text-xs">
                {printInfo.size}{printInfo.dims ? ` (${printInfo.dims})` : ""}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-xs mt-1">{item.medium}</p>
        )}

        {/* Quantity + giá */}
        <div className="flex items-center gap-3 mt-2">
          {isPrint || isFrame ? (
            <div className="flex items-center border border-border">
              <button onClick={() => onQtyChange(qty - 1)}
                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Minus size={12} strokeWidth={1.5} />
              </button>
              <span className="w-7 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => onQtyChange(qty + 1)}
                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={12} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Qty: 1</span>
          )}
          <span className="text-sm font-medium">
            ${lineTotal.toLocaleString()}
          </span>
        </div>
      </div>
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-1" title="Remove">
        <Trash2 size={14} strokeWidth={1.5} />
      </button>
    </li>
  );
}

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total } = useCart();

  const frames = items.filter(i => isFrameItem(i));
  const prints = items.filter(i => !isFrameItem(i) && isPrintItem(i));
  const originals = items.filter(i => !isFrameItem(i) && !isPrintItem(i));

  const hasOriginals = originals.length > 0;
  const hasPrints = prints.length > 0;
  const hasFrames = frames.length > 0;
  
  // Chỉ hiển thị các tiêu đề phân loại nếu trong giỏ có nhiều hơn 1 loại mặt hàng
  const showHeaders = (hasOriginals ? 1 : 0) + (hasPrints ? 1 : 0) + (hasFrames ? 1 : 0) > 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background z-[70] flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ transition: "transform 350ms cubic-bezier(0.4,0,0.2,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div>
            <h2 className="font-serif text-2xl">Your Cart</h2>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
              {items.length === 0 ? "Empty" : `${items.length} item${items.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button onClick={closeCart} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X size={20} strokeWidth={1} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag size={48} strokeWidth={0.75} className="text-muted-foreground/40" />
              <p className="text-muted-foreground font-light">Your cart is empty</p>
              <button onClick={closeCart} className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-0.5">
                Continue browsing
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Originals */}
              {hasOriginals && (
                <div>
                  {showHeaders && <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 pb-2 border-b border-border/50">Original Artworks</p>}
                  <ul className="space-y-6">
                    {originals.map(item => (
                      <CartItemRow key={item.artworkId} item={item}
                        onRemove={() => removeItem(item.artworkId)}
                        onQtyChange={qty => updateQuantity(item.artworkId, qty)} />
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground font-light mt-5 leading-relaxed border-t border-border/30 pt-4">
                    Original paintings are one-of-a-kind. Your order will be confirmed personally by the artist.
                  </p>
                </div>
              )}

              {/* Prints */}
              {hasPrints && (
                <div>
                  {showHeaders && <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 pb-2 border-b border-border/50">Fine Art Prints</p>}
                  <ul className="space-y-6">
                    {prints.map(item => (
                      <CartItemRow key={item.artworkId} item={item}
                        onRemove={() => removeItem(item.artworkId)}
                        onQtyChange={qty => updateQuantity(item.artworkId, qty)} />
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground font-light mt-5 leading-relaxed border-t border-border/30 pt-4">
                    Each print is produced on archival materials, signed and numbered in a limited edition.
                  </p>
                </div>
              )}

              {/* Frames */}
              {hasFrames && (
                <div>
                  {showHeaders && <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 pb-2 border-b border-border/50">Frames</p>}
                  <ul className="space-y-6">
                    {frames.map(item => (
                      <CartItemRow key={item.artworkId} item={item}
                        onRemove={() => removeItem(item.artworkId)}
                        onQtyChange={qty => updateQuantity(item.artworkId, qty)} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-8 py-6 border-t border-border space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="font-serif text-2xl">${safePrice(total).toLocaleString()}</span>
            </div>
            <Link href="/checkout" onClick={closeCart}
              className="w-full py-4 px-6 bg-foreground text-background text-center text-sm uppercase tracking-widest font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-3 group">
              Proceed to Checkout
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
            </Link>
            <button onClick={() => { closeCart(); window.history.back(); }}
              className="w-full py-3 px-6 border border-border text-center text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-3 group">
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" strokeWidth={1} />
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}