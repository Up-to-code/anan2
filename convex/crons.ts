import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "process tasks and notify",
  { minutes: 1 },
  internal.agent.processPendingTasks
);

export default crons;
