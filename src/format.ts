/** The minute of an ISO time, in UTC, so that the server and the browser render the same text. */
export const formatTime = (iso: string) => `${iso.slice(0, 16).replace("T", " ")} UTC`;

export const shortCommit = (commit: string) => commit.slice(0, 7);
