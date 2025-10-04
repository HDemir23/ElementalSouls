import type { Metadata } from "next";
import "@/styles/globals.css";
import { ConnectButton } from "@/components/ConnectButton.jsx";
import { Providers } from "@/app/providers.js";
import { cn } from "@/lib/utils.js";

export const metadata: Metadata = {
  title: "ElementalSouls Portal",
  description: "Mint, evolve, and manage your ElementalSouls collection.",
};

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div
    className={cn(
      "min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50"
    )}
  >
    <header className="border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            ElementalSouls
          </p>
          <h1 className="text-xl font-bold">Evolution Gateway</h1>
        </div>
        <ConnectButton />
      </div>
    </header>
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      {children}
    </main>
  </div>
);

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body>
      <Providers>
        <Shell>{children}</Shell>
      </Providers>
    </body>
  </html>
);

export default RootLayout;
