import Link from "next/link";
import Image from "next/image";


export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative">
      {/* Subtle radial glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="h-[480px] w-[480px] rounded-full opacity-10 blur-3xl"
          style={{ background: "hsl(var(--primary-light))" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Logo */}
        <Image
          src="/logo-squircle.png"
          alt="vaultkey"
          width={90}
          height={90}
        />

        {/* 404 display */}
        <div className="relative mb-6 select-none">
          <span
            className="text-[120px] font-black leading-none tabular-nums"
            style={{
              color: "transparent",
              WebkitTextStroke: "1.5px hsl(var(--border))",
              letterSpacing: "-4px",
            }}
          >
            404
          </span>
          {/* Teal accent line under the number */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0 h-px w-20 opacity-60"
            style={{ background: "hsl(var(--primary-light))" }}
          />
        </div>

        <h1 className="text-lg font-semibold text-foreground mb-2">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or was moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}