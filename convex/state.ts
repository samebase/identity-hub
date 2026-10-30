import { stateFunctions } from "@samebase/alchemy-convex/state/functions";
import { components } from "./_generated/api";

// The Alchemy state store of the team. A push replaces every function of the deployment, so this
// base serves the functions of the seed that Convex.state() pushes elsewhere. Each export has its
// name here, so that the Convex analysis finds each function.
export const {
  version,
  host,
  stacks,
  stages,
  list,
  get,
  replaced,
  set,
  remove,
  removeStack,
  getOutput,
  setOutput,
  readStack,
} = stateFunctions(components.alchemyState, "base");
