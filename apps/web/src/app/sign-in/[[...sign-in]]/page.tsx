"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <SignIn />
    </main>
  );
}
