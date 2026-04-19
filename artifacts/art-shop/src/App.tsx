import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/context/cart-context";
import { CartDrawer } from "@/components/cart-drawer";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Gallery from "@/pages/gallery";
import GalleryOriginal from "@/pages/gallery-original";
import GalleryCommission from "@/pages/gallery-commission";
import GalleryPrint from "@/pages/gallery-print";
import ArtworkDetail from "@/pages/artwork-detail";
import Contact from "@/pages/contact";
import Checkout from "@/pages/checkout";
import Shipping from "@/pages/shipping";
import Frames from "@/pages/frames"; // Thêm dòng này để gọi file frames
import Admin from "@/pages/admin";
import FrameDetail from "@/pages/frame-detail";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center pt-24 pb-16 px-6">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </main>
  );
}

function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center pt-24 pb-16 px-6">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </main>
  );
}

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  if (isAdmin) {
    return (
      <Switch>
        <Route path="/admin" component={Admin} />
      </Switch>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <CartDrawer />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/gallery/original" component={GalleryOriginal} />
          <Route path="/gallery/commission" component={GalleryCommission} />
          <Route path="/gallery/print" component={GalleryPrint} />
          <Route path="/artwork/:id" component={ArtworkDetail} />
          <Route path="/contact" component={Contact} />
          <Route path="/shipping" component={Shipping} />
          <Route path="/frames" component={Frames} /> {/* Thêm route cho frames */}
<Route path="/frame/:id" component={FrameDetail} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <CartProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </CartProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;