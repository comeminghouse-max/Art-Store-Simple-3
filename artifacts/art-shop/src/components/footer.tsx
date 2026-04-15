import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-24 mt-32">
      <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <Link href="/" className="font-serif text-3xl tracking-tight text-background">
            STUDIO
          </Link>
          <p className="mt-6 text-background/60 max-w-sm font-light leading-relaxed">
            An intimate collection of original contemporary artwork, direct from the artist's studio to your home.
          </p>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-widest text-background/40 font-semibold mb-6">Navigation</h4>
          <ul className="space-y-4 text-sm text-background/80">
            <li>
              <Link href="/gallery" className="hover:text-background transition-colors">All Artworks</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-background transition-colors">The Artist</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-background transition-colors">Inquiries</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-background/40 font-semibold mb-6">Connect</h4>
          <ul className="space-y-4 text-sm text-background/80">
            <li>
              <a href="#" className="hover:text-background transition-colors">Instagram</a>
            </li>
            <li>
              <a href="#" className="hover:text-background transition-colors">Pinterest</a>
            </li>
            <li>
              <a href="#" className="hover:text-background transition-colors">Newsletter</a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-6 md:px-12 mt-24 pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between text-xs text-background/40">
        <p>&copy; {new Date().getFullYear()} Studio. All rights reserved.</p>
        <p className="mt-2 md:mt-0">Design by Art Shop</p>
      </div>
    </footer>
  );
}
