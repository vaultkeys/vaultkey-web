import { type Config } from "tailwindcss";
import sharedConfig from "@vaultkey/tailwind-config/tailwind.config";
import path from "path";

export default {
  ...sharedConfig,
  content: [
    "./src/**/*.tsx",
    `${path.join(require.resolve("@vaultkey/ui"), "..")}/**/*.{ts,tsx}`,
    `${path.join(require.resolve("@vaultkey/email-editor"), "..")}/**/*.{ts,tsx}`,
  ],
} satisfies Config;

