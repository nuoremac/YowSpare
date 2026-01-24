"use client";

import dynamic from "next/dynamic";

const RegisterClient = dynamic(() => import("@/components/RegisterClient"), {
  ssr: false,
});

export default function RegisterPage() {
  return <RegisterClient />;
}
