// components/UserGreetText.tsx
import { createClient } from "@/utils/supabase/server";

export default async function UserGreetText() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <p className="...">
        hello&nbsp; {user.user_metadata.full_name ?? "user"}!
      </p>
    );
  }

  return <h1>Welcome to Smart Staffing Application.</h1>;
}
