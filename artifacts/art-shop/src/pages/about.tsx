import { Link } from "wouter";

export default function About() {
  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <div className="container mx-auto max-w-5xl">
        
        <header className="mb-16 md:mb-24 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="font-serif text-4xl md:text-5xl mb-6">About the Artist</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24 items-start">
          <div className="md:col-span-5 md:sticky md:top-32 animate-in fade-in slide-in-from-left-8 duration-700 delay-200 fill-mode-both">
            <img 
              src="/images/portrait-1.png" 
              alt="Portrait of the artist" 
              className="w-full aspect-[3/4] object-cover grayscale-[0.3]"
            />
            <div className="mt-6 text-sm text-muted-foreground text-center italic">
              Studio space, 2024.
            </div>
          </div>
          
          <div className="md:col-span-7 prose prose-lg dark:prose-invert font-light leading-relaxed animate-in fade-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both text-foreground/80">
            <p className="text-xl md:text-2xl font-serif text-foreground leading-snug mb-8">
              "I paint to capture the silent moments between memory and reality—the textures of places we've been and the emotional residue they leave behind."
            </p>
            
            <p>
              Based out of a quiet, light-filled studio, the work is born from a practice of deep observation. Rather than painting literal landscapes, the focus is on atmospheric abstraction. What does a specific quality of light feel like? How does the fog over a valley translate to the heavy drag of oil paint on canvas?
            </p>
            
            <p>
              The creative process is heavily physical. Large canvases are layered with oil paints, cold wax, and dry pigments, then scraped back, carved into, and rebuilt. This process of accumulation and excavation gives the work a sense of history—as if the painting itself has weathered time.
            </p>

            <h3 className="font-serif text-2xl text-foreground mt-12 mb-6">Exhibitions & Philosophy</h3>
            <p>
              The intention is not to overwhelm the viewer, but to invite them into a space of stillness. In a hyper-connected world, these paintings serve as anchors—objects that demand slow looking and quiet reflection.
            </p>
            <p>
              Select works have been shown in private collections globally. The gallery represented here is the primary source for acquiring new, original pieces directly from the studio.
            </p>

            <div className="mt-16 pt-8 border-t border-border">
              <Link 
                href="/contact"
                className="text-sm uppercase tracking-widest font-medium border-b border-foreground pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
