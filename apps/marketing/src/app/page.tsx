import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "~/components/SiteFooter";
import { Button } from "@vaultkey/ui/src/button";
import { TopNav } from "~/components/TopNav";
import { FeatureCard } from "~/components/FeatureCard";
import { FeatureCardPlain } from "~/components/FeatureCardPlain";
import { PricingCalculator } from "~/components/PricingCalculator";
import CodeExample from "~/components/CodeExample";

const APP_URL = "https://app.vaultkey.dev";
const DOCS_URL = "https://docs.vaultkey.dev";
const REPO = "vaultkey/vaultkey";
const REPO_URL = `https://github.com/${REPO}`;

export default function Page() {
  return (
    <main className="min-h-screen text-foreground bg-background">
      <TopNav />
      <Hero />
      <TrustedBy />
      <Features />
      <CodeExample />
      <Pricing />
      <About />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-mono text-primary">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Open source · EVM + Solana
          </span>
        </div>

        <h1 className="mt-4 text-center text-2xl sm:text-4xl font-semibold text-primary font-sans">
          Custodial wallet infrastructure for every developer
        </h1>
        <p className="mt-4 text-center text-base sm:text-lg font-sans max-w-2xl mx-auto">
          Create and manage wallets, sign transactions, and send stablecoins.{" "}
          <span className="text-primary font-normal">
            Pay only for what you use
          </span>{" "}
          — no seat fees, no hidden costs.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" className="px-6">
            <a href={APP_URL} target="_blank" rel="noopener noreferrer">
              Get started
            </a>
          </Button>
          <Button variant="outline" size="lg" className="px-6 gap-2">
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Read the docs
            </a>
          </Button>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Open source · Self-host ready · Free testnet tier
        </p>

        <div className="mt-32 mx-auto max-w-5xl">
          <div className="rounded-[18px] bg-primary/10 p-1 sm:p-1">
            <div className="rounded-2xl bg-primary/20 p-1 sm:p-1">
              <Image
                src="/hero-light.webp"
                alt="VaultKey dashboard"
                width={3456}
                height={1914}
                className="w-full h-auto rounded-xl block dark:hidden"
                sizes="(min-width: 1024px) 900px, 100vw"
                loading="eager"
                priority={false}
              />
              <Image
                src="/hero-dark.webp"
                alt="VaultKey dashboard"
                width={3456}
                height={1914}
                className="w-full h-auto rounded-xl hidden dark:block"
                sizes="(min-width: 1024px) 900px, 100vw"
                loading="eager"
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustedBy() {
  // Placeholder testimonials — replace with real ones when available
  const featured = [
    {
      quote:
        "VaultKey cut our wallet integration time from weeks to a single afternoon. The stablecoin transfer API is exactly the abstraction we needed.",
      author: "Marc Seitz",
      company: "papermark.com",
      image:
        "https://pbs.twimg.com/profile_images/1176854646343852032/iYnUXJ-m_400x400.jpg",
    },
    {
      quote:
        "Finally an open source custodial wallet layer that doesn't try to lock you in. The multi-chain support and KMS options made this an easy choice.",
      author: "Tommerty",
      company: "doras.to",
      image:
        "https://cdn.doras.to/doras/user/83bda65b-8d42-4011-9bf0-ab23402776f2-0.890688178917765.webp",
    },
  ];

  const quick = [
    {
      quote: "don't sleep on VaultKey",
      author: "shellscape",
      company: "jsx.email",
      image:
        "https://pbs.twimg.com/profile_images/1698447401781022720/b0DZSc_D_400x400.jpg",
    },
    {
      quote: "The testnet isolation is a killer feature for staging environments.",
      author: "Andras Bacsai",
      company: "coolify.io",
      image:
        "https://pbs.twimg.com/profile_images/1884210412524027905/jW4NB4rx_400x400.jpg",
    },
    {
      quote: "Webhook delivery + job polling. Perfect async model.",
      author: "VicVijayakumar",
      company: "onetimefax.com",
      image:
        "https://pbs.twimg.com/profile_images/1665351804685524995/W4BpDx5Z_400x400.jpg",
    },
  ];

  return (
    <section className="py-10 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center tracking-wider text-muted-foreground">
          <span>Builders and fintech teams trust </span>
          <span className="text-primary font-bold">VaultKey</span>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featured.map((t) => (
            <figure
              key={t.author + t.company}
              className="rounded-xl border border-primary/30 p-5 h-full"
            >
              <blockquote className="text-sm sm:text-base font-light font-sans">
                {t.quote}
              </blockquote>
              <div className="mt-5 flex items-center gap-3">
                <img
                  src={t.image}
                  alt={`${t.author} avatar`}
                  className="rounded-lg border-2 border-primary/50 h-8 w-8 object-cover"
                />
                <figcaption className="text-sm">
                  <span className="font-medium">{t.author}</span>
                  <a
                    href={`https://${t.company}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {" "}
                    — {t.company}
                  </a>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quick.map((t) => (
            <figure
              key={t.author + t.company}
              className="rounded-xl border border-primary/30 p-5 h-full"
            >
              <blockquote className="text-sm sm:text-base font-light font-sans leading-relaxed">
                {t.quote}
              </blockquote>
              <div className="mt-5 flex items-center gap-3">
                <img
                  src={t.image}
                  alt={`${t.author} avatar`}
                  className="rounded-lg border-2 border-primary/50 h-8 w-8 object-cover"
                />
                <figcaption className="text-sm">
                  <span className="font-medium">{t.author}</span>
                  <a
                    href={`https://${t.company}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {" "}
                    — {t.company}
                  </a>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const top = [
    {
      key: "feature-dashboard",
      title: "Dashboard & Analytics",
      content:
        "Monitor wallet activity, credit consumption, and operation counts in real time. Filter by chain, operation type, and date range. Export usage data and track which teams are spending what.",
      imageLightSrc: "/emails-search-light.webp",
      imageDarkSrc: "/emails-search-dark.webp",
    },
    {
      key: "feature-multichain",
      title: "EVM + Solana Support",
      content:
        "Create and manage custodial wallets across all major EVM networks — Ethereum, Polygon, Arbitrum, Base, Optimism, BSC — and Solana. One unified API for both ecosystems.",
      imageLightSrc: "/editor-light.webp",
      imageDarkSrc: "/editor-dark.webp",
    },
  ];

  const bottom = [
    {
      key: "feature-stablecoin",
      title: "Stablecoin Transfers",
      content:
        "Send USDC and USDT with a single API call. Async job queue with webhook delivery and polling. Gasless transfers via relayer on supported EVM chains.",
    },
    {
      key: "feature-kms",
      title: "KMS Key Management",
      content:
        "Pluggable KMS backends — HashiCorp Vault, AWS KMS, and GCP KMS. Keys never leave the HSM. Bring your own KMS or use the managed default.",
    },
    {
      key: "feature-multitenancy",
      title: "Multi-tenant & RBAC",
      content:
        "Full organization model with owner, admin, developer, and viewer roles. Separate mainnet and testnet environments with isolated orgs, API keys, and credit balances.",
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="mb-2 text-sm uppercase tracking-wider text-primary">
            Features
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {top.map((f) => (
            <FeatureCard
              key={f.key}
              title={f.title}
              content={f.content}
              imageLightSrc={f.imageLightSrc}
              imageDarkSrc={f.imageDarkSrc}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {bottom.map((f) => (
            <FeatureCardPlain key={f.key} title={f.title} content={f.content} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="mb-2 text-sm uppercase tracking-wider text-primary">
            Pricing
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
            Free to start. Scale when you need to. No seat fees, no hidden costs.
          </p>
        </div>

        <div className="mt-8">
          <PricingCalculator />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          100% money-back guarantee · Credits don&apos;t roll over · Payments via Stripe
        </p>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="mb-2 text-sm uppercase tracking-wider text-primary">
            About
          </div>
        </div>

        <div className="mt-8 max-w-3xl mx-auto text-sm sm:text-base space-y-4">
          <p>
            VaultKey provides open source custodial wallet infrastructure for
            developers who need to manage crypto wallets on behalf of their
            users. We handle key management, transaction signing, and stablecoin
            transfers — so you can focus on your product.
          </p>
          <p>
            VaultKey is bootstrapped and funded by the cloud offering. If you
            self-host VaultKey, please consider{" "}
            <a
              href={`https://github.com/sponsors/${REPO.split("/")[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              sponsoring the project
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}