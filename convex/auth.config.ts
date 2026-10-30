import { authConfig } from "@samebase/alchemy-convex/state/auth.config";
import { env } from "./_generated/server";

// Verifies the read tokens of `reader:authorize`.
export default authConfig(env.CONVEX_CLOUD_URL);
