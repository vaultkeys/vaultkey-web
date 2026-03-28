import { type Config } from "tailwindcss";
import sharedConfig from "@vaultkey/tailwind-config/tailwind.config";

export default {
  ...sharedConfig,
  content: ["./src/**/*.tsx", "./src/**/*.ts"],
} satisfies Config;
