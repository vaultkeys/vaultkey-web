import Link from "next/link";
import Image from "next/image";

const REPO = "vaultkey/vaultkey";
const REPO_URL = `https://github.com/${REPO}`;
const APP_URL = "https://app.vaultkey.dev";
const DOCS_URL = "https://docs.vaultkey.dev";

export function SiteFooter() {
  return (
    <footer className="py-10 border-t border-border">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-center gap-2 sm:w-56">
            <Image src="/logo-squircle.png" alt="VaultKey" width={24} height={24} />
            <span className="text-primary font-mono">VaultKey</span>
          </div>

          <div className="sm:ml-auto flex items-start gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-2 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wider mb-2">
                  Product
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <a
                      href={APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground text-xs"
                    >
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      href={DOCS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground text-xs"
                    >
                      Docs
                    </a>
                  </li>
                  <li>
                    <a
                      href={REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground text-xs"
                    >
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider mb-2">
                  Contact
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <a
                      href="mailto:hey@vaultkey.dev"
                      className="hover:text-foreground text-xs"
                    >
                      Email
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://x.com/vaultkey_dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground text-xs"
                    >
                      X (Twitter)
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://discord.gg/vaultkey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground text-xs"
                    >
                      Discord
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider mb-2">
                  Company
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <Link
                      href="/privacy"
                      className="hover:text-foreground text-xs"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="hover:text-foreground text-xs"
                    >
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Replace with VaultKey status page URL when available */}
            <a
              href="https://status.vaultkey.dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Service status"
              title="Service status"
              className="inline-flex items-center"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-1 text-[10px] font-mono text-green-600 dark:text-green-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                All systems operational
              </span>
            </a>
          </div>
        </div>

        <div className="mt-6 text-xs text-muted-foreground mx-auto text-center">
          © {new Date().getFullYear()} VaultKey. All rights reserved.
        </div>
      </div>
    </footer>
  );
}