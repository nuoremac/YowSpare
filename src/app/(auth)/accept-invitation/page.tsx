"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const AcceptInvitationClient = dynamic(
  () => import("@/components/AcceptInvitationClient"),
  { ssr: false }
);

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitationClient />
    </Suspense>
  );
}
