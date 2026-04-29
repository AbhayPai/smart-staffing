// components/LoginButtonWrapper.tsx
import { createClient } from "@/lib/supabase/server";
import LoginButtonClient from "@/components/login/LoginButtonClient";

export default async function LoginButtonWrapper() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LoginButtonClient user={user} />;
}
