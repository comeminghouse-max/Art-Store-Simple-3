import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { Skeleton } from "@/components/ui/skeleton";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function FrameDetail() {
  const [, params] = useRoute("/frame/:id");
  const frameId = params?.id ? parseInt(params.id) : 0;
  const { addToCart, openCart } = useCart();
  
  const [size, setSize] = useState<"A5" | "A4" | "A3">("A4");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Lấy dữ liệu khung tranh
  const { data: frames, isLoading } = useQuery({
    queryKey: ["frames"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/frames`);
      return res.json();
    }
  });

  const frame = frames?.find((f: any) => f.id === frameId);

  if (isLoading) return <div className="min-h-screen pt-32 px-6 container mx-auto"><Skeleton className="w-full h-[60vh]" /></div>;
  if (!frame) return <div className="min-h-screen pt-32 px-6 container mx-auto font-serif text-2xl">Frame not found.</div>;

  // Cấu hình hiển thị các kích thước
  const sizes = [
    { id: "A5", label: "A5", dims: "5.8 × 8.3\"", price: frame.priceA5 },
    { id: "A4", label: "A4", dims: "8.3 × 11.7\"", price: frame.priceA4 },
    { id: "A3", label: "A3", dims: "11.7 × 16.5\"", price: frame.priceA3 },
  ] as const;

  const currentSizeObj = sizes.find(s => s.id === size)!;

  const handleAddToCart = () => {
    addToCart({
      artworkId: parseInt(`99${frame.id}${size === "A5" ? 5 : size === "A4" ? 4 : 3}`),
      title: `${frame.name} (${size})`,
      price: currentSizeObj.price,
      imageUrl: frame.imageUrl,
      type: "frame",
      material: frame.material,
      quantity: quantity
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <Link href="/frames" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12">
          <ArrowLeft size={14} strokeWidth={1.5} /> Back to Frames
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Cột trái: Hình ảnh */}
          <div className="bg-muted aspect-[3/4] relative animate-in fade-in slide-in-from-bottom-8 duration-700 md:sticky md:top-32">
            <img src={frame.imageUrl} alt={frame.name} className="w-full h-full object-cover" />
          </div>
          
          {/* Cột phải: Thông tin & Đặt hàng */}
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Frame</p>
            <h1 className="font-serif text-4xl md:text-5xl mb-6">{frame.name}</h1>
            
            <p className="font-serif text-2xl mb-10 flex items-center gap-3">
              ${currentSizeObj.price.toLocaleString()}
              <span className="text-sm font-sans text-muted-foreground tracking-wide font-normal">
                — {currentSizeObj.label} ({currentSizeObj.dims})
              </span>
            </p>

            {/* Chọn Size (Dạng Grid) */}
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Select Size</p>
              <div className="grid grid-cols-3 gap-3">
                {sizes.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSize(s.id)}
                    className={`flex flex-col items-center justify-center p-4 border transition-colors ${
                      size === s.id 
                        ? 'bg-foreground text-background border-foreground' 
                        : 'border-border/60 text-muted-foreground hover:border-foreground/50'
                    }`}
                  >
                    <span className="font-medium text-sm">{s.label}</span>
                    <span className="text-[10px] opacity-70 mb-1">{s.dims}</span>
                    <span className="font-medium text-sm">${s.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bảng chi tiết (Đã xóa Year, Edition, Status) */}
            <div className="space-y-3 mb-10 pt-8 border-t border-border">
              <div className="flex justify-between text-sm py-2">
                <span className="text-muted-foreground">Medium</span>
                <span className="font-medium text-right">{frame.material}</span>
              </div>
            </div>

            {/* Chọn Số lượng */}
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quantity</p>
              <div className="flex items-center border border-border/60 w-32">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex-1 py-3 flex justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex-1 py-3 flex justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="space-y-3">
              <button 
                onClick={handleAddToCart} 
                disabled={!frame.available}
                className="w-full py-4 px-6 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-3"
              >
                <ShoppingBag size={16} />
                {added ? "Added to Cart" : "Add to Cart"}
              </button>
              
              <Link 
                href="/contact" 
                className="w-full py-4 px-6 border border-border/60 text-center text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/60 transition-colors flex justify-center items-center gap-3 group"
              >
                Inquire Directly
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
              </Link>
            </div>
            
            {!frame.available && (
              <p className="text-red-500 text-sm mt-4 text-center">Currently out of stock.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}