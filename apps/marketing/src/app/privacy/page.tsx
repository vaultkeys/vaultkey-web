import type { Metadata } from "next";
import { TopNav } from "~/components/TopNav";

export const metadata: Metadata = {
  title: "Privacy Policy – VaultKey",
  description: "Privacy policy for the VaultKey website and API platform.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-sidebar-background text-foreground">
      <TopNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight mb-6">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-8">
          This Privacy Policy explains how VaultKey ("we", "us") collects,
          uses, and shares information when you visit our marketing website at
          vaultkeys.dev, access our API, or use our wallet infrastructure
          platform. Please read this policy carefully. If you have questions,
          contact us at{" "}
          <a
            href="mailto:info@vaultkeys.dev"
            className="underline decoration-dotted"
          >
            info@vaultkeys.dev
          </a>
          .
        </p>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Who We Are</h2>
          <p className="text-muted-foreground">
            VaultKey operates the website at{" "}
            <span className="font-mono">vaultkeys.dev</span> and the VaultKey
            API platform, which provides wallet infrastructure,
            signing services, and stablecoin transfer capabilities to
            developers and businesses. We are the data controller for the
            information described in this policy.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">What We Collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <span className="text-foreground">
                Usage and device data (marketing site):
              </span>{" "}
              We use privacy-friendly analytics to understand overall traffic
              and usage patterns such as pages visited, referrers, and device
              type. This data is aggregated and not used to identify you
              individually.
            </li>
            <li>
              <span className="text-foreground">Server and security logs:</span>{" "}
              Our hosting providers may process IP addresses and basic request
              metadata transiently for security, reliability, and debugging
              purposes.
            </li>
            <li>
              <span className="text-foreground">Account data:</span> When you
              sign up for VaultKey, we collect information such as your name,
              email address, and organization details necessary to create and
              manage your account.
            </li>
            <li>
              <span className="text-foreground">
                API usage and platform data:
              </span>{" "}
              When you use the VaultKey API, we process data necessary to
              deliver the service, including API keys, wallet identifiers,
              blockchain addresses, transaction metadata, and job status
              records. We do not store private keys in plaintext — keys are
              encrypted at rest using a KMS provider.
            </li>
            <li>
              <span className="text-foreground">Blockchain data:</span> Wallet
              addresses and transaction hashes are inherently public on
              blockchain networks. We are not responsible for information
              visible on public blockchains.
            </li>
          </ul>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">How We Use Information</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Provide, operate, and maintain the VaultKey platform and API.</li>
            <li>Authenticate requests and enforce API key access controls.</li>
            <li>Process wallet creation, signing, sweep, and transfer operations.</li>
            <li>Monitor platform health, security, and reliability.</li>
            <li>Understand aggregated usage to improve performance and features.</li>
            <li>Send transactional communications related to your account.</li>
            <li>Comply with legal obligations and enforce our terms.</li>
          </ul>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Legal Bases</h2>
          <p className="text-muted-foreground">
            Where applicable (e.g., in the EEA/UK), we rely on contract
            performance to provide the API and platform services you sign up
            for, legitimate interests to operate and secure our infrastructure
            and measure aggregated site usage, and legal obligation where
            required by law.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Sharing and Processors</h2>
          <p className="text-muted-foreground">
            We share information with service providers who process data on our
            behalf, including:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <span className="text-foreground">Hosting and infrastructure:</span>{" "}
              Cloud providers for serving the API, database storage, and
              security.
            </li>
            <li>
              <span className="text-foreground">Key management:</span> KMS
              providers (AWS KMS, GCP KMS, or HashiCorp Vault depending on
              deployment) for encrypting and decrypting wallet keys.
            </li>
            <li>
              <span className="text-foreground">Analytics:</span>{" "}
              Privacy-friendly analytics for aggregated usage metrics on the
              marketing site.
            </li>
            <li>
              <span className="text-foreground">Blockchain networks:</span>{" "}
              RPC providers to broadcast transactions and query balances on
              behalf of your wallets. Addresses and transaction data submitted
              to these networks become publicly visible on-chain.
            </li>
          </ul>
          <p className="text-muted-foreground">
            We do not sell your personal information. We may disclose
            information if required by law, regulation, or to protect our
            rights, users, or the public.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Key Security</h2>
          <p className="text-muted-foreground">
            Wallet private keys generated through VaultKey are encrypted at
            rest using a KMS provider and are never stored or logged in
            plaintext. Signing operations are performed in memory and the
            decrypted key material is not persisted after the operation
            completes. You are responsible for securing your API keys and
            secrets, which grant access to your wallets.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Retention</h2>
          <p className="text-muted-foreground">
            We retain account and platform data for as long as your account is
            active or as needed to provide the service, comply with legal
            obligations, and resolve disputes. Aggregated analytics data does
            not identify individuals. Job and transaction records may be
            retained for audit and compliance purposes.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">International Transfers</h2>
          <p className="text-muted-foreground">
            Our providers may process data in locations outside of your country
            of residence. Where required, we implement appropriate safeguards
            for cross-border transfers in accordance with applicable data
            protection law.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Your Rights</h2>
          <p className="text-muted-foreground">
            Depending on your location, you may have rights to access, correct,
            delete, or export your information; to object to or restrict certain
            processing; and to withdraw consent where processing is based on
            consent. Note that certain data — such as transaction records
            written to public blockchains — cannot be deleted by us. To exercise
            your rights, contact us using the details below.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Children</h2>
          <p className="text-muted-foreground">
            Our services are not directed to children, and we do not knowingly
            collect personal information from anyone under 18.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Changes</h2>
          <p className="text-muted-foreground">
            We may update this policy from time to time. The "Last updated"
            date below reflects the most recent changes. Continued use of the
            platform after changes are posted constitutes acceptance of the
            updated policy.
          </p>
        </section>

        <section className="space-y-3 mb-10">
          <h2 className="text-xl font-medium">Contact</h2>
          <p className="text-muted-foreground">
            For privacy requests or questions, email us at{" "}
            <a
              href="mailto:info@vaultkeys.dev"
              className="underline decoration-dotted"
            >
              info@vaultkeys.dev
            </a>
            .
          </p>
        </section>

        <p className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </main>
  );
}