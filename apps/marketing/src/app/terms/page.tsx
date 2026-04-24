import type { Metadata } from "next";
import { TopNav } from "~/components/TopNav";

export const metadata: Metadata = {
  title: "Terms of Service – VaultKey",
  description: "Terms governing use of the VaultKey website and API platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-sidebar-background text-foreground">
      <TopNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight mb-6">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mb-6">
          These Terms of Service ("Terms") govern your access to and use of the
          VaultKey website at getvaultkey.com and the VaultKey API platform,
          which provides custodial wallet infrastructure, signing, sweep, and
          stablecoin transfer services. By accessing or using our site or
          platform, you agree to be bound by these Terms.
        </p>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Eligibility & Accounts</h2>
          <p className="text-muted-foreground">
            You may use the platform only if you can form a binding contract
            with VaultKey, are at least 18 years old, and are not barred from
            doing so under any applicable laws, including the laws of your
            country of residence. You are responsible for maintaining the
            security of your API keys, API secrets, and account credentials.
            All activity performed using your credentials is your
            responsibility.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Prohibited Jurisdictions</h2>
          <p className="text-muted-foreground">
            VaultKey does not provide services to individuals, entities, or
            organizations located in, or acting on behalf of, countries or
            territories subject to sanctions administered by the U.S. Office of
            Foreign Assets Control (OFAC) or other applicable sanctions
            authorities. By using VaultKey, you represent and warrant that you
            are not located in, incorporated under the laws of, or acting on
            behalf of any sanctioned country or territory, and that you are not
            on any U.S. or international sanctions list. We reserve the right
            to terminate access immediately if we determine that you are in
            violation of this provision.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Acceptable Use</h2>
          <p className="text-muted-foreground">
            You agree not to misuse the platform. Prohibited conduct includes,
            without limitation:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Violating any applicable laws or regulations, including those related to financial services, anti-money laundering (AML), and counter-terrorism financing (CTF).</li>
            <li>Using the platform to facilitate illegal transactions, money laundering, fraud, or any other financial crime.</li>
            <li>Attempting to reverse-engineer, extract, or access private key material through any means not provided by the API.</li>
            <li>Abusing rate limits, attempting denial-of-service attacks, or interfering with platform availability.</li>
            <li>Sharing API keys or secrets with unauthorized parties or using them in insecure client-side environments.</li>
            <li>Infringing the rights of others or violating their privacy.</li>
            <li>Uploading or transmitting malicious code or payloads.</li>
          </ul>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">API Keys & Security</h2>
          <p className="text-muted-foreground">
            Your API key and API secret grant full access to your wallets and
            operations. You are solely responsible for keeping them secure. Do
            not expose them in client-side code, public repositories, or logs.
            VaultKey will never ask you to share your API secret. If you
            believe your credentials have been compromised, rotate them
            immediately from your dashboard. We are not liable for any losses
            resulting from unauthorized use of your credentials.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Blockchain Transactions</h2>
          <p className="text-muted-foreground">
            Blockchain transactions are irreversible once confirmed on-chain.
            VaultKey provides the infrastructure to sign and broadcast
            transactions on your behalf, but we are not responsible for the
            outcome of any on-chain transaction, including failed transactions,
            misdirected funds, smart contract interactions, or losses resulting
            from network congestion or gas price fluctuations. You are
            responsible for verifying recipient addresses and transaction
            parameters before submission. VaultKey does not hold, custody, or
            insure your on-chain assets.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Custodial Wallets</h2>
          <p className="text-muted-foreground">
            Wallets created through VaultKey are custodial — private keys are
            generated and encrypted by VaultKey on your behalf. VaultKey
            retains the ability to perform signing operations using those keys
            as instructed through the API. You acknowledge that this is a
            custodial model and that access to wallets depends on your
            continued access to the VaultKey platform. We encrypt key material
            at rest and do not log plaintext keys, but you accept the inherent
            risks of a custodial architecture.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Credits & Billing</h2>
          <p className="text-muted-foreground">
            Access to certain API operations requires purchased credits.
            Credits are non-refundable except where required by applicable law.
            Free-tier limits apply to accounts that have not purchased credits.
            VaultKey reserves the right to modify pricing, credit costs, and
            free-tier limits at any time with reasonable notice.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Intellectual Property</h2>
          <p className="text-muted-foreground">
            Content on the site and platform, including trademarks, logos,
            text, and software, is owned by or licensed to VaultKey and
            protected by intellectual property laws. You may not use our marks
            or reproduce our software without our prior written permission.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Third-Party Services</h2>
          <p className="text-muted-foreground">
            The platform relies on third-party blockchain RPC providers,
            KMS services, and infrastructure providers. We are not responsible
            for outages, errors, or data handling practices of those third
            parties. The site may also contain links to third-party websites
            we do not control.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Disclaimer</h2>
          <p className="text-muted-foreground">
            The platform is provided on an "as is" and "as available" basis
            without warranties of any kind, express or implied, including
            warranties of merchantability, fitness for a particular purpose, or
            uninterrupted availability. Cryptocurrency and blockchain
            infrastructure involve inherent risks, and VaultKey makes no
            guarantee of the availability, security, or performance of any
            blockchain network.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the fullest extent permitted by law, VaultKey shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, including loss of funds, loss of profits, loss of
            data, or business interruption, arising out of your use of or
            inability to use the platform — even if advised of the possibility
            of such damages. This includes losses resulting from on-chain
            transactions, compromised API credentials, or third-party service
            failures.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Indemnification</h2>
          <p className="text-muted-foreground">
            You agree to indemnify and hold harmless VaultKey and its officers,
            directors, employees, and agents from any claims, damages,
            liabilities, and expenses arising out of your use of the platform,
            your violation of these Terms, or your violation of any applicable
            laws or regulations, including financial services and sanctions laws.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Suspension & Termination</h2>
          <p className="text-muted-foreground">
            We may suspend or terminate your access to the platform at any time
            if we reasonably believe you have violated these Terms, applicable
            law, or pose a risk to the platform or other users. We will
            endeavor to provide notice where feasible, except where immediate
            action is required for legal or security reasons.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Changes & Availability</h2>
          <p className="text-muted-foreground">
            We may modify these Terms and update the platform at any time.
            Changes are effective when posted. Continued use after changes are
            posted constitutes acceptance of the updated Terms. We may suspend
            or discontinue the platform in whole or in part with reasonable
            notice where possible.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-medium">Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms are governed by applicable laws without regard to
            conflict-of-law principles. Where required, disputes will be
            subject to the jurisdiction of competent courts in your place of
            residence or as otherwise mandated by applicable law.
          </p>
        </section>

        <section className="space-y-3 mb-10">
          <h2 className="text-xl font-medium">Contact</h2>
          <p className="text-muted-foreground">
            Questions about these Terms? Contact us at{" "}
            <a
              href="mailto:info@getvaultkey.com"
              className="underline decoration-dotted"
            >
              info@getvaultkey.com
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