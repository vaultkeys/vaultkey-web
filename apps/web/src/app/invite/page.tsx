import { Suspense } from "react";
import AcceptInvitePage from "@/components/AcceptInviteClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AcceptInvitePage />
    </Suspense>
  );
}