"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signout } from "@/lib/auth-actions";

export default function SignUpButtonClient({ user }: any) {
  const router = useRouter();

  if (!user) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          router.push("/signup");
        }}
      >
        Sign Up
      </Button>
    );
  }

  return (<></>);
}
