import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Frames() {
  const { data: frames, isLoading } = useQuery({
    queryKey: ["frames"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/frames`);
      if (!res.ok) throw new Error("Failed to fetch frames");
      return res.json();
    }
  });

  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <div className="container mx-auto">
        <header className="mb-16 md:mb-24 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="font-serif text-4xl md:text-5xl mb-6">Frames</h1>
          <p className="text-muted-foreground font-light leading-relaxed">
            Handcrafted frames to complement your artwork.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full aspect-[3/4] rounded-none" />
                <Skeleton className="w-2/3 h-6" />
                <Skeleton className="w-1/3 h-4" />
              </div>
            ))
          ) : frames?.map((frame: any, i: number) => {
            const minPrice = Math.min(frame.priceA5, frame.priceA4, frame.priceA3);
            return (
              <Link key={frame.id} href={`/frame/${frame.id}`} className="group block">
                <div 
                  className="relative overflow-hidden bg-muted aspect-[3/4] animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" 
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <img 
                    src={frame.imageUrl} 
                    alt={frame.name} 
                    className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105" 
                  />
                  {!frame.available && (
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-5 py-2 text-sm uppercase tracking-widest font-medium">
                      Sold Out
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
                </div>
                <div className="mt-6 flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl group-hover:italic transition-all duration-300 truncate">
                      {frame.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">{frame.material}</p>
                  </div>
                  <p className="text-sm font-medium tracking-wide flex-shrink-0">
                    From ${minPrice.toLocaleString()}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        
        {frames?.length === 0 && !isLoading && (
          <p className="text-muted-foreground italic text-center col-span-full">
            No frames available at the moment.
          </p>
        )}
      </div>
     {/* --- Phần ghi chú Custom Size (Đã thiết kế lại) --- */}
        <div className="mt-32 mb-16 max-w-4xl mx-auto px-6">
          <div className="relative overflow-hidden border border-border/60 bg-muted/10 px-6 py-16 md:py-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center justify-center">
            
            <h3 className="font-serif text-3xl md:text-4xl mb-4 text-foreground tracking-wide">
            Custom Dimension
            </h3>
            
            <p className="text-muted-foreground text-xs md:text-sm tracking-widest uppercase mb-10 max-w-lg mx-auto leading-relaxed">
              We offer bespoke framing options tailored to your specific artwork.
            </p>
            
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center px-10 py-4 bg-foreground text-background text-xs font-medium uppercase tracking-[0.2em] hover:bg-foreground/90 transition-all duration-300"
            >
              Contact Us
            </Link>
            
          </div>
        </div>
        {/* --- Kết thúc phần ghi chú --- */}
    </main>
  );
}