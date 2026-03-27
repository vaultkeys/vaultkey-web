import type { Config } from "tailwindcss";
import sharedConfig from "@vaultkey/tailwind-config/tailwind.config";

export default {
  ...sharedConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
