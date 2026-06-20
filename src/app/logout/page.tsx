"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useSession();

  useEffect(() => {
    logout();
    router.replace("/");
  }, [logout, router]);

  return null;
}
