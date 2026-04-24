<p align="center">
  <img style="width: 200px;height: 200px; margin: auto;" src="https://getvaultkey.com/logo-squircle.png" alt="VaultKey Logo">
</p>

<p align="center" style="margin-top: 20px">
  <p align="center">
  Open source wallet infrastructure for developers.
  <br>
    <a href="https://getvaultkey.com"><strong>Learn more »</strong></a>
    <br />
    <br />
    <a href="https://getvaultkey.com">Website</a>
    ·
    <a href="https://docs.getvaultkey.com">Docs</a>
    ·
    <a href="https://github.com/vaultkeys/vaultkey-web">Issues</a>
  </p>
</p>

<p align="center">
   <a href="https://github.com/vaultkeys/vaultkey-web/stargazers"><img src="https://img.shields.io/github/stars/vaultkey%2Fvaultkey" alt="GitHub Stars"></a>
   <a href="https://github.com/vaultkeys/vaultkey-web/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPLv3-purple" alt="License"></a>
</p>

## About

VaultKey is wallet infrastructure. It lets you create and manage EVM and Solana wallets, sign messages and transactions, sweep funds, and transfer stablecoins — all through a simple REST API and typed SDKs.

You own the infrastructure. Keys are encrypted at rest using your choice of KMS provider (AWS KMS, GCP KMS, or HashiCorp Vault). No plaintext keys are ever stored or logged.

## Features

- [x] EVM and Solana wallet creation
- [x] Message and transaction signing
- [x] Stablecoin transfers (USDC, USDT) — EVM and Solana
- [x] Native token balance lookups
- [x] Fund sweeps to master wallet
- [x] Gasless transactions via relayer
- [x] REST API
- [x] TypeScript SDK (`@vaultkey/sdk`)
- [x] Python SDK (`vaultkey`)
- [x] Dashboard (wallet management, usage, billing)
- [x] API key management
- [x] Organization and team support
- [x] Credit-based usage billing
- [x] Webhook support with signature verification
- [ ] Additional chain support
- [ ] SDK support for more languages

## Tech Stack

**Frontend**
- [Next.js](https://nextjs.org/) - Framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind](https://tailwindcss.com/) - CSS

**SDKs**
- TypeScript — [`@vaultkey/sdk`](https://www.npmjs.com/package/@vaultkey/sdk)
- Python — [`vaultkey`](https://pypi.org/project/vaultkey)

## Supported Chains

**EVM Mainnets:** Ethereum, Polygon, Arbitrum, Base, Optimism, Avalanche, BSC, zkSync

**EVM Testnets:** Sepolia, Amoy, Arbitrum Sepolia, Base Sepolia, Optimism Sepolia, Avalanche Fuji, BSC Testnet, zkSync Sepolia

**Solana:** Mainnet and Devnet

## Quick Start

```bash
# TypeScript
npm install @vaultkey/sdk
```

```ts
import { VaultKey } from "@vaultkey/sdk";

const vk = new VaultKey({
  apiKey: "vk_live_...",
  apiSecret: "...",
});

const { data: wallet } = await vk.wallets.create({
  userId: "user_123",
  chainType: "evm",
});

const { data: job } = await vk.stablecoin.transfer(wallet.id, {
  token: "usdc",
  to: "0xRecipient",
  amount: "50.00",
  chainType: "evm",
  chainName: "base",
  gasless: true,
});
```

```bash
# Python
pip install vaultkey
```

```python
from vaultkey import VaultKey

vk = VaultKey(api_key="vk_live_...", api_secret="...")

wallet, err = vk.wallets.create({
    "user_id": "user_123",
    "chain_type": "evm",
})

job, err = vk.stablecoin.transfer(wallet["id"], {
    "token": "usdc",
    "to": "0xRecipient",
    "amount": "50.00",
    "chain_type": "evm",
    "chain_name": "base",
    "gasless": True,
})
```

Full SDK docs at [docs.getvaultkey.com](https://docs.getvaultkey.com).

## Community and Next Steps 🎯

- Check out the source code and test it.
- Tell us what you think in [Discussions](https://github.com/vaultkeys/vaultkey-web/discussions).
- Fix or create [issues](https://github.com/vaultkeys/vaultkey-web/issues).
- ⭐ the repository to help raise awareness.

## Star History

<a href="https://star-history.com/#vaultkey/vaultkey&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=vaultkey/vaultkey&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=vaultkey/vaultkey&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=vaultkey/vaultkey&type=Date" />
 </picture>
</a>