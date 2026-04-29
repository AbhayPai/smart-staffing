"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signout } from "@/lib/auth-actions";

export default function LoginButtonClient({ user }: any) {
  const router = useRouter();

  if (user) {
    return (
      <Button
        onClick={async () => {
          await signout();
          router.refresh(); // 👈 important: re-fetch server state
        }}
      >
        Log out
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => {
        router.push("/");
      }}
    >
      Login
    </Button>
  );
}
