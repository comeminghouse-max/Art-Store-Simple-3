import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Initial Consultation",
    description:
      "We begin with a conversation about your vision — the subject, mood, size, and where the piece will live.",
  },
  {
    number: "02",
    title: "Concept & Quote",
    description:
      "Within a few days, I'll share initial sketches and a detailed quote based on the scope of work.",
  },
  {
    number: "03",
    title: "Creation",
    description:
      "Once approved, I'll begin painting. Progress photos are shared throughout the process.",
  },
  {
    number: "04",
    title: "Delivery",
    description:
      "The finished work is carefully packaged and shipped directly to you, with a certificate of authenticity.",
  },
];

export default function GalleryCommission() {
  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Gallery</p>
          <h1 className="font-serif text-4xl md:text-5xl mb-6">Commission</h1>
          <p className="text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
            A commissioned painting is made entirely for you — your subject, your space, your story. 
            Each commission is a collaboration between artist and collector.
          </p>
        </header>

        {/* Steps */}
        <section className="mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <h2 className="font-serif text-2xl mb-12 text-center">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-6">
                <span className="font-serif text-4xl text-muted-foreground/40 leading-none shrink-0">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-medium text-sm uppercase tracking-widest mb-2">{step.title}</h3>
                  <p className="text-muted-foreground font-light leading-relaxed text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing note */}
        <section className="mb-20 border border-border/50 p-8 md:p-12 text-center animate-in fade-in duration-700 delay-200 fill-mode-both">
          <h2 className="font-serif text-2xl mb-4">Pricing</h2>
          <p className="text-muted-foreground font-light leading-relaxed max-w-lg mx-auto">
            Commission prices start from <span className="text-foreground font-medium">$800</span> and 
            depend on size, medium, and complexity. A 50% deposit is required to begin.
          </p>
        </section>

        {/* CTA */}
        <div className="text-center animate-in fade-in duration-700 delay-300 fill-mode-both">
          <p className="text-muted-foreground mb-8 font-light">
            Ready to begin? Reach out and let's talk about your vision.
          </p>
          <Link
            href="/contact?subject=Commission%20Inquiry"
            className="group inline-flex items-center gap-3 text-sm uppercase tracking-widest font-medium border-b border-foreground pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-colors"
          >
            Start a Commission
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
          </Link>
        </div>
      </div>
    </main>
  );
}
