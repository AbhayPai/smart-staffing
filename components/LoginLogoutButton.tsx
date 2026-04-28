// components/LoginButtonWrapper.tsx
import { createClient } from "@/utils/supabase/server";
import LoginButtonClient from "@/components/LoginButtonClient";

export default async function LoginButtonWrapper() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LoginButtonClient user={user} />;
}
