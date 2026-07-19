/// <reference lib="webworker" />

import { createFactoryPlan } from "./planner";
import type { PlannerWorkerRequest, PlannerWorkerResponse } from "./types";

self.addEventListener("message", (event: MessageEvent<PlannerWorkerRequest>) => {
  const { requestId, demands, slotCount } = event.data;
  const response: PlannerWorkerResponse = {
    requestId,
    plan: createFactoryPlan(demands, slotCount),
  };
  self.postMessage(response);
});

export {};
