// components/SignUpButtonWrapper.tsx
import { createClient } from "@/lib/supabase/server";
import SignUpButtonClient from "@/components/signup/SignUpButtonClient";

export default async function SignUpButtonWrapper() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <SignUpButtonClient user={user} />;
}
