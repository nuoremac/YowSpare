"use client";

import dynamic from "next/dynamic";

const SignInClient = dynamic(() => import("@/components/SignInClient"), {
  ssr: false,
});

export default function SignInPage() {
  return <SignInClient />;
}
