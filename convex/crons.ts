import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Expired requests and codes, old audit rows. Off the top of the hour.
crons.daily(
  "identity broker cleanup",
  { hourUTC: 4, minuteUTC: 17 },
  internal.identityBroker.cleanup,
  {},
);

export default crons;
