import { readerFunctions } from "@samebase/alchemy-convex/state/functions";
import { components } from "./_generated/api";

// The redacted read of one repository's state, for a reader with a token of `authorize`.
export const { authorize, repository } = readerFunctions(components.alchemyState);
