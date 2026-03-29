import { Button } from "@vaultkey/ui/src/button";
import { CodeBlock } from "@vaultkey/ui/src/code-block";
import { CodeBlockWithCopy } from "@vaultkey/ui/src/code-block-with-copy";
import { LangToggle } from "./CodeLangToggle";

const TS_CODE = `import { VaultKey } from "vaultkey-js";

const vk = new VaultKey("vk_live_your_api_key");

// Create a custodial wallet
const wallet = await vk.wallets.create({
  user_id: "user_123",
  chain_type: "evm",
  label: "main",
});

// Send USDC on Polygon
const job = await vk.wallets.stablecoinTransfer(wallet.id, "evm", {
  token: "usdc",
  to: "0xRecipientAddress",
  amount: "50.00",
  chain_id: "137",
});

// Poll for result
const result = await vk.jobs.get(job.job_id);
console.log(result.status); // "completed"`;

const PY_CODE = `from vaultkey import VaultKey

vk = VaultKey("vk_live_your_api_key")

# Create a custodial wallet
wallet = vk.wallets.create(
    user_id="user_123",
    chain_type="evm",
    label="main",
)

# Send USDC on Polygon
job = vk.wallets.stablecoin_transfer(
    wallet_id=wallet["id"],
    chain_type="evm",
    token="usdc",
    to="0xRecipientAddress",
    amount="50.00",
    chain_id="137",
)

# Poll for result
result = vk.jobs.get(job["job_id"])
print(result["status"])  # "completed"`;

const GO_CODE = `package main

import (
    "fmt"
    "io"
    "net/http"
    "strings"
)

func main() {
    // Create a custodial wallet
    walletPayload := strings.NewReader(\`{
        "user_id": "user_123",
        "chain_type": "evm",
        "label": "main"
    }\`)
    req, _ := http.NewRequest("POST",
        "https://api.vaultkey.dev/sdk/wallets",
        walletPayload)
    req.Header.Add("Content-Type", "application/json")
    req.Header.Add("Authorization", "Bearer vk_live_your_api_key")
    res, _ := http.DefaultClient.Do(req)
    defer res.Body.Close()
    body, _ := io.ReadAll(res.Body)
    fmt.Println(string(body))
}`;

const CURL_CODE = `# Create a custodial wallet
curl -X POST https://api.vaultkey.dev/sdk/wallets \\
  -H "Authorization: Bearer vk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id":"user_123","chain_type":"evm","label":"main"}'

# Send USDC on Polygon
curl -X POST https://api.vaultkey.dev/sdk/wallets/{walletId}/stablecoin/transfer/evm \\
  -H "Authorization: Bearer vk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "usdc",
    "to": "0xRecipientAddress",
    "amount": "50.00",
    "chain_id": "137"
  }'`;

export function CodeExample() {
  const containerId = "code-example";
  const languages = [
    {
      key: "ts",
      label: "TypeScript",
      kind: "ts",
      shiki: "typescript" as const,
      code: TS_CODE,
    },
    {
      key: "py",
      label: "Python",
      kind: "py",
      shiki: "python" as const,
      code: PY_CODE,
    },
    {
      key: "go",
      label: "Go",
      kind: "go",
      shiki: "go" as const,
      code: GO_CODE,
    },
    {
      key: "curl",
      label: "cURL",
      kind: "curl",
      shiki: "bash" as const,
      code: CURL_CODE,
    },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="mb-2 text-sm uppercase tracking-wider text-primary">
            Developers
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
            Typed SDKs and a simple REST API — integrate custodial wallets in
            minutes, not weeks.
          </p>
        </div>

        <div className="mt-8 overflow-hidden" id={containerId}>
          <div className="flex items-center gap-2 justify-center py-2 text-xs text-muted-foreground mb-4">
            <LangToggle
              containerId={containerId}
              defaultLang="ts"
              languages={languages.map(({ key, label, kind }) => ({
                key,
                label,
                kind,
              }))}
            />
          </div>
          <div className="rounded-[18px] bg-primary/20 p-1">
            <div className="rounded-[14px] bg-primary/20 p-0.5 shadow-sm">
              <div className="bg-background rounded-xl overflow-hidden">
                {languages.map((l, idx) => (
                  <div
                    key={l.key}
                    data-lang-slot={l.key}
                    className={idx === 0 ? "block" : "hidden"}
                  >
                    <CodeBlockWithCopy code={l.code}>
                      <CodeBlock
                        lang={l.shiki as any}
                        className="p-4 rounded-[10px]"
                      >
                        {l.code}
                      </CodeBlock>
                    </CodeBlockWithCopy>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="sr-only" aria-live="polite">
            Language example toggled
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button size="lg" className="px-6">
            <a
              href="https://docs.vaultkey.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the docs
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CodeExample;