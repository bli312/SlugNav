import { withSupabase } from "npm:@supabase/server@1.9.2";
import { handleWalkingRoute } from "./handler.ts";

export default {
  fetch: withSupabase({ auth: "user" }, (request) =>
    handleWalkingRoute(request, Deno.env.get("ORS_API_KEY")),
  ),
};
