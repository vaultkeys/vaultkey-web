import { Button } from "@vaultkey/ui/src/button";
import { CodeBlock } from "@vaultkey/ui/src/code-block";
import { CodeBlockWithCopy } from "@vaultkey/ui/src/code-block-with-copy";
import { LangToggle } from "./CodeLangToggle";

const TS_CODE = `import { VaultKey } from "@vaultkey/sdk";

const vk = new VaultKey({
  apiKey: "vk_live_your_api_key",
  apiSecret: "your_api_secret",
});

// Create a wallet
const { data: wallet } = await vk.wallets.create({
  userId: "user_123",
  chainType: "evm",
  label: "main",
});

// Send USDC on Polygon
const { data: job } = await vk.stablecoin.transfer(wallet.id, {
  token: "usdc",
  to: "0xRecipientAddress",
  amount: "50.00",
  chainType: "evm",
  chainName: "polygon",
});

// Poll for result
const { data: result } = await vk.jobs.get(job.jobId);
console.log(result.status); // "completed"`;

const PY_CODE = `from vaultkey import VaultKey

vk = VaultKey(
    api_key="vk_live_your_api_key",
    api_secret="your_api_secret",
)

# Create a wallet
wallet, err = vk.wallets.create({
    "user_id": "user_123",
    "chain_type": "evm",
    "label": "main",
})

# Send USDC on Polygon
job, err = vk.stablecoin.transfer(wallet["id"], {
    "token": "usdc",
    "to": "0xRecipientAddress",
    "amount": "50.00",
    "chain_type": "evm",
    "chain_name": "polygon",
})

# Poll for result
result, err = vk.jobs.get(job["job_id"])
print(result["status"])  # "completed"`;

const GO_CODE = `package main

import (
    "context"
    "log"

    vaultkey "github.com/vaultkey/vaultkey-go"
)

func main() {
    vk, err := vaultkey.NewClient("vk_live_your_api_key", "your_api_secret")
    if err != nil {
        log.Fatal(err)
    }

    ctx := context.Background()

    // Create wallet
    wallet, apiErr, err := vk.Wallets.Create(ctx, vaultkey.CreateWalletPayload{
        UserID:    "user_123",
        ChainType: vaultkey.ChainTypeEVM,
        Label:     "main",
    })
    if err != nil || apiErr != nil {
        log.Fatal(err, apiErr)
    }

    // Send USDC on Polygon
    job, apiErr, err := vk.Stablecoin.Transfer(ctx, wallet.ID,
        vaultkey.ChainTypeEVM,
        vaultkey.StablecoinTransferPayload{
            Token:     "usdc",
            To:        "0xRecipientAddress",
            Amount:    "50.00",
            ChainName: "polygon",
        },
    )
    if err != nil || apiErr != nil {
        log.Fatal(err, apiErr)
    }

    // Poll for result
    result, _, _ := vk.Jobs.Get(ctx, job.JobID)
    log.Println(result.Status) // "completed"
}`;

const CURL_CODE = `# Create a wallet
curl -X POST https://app.vaultkeys.dev/api/v1/sdk/wallets \
  -H "X-API-Key: vk_live_your_api_key" \
  -H "X-API-Secret: your_api_secret" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user_123","chain_type":"evm","label":"main"}'

# Send USDC on Polygon
curl -X POST https://app.vaultkeys.dev/api/v1/sdk/wallets/{walletId}/stablecoin/transfer/evm \
  -H "X-API-Key: vk_live_your_api_key" \
  -H "X-API-Secret: your_api_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "usdc",
    "to": "0xRecipientAddress",
    "amount": "50.00",
    "chain_name": "polygon"
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
            Typed SDKs and a simple REST API — integrate managed wallets in minutes, not weeks.
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
              href="https://docs.vaultkeys.dev"
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