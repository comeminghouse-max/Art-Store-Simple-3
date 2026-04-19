export default function ShippingPolicy() {
  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <div className="container mx-auto max-w-3xl">

        <header className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="font-serif text-4xl md:text-5xl mb-4">Shipping Policy</h1>
          <p className="text-muted-foreground font-light text-lg">
            Every artwork is packed and shipped with the greatest care.
          </p>
        </header>

        <div className="space-y-14 text-foreground/80 font-light leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">

          {/* Processing Time */}
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Processing Time</h2>
            <p>
              Each artwork is handled with the utmost care. For unframed orders, items are typically processed and prepared for shipment within 3–5 business days. If you purchase your artwork with a frame, please allow 6–8 business days for processing. This additional time ensures that your piece is perfectly framed and securely packed for safe transit.
            </p>
          </section>

          {/* Tracking */}
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Tracking & Notifications</h2>
            <ul className="space-y-3 mt-2">
              <li className="flex gap-3">
                <span className="text-foreground font-medium min-w-fit">Tracking Number</span>
                <span className="text-muted-foreground">— Every order includes a dedicated tracking number.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-foreground font-medium min-w-fit">Shipping Notification</span>
                <span className="text-muted-foreground">— Once your package is dispatched, you will receive a confirmation email containing the tracking number and a URL to monitor your delivery status in real-time.</span>
              </li>
            </ul>
          </section>

          {/* Carriers */}
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Shipping Carriers</h2>
            <p className="mb-4">We partner with leading global logistics providers to ensure safe and timely delivery:</p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-foreground font-medium min-w-fit">United States</span>
                <span className="text-muted-foreground">— DHL / FedEx</span>
              </li>
              <li className="flex gap-3">
                <span className="text-foreground font-medium min-w-fit">International</span>
                <span className="text-muted-foreground">— EMS (Express Mail Service) or DHL</span>
              </li>
            </ul>
          </section>

          {/* Delivery Time */}
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-2">Estimated Delivery Time</h2>
            <p className="text-muted-foreground text-sm mb-5 italic">Calculated after the processing period.</p>
            <div className="border border-border/60 divide-y divide-border/40">
              {[
               
                { region: "Asia", time: "3–7 business days" },
                { region: "United States", time: "3–7 business days" },
                { region: "Europe", time: "5–10 business days" },
                { region: "Other Regions", time: "7–14 business days" },
              ].map((row) => (
                <div key={row.region} className="flex justify-between px-5 py-4 text-sm">
                  <span className="text-foreground font-medium">{row.region}</span>
                  <span className="text-muted-foreground">{row.time}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground italic">
              Note: Delivery times may vary slightly due to local shipping conditions, seasonal peaks,
              or customs inspections in the destination country.
            </p>
          </section>

          {/* Packaging */}
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Our Packaging Process</h2>
            <p className="mb-5">
              We take extraordinary measures to ensure your artwork arrives in pristine condition.
              Our 5-layer protection includes:
            </p>
            <ol className="space-y-4">
              {[
                { label: "Primary Protection", desc: "Wrapping the artwork/frame in high-grade cushioning materials." },
                { label: "Inner Box", desc: "Placing the piece into the first reinforced protective box." },
                { label: "Outer Box", desc: "Adding a second heavy-duty protective box for structural integrity." },
                { label: "Weatherproofing", desc: "Completely sealing the exterior with a waterproof wrap." },
                { label: "Final Security", desc: "Filling any remaining gaps with shock-absorbent materials." },
              ].map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="font-serif text-2xl text-foreground/20 leading-none w-6 shrink-0">{i + 1}</span>
                  <div>
                    <span className="font-medium text-foreground">{step.label}: </span>
                    <span className="text-muted-foreground">{step.desc}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Insurance */}
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Shipping Insurance</h2>
            <p>
              Your peace of mind is our priority. All shipments are fully insured. In the unlikely event
              of damage or loss during transit, the full product price is covered.
            </p>
          </section>

          {/* Customs */}
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Customs Duties & Import Taxes</h2>
            <ul className="space-y-3 list-disc list-inside text-muted-foreground">
              <li>International shipments may be subject to customs duties, import taxes, or VAT depending on the laws of the destination country.</li>
              <li>These charges are not included in the shipping cost and are the sole responsibility of the customer.</li>
              <li>Since customs policies vary widely, we recommend contacting your local customs office for specific details.</li>
            </ul>
          </section>

          {/* Address Changes */}
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">Address Changes</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-foreground font-medium min-w-fit">Before Shipment</span>
                <span className="text-muted-foreground">— If you need to change your delivery address, please contact us immediately.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-foreground font-medium min-w-fit">After Shipment</span>
                <span className="text-muted-foreground">— Once the package has been handed over to the carrier, we are unable to redirect it. Please ensure all details are correct at checkout.</span>
              </li>
            </ul>
          </section>

          {/* Inquiries */}
          <section className="pt-4 border-t border-border">
            <h2 className="font-serif text-2xl text-foreground mb-4">Shipping Inquiries</h2>
            <p className="text-muted-foreground">
              For questions regarding your delivery status or specific shipping requirements, please{" "}
              <a href="/contact" className="text-foreground border-b border-foreground hover:text-muted-foreground hover:border-muted-foreground transition-colors">
                contact our support team
              </a>{" "}
              or your local carrier office.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
