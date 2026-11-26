/**
 * Who may register at this broker, from HUB_OWNERS: `any`, or the numeric ids of the GitHub accounts
 * (users or organizations) whose repositories may register, separated by commas. Anything else
 * throws, so a typo stops the deploy instead of opening or closing the broker. The owner is the one
 * GitHub's token of the registering run proves: the account that owns the repository, never the
 * person or bot that ran the workflow.
 */
export function parseOwners(value: string): "any" | Array<{ ownerId: string }> {
  const trimmed = value.trim();
  if (trimmed === "any") {
    return "any";
  }
  const ids = trimmed.split(",").map((id) => id.trim());
  if (!ids.every((id) => /^[1-9][0-9]*$/.test(id))) {
    throw new Error(
      `HUB_OWNERS is "any" or numeric GitHub owner ids separated by commas, not "${value}".`,
    );
  }
  return ids.map((ownerId) => ({ ownerId }));
}
