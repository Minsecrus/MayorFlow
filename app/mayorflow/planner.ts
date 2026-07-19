import { categories, itemById } from "./items";
import type {
  CategoryId,
  CommercialProductionPlan,
  Demand,
  ExpandedMaterial,
  FactoryJob,
  FactoryPlan,
  FactorySlotSchedule,
  ItemId,
  ProductionRequirement,
  StoreProductionLane,
} from "./types";

const MAX_EXACT_JOBS = 42;
const MAX_SEARCH_NODES = 250_000;
const MAX_SEARCH_MS = 750;

export function expandToFactoryMaterials(demands: Demand[]): ExpandedMaterial[] {
  const totals = new Map<ItemId, number>();

  const visit = (itemId: ItemId, quantity: number, parents: Set<ItemId>) => {
    const item = itemById[itemId];
    if (!item) {
      throw new Error(`Unknown production item: ${itemId}`);
    }

    if (item.isFactoryMaterial) {
      totals.set(itemId, (totals.get(itemId) ?? 0) + quantity);
      return;
    }

    if (parents.has(itemId)) {
      throw new Error(`Circular recipe detected at: ${itemId}`);
    }

    const nextParents = new Set(parents);
    nextParents.add(itemId);
    for (const ingredient of item.ingredients) {
      visit(
        ingredient.itemId,
        quantity * ingredient.quantity,
        nextParents,
      );
    }
  };

  for (const demand of demands) {
    if (demand.quantity > 0) {
      visit(demand.itemId, Math.floor(demand.quantity), new Set());
    }
  }

  return [...totals.entries()]
    .map(([itemId, quantity]) => {
      const unitMinutes = itemById[itemId].productionMinutes;
      return {
        itemId,
        quantity,
        unitMinutes,
        totalWorkMinutes: quantity * unitMinutes,
      };
    })
    .sort(
      (left, right) =>
        itemById[left.itemId].level - itemById[right.itemId].level,
    );
}

function expandAllRequirements(demands: Demand[]): Map<ItemId, number> {
  const totals = new Map<ItemId, number>();

  const visit = (itemId: ItemId, quantity: number, parents: Set<ItemId>) => {
    const item = itemById[itemId];
    if (!item) {
      throw new Error(`Unknown production item: ${itemId}`);
    }
    if (parents.has(itemId)) {
      throw new Error(`Circular recipe detected at: ${itemId}`);
    }

    totals.set(itemId, (totals.get(itemId) ?? 0) + quantity);
    if (item.isFactoryMaterial) {
      return;
    }

    const nextParents = new Set(parents);
    nextParents.add(itemId);
    for (const ingredient of item.ingredients) {
      visit(
        ingredient.itemId,
        quantity * ingredient.quantity,
        nextParents,
      );
    }
  };

  for (const demand of demands) {
    if (demand.quantity > 0) {
      visit(demand.itemId, Math.floor(demand.quantity), new Set());
    }
  }

  return totals;
}

function getProductionLayer(
  itemId: ItemId,
  memo: Map<ItemId, number>,
): number {
  const cached = memo.get(itemId);
  if (cached !== undefined) {
    return cached;
  }

  const item = itemById[itemId];
  const layer = item.isFactoryMaterial
    ? 0
    : 1 +
      Math.max(
        0,
        ...item.ingredients.map((ingredient) =>
          getProductionLayer(ingredient.itemId, memo),
        ),
      );
  memo.set(itemId, layer);
  return layer;
}

export function expandProductionRequirements(
  demands: Demand[],
): ProductionRequirement[] {
  const totals = expandAllRequirements(demands);
  const layerMemo = new Map<ItemId, number>();
  const categoryOrder = new Map(
    categories.map((category, index) => [category.id, index]),
  );

  return [...totals.entries()]
    .filter(([itemId]) => !itemById[itemId].isFactoryMaterial)
    .map(([itemId, quantity]) => ({
      itemId,
      quantity,
      layer: getProductionLayer(itemId, layerMemo),
      totalMinutes: quantity * itemById[itemId].productionMinutes,
    }))
    .sort(
      (left, right) =>
        left.layer - right.layer ||
        (categoryOrder.get(itemById[left.itemId].category) ?? 0) -
          (categoryOrder.get(itemById[right.itemId].category) ?? 0) ||
        itemById[left.itemId].level - itemById[right.itemId].level,
    );
}

export function createCommercialProductionPlan(
  demands: Demand[],
): CommercialProductionPlan {
  const requirements = expandProductionRequirements(demands);
  const requiredIds = new Set(requirements.map((entry) => entry.itemId));
  const dependents = new Map<ItemId, ItemId[]>();

  for (const requirement of requirements) {
    const item = itemById[requirement.itemId];
    for (const ingredient of item.ingredients) {
      if (!requiredIds.has(ingredient.itemId)) {
        continue;
      }
      const entries = dependents.get(ingredient.itemId) ?? [];
      entries.push(requirement.itemId);
      dependents.set(ingredient.itemId, entries);
    }
  }

  const depthMemo = new Map<ItemId, number>();
  const getDependentDepth = (itemId: ItemId): number => {
    const cached = depthMemo.get(itemId);
    if (cached !== undefined) {
      return cached;
    }
    const depth = Math.max(
      0,
      ...(dependents.get(itemId) ?? []).map(
        (dependentId) => 1 + getDependentDepth(dependentId),
      ),
    );
    depthMemo.set(itemId, depth);
    return depth;
  };

  const orderedRequirements = [...requirements].sort(
    (left, right) =>
      left.layer - right.layer ||
      getDependentDepth(right.itemId) - getDependentDepth(left.itemId) ||
      itemById[left.itemId].level - itemById[right.itemId].level,
  );
  const completionByItem = new Map<ItemId, number>();
  const storeAvailableAt = new Map<CategoryId, number>();
  const stepsByStore = new Map<
    CategoryId,
    StoreProductionLane["steps"]
  >();

  for (const requirement of orderedRequirements) {
    const item = itemById[requirement.itemId];
    const ingredientsReadyAt = Math.max(
      0,
      ...item.ingredients.map(
        (ingredient) => completionByItem.get(ingredient.itemId) ?? 0,
      ),
    );
    const startMinutes = Math.max(
      ingredientsReadyAt,
      storeAvailableAt.get(item.category) ?? 0,
    );
    const endMinutes = startMinutes + requirement.totalMinutes;
    const steps = stepsByStore.get(item.category) ?? [];
    steps.push({ ...requirement, startMinutes, endMinutes });
    stepsByStore.set(item.category, steps);
    storeAvailableAt.set(item.category, endMinutes);
    completionByItem.set(item.id, endMinutes);
  }

  const lanes: StoreProductionLane[] = categories
    .filter((category) => category.id !== "factory")
    .flatMap((category) => {
      const steps = stepsByStore.get(category.id);
      return steps?.length
        ? [
            {
              category: category.id,
              totalMinutes: Math.max(...steps.map((step) => step.endMinutes)),
              steps,
            },
          ]
        : [];
    });

  return {
    requirements,
    lanes,
    makespanMinutes: Math.max(0, ...lanes.map((lane) => lane.totalMinutes)),
  };
}

export function createFactoryJobs(materials: ExpandedMaterial[]): FactoryJob[] {
  return materials.flatMap((material) =>
    Array.from({ length: material.quantity }, (_, index) => ({
      id: `${material.itemId}-${index + 1}`,
      itemId: material.itemId,
      durationMinutes: material.unitMinutes,
    })),
  );
}

interface AssignmentResult {
  assignment: number[];
  loads: number[];
  makespan: number;
}

function lptAssignment(jobs: FactoryJob[], slotCount: number): AssignmentResult {
  const loads = Array<number>(slotCount).fill(0);
  const assignment = Array<number>(jobs.length).fill(0);

  jobs.forEach((job, index) => {
    let targetSlot = 0;
    for (let slot = 1; slot < slotCount; slot += 1) {
      if (loads[slot] < loads[targetSlot]) {
        targetSlot = slot;
      }
    }
    assignment[index] = targetSlot;
    loads[targetSlot] += job.durationMinutes;
  });

  return {
    assignment,
    loads,
    makespan: Math.max(0, ...loads),
  };
}

function buildSchedules(
  jobs: FactoryJob[],
  assignment: number[],
  slotCount: number,
): FactorySlotSchedule[] {
  const schedules: FactorySlotSchedule[] = Array.from(
    { length: slotCount },
    (_, slot) => ({ slot, totalMinutes: 0, jobs: [] }),
  );

  jobs.forEach((job, index) => {
    const slot = assignment[index];
    const schedule = schedules[slot];
    const startMinutes = schedule.totalMinutes;
    const endMinutes = startMinutes + job.durationMinutes;
    schedule.jobs.push({
      ...job,
      slot,
      startMinutes,
      endMinutes,
    });
    schedule.totalMinutes = endMinutes;
  });

  return schedules;
}

export function optimizeFactoryJobs(
  sourceJobs: FactoryJob[],
  requestedSlotCount: number,
): Omit<FactoryPlan, "materials"> {
  const normalizedSlotCount = Number.isFinite(requestedSlotCount)
    ? Math.floor(requestedSlotCount)
    : 1;
  const slotCount = Math.max(1, normalizedSlotCount);
  const jobs = [...sourceJobs].sort(
    (left, right) =>
      right.durationMinutes - left.durationMinutes ||
      left.itemId.localeCompare(right.itemId) ||
      left.id.localeCompare(right.id),
  );
  const totalWorkMinutes = jobs.reduce(
    (total, job) => total + job.durationMinutes,
    0,
  );

  if (jobs.length === 0) {
    return {
      schedules: buildSchedules([], [], slotCount),
      makespanMinutes: 0,
      totalWorkMinutes: 0,
      lowerBoundMinutes: 0,
      isOptimal: true,
      exploredNodes: 0,
    };
  }

  const longestJob = jobs[0].durationMinutes;
  const lowerBoundMinutes = Math.max(
    longestJob,
    Math.ceil(totalWorkMinutes / slotCount),
  );
  const initial = lptAssignment(jobs, slotCount);
  let bestMakespan = initial.makespan;
  let bestAssignment = [...initial.assignment];
  let exploredNodes = 0;
  let searchAborted = false;
  let reachedLowerBound = bestMakespan === lowerBoundMinutes;

  const shouldSearch =
    !reachedLowerBound &&
    slotCount > 1 &&
    jobs.length <= MAX_EXACT_JOBS;

  if (shouldSearch) {
    const loads = Array<number>(slotCount).fill(0);
    const assignment = Array<number>(jobs.length).fill(0);
    const memo = new Set<string>();
    const deadline = Date.now() + MAX_SEARCH_MS;

    const search = (jobIndex: number) => {
      if (reachedLowerBound || searchAborted) {
        return;
      }

      exploredNodes += 1;
      if (
        exploredNodes > MAX_SEARCH_NODES ||
        (exploredNodes & 1023) === 0 && Date.now() > deadline
      ) {
        searchAborted = true;
        return;
      }

      const currentMax = Math.max(0, ...loads);
      if (currentMax >= bestMakespan) {
        return;
      }

      if (jobIndex === jobs.length) {
        bestMakespan = currentMax;
        bestAssignment = [...assignment];
        reachedLowerBound = bestMakespan === lowerBoundMinutes;
        return;
      }

      const normalizedLoads = [...loads].sort((a, b) => a - b);
      const stateKey = `${jobIndex}|${normalizedLoads.join(",")}`;
      if (memo.has(stateKey)) {
        return;
      }
      memo.add(stateKey);

      const machineOrder = Array.from(
        { length: slotCount },
        (_, slot) => slot,
      ).sort((left, right) => loads[left] - loads[right]);
      let previousLoad = -1;

      for (const slot of machineOrder) {
        const originalLoad = loads[slot];
        if (originalLoad === previousLoad) {
          continue;
        }
        previousLoad = originalLoad;

        const nextLoad = originalLoad + jobs[jobIndex].durationMinutes;
        if (nextLoad >= bestMakespan) {
          continue;
        }

        loads[slot] = nextLoad;
        assignment[jobIndex] = slot;
        search(jobIndex + 1);
        loads[slot] = originalLoad;

        if (reachedLowerBound || searchAborted) {
          return;
        }

      }
    };

    search(0);
  }

  const isOptimal =
    reachedLowerBound ||
    (shouldSearch && !searchAborted) ||
    slotCount === 1 ||
    slotCount >= jobs.length;

  return {
    schedules: buildSchedules(jobs, bestAssignment, slotCount),
    makespanMinutes: bestMakespan,
    totalWorkMinutes,
    lowerBoundMinutes,
    isOptimal,
    exploredNodes,
  };
}

export function createFactoryPlan(
  demands: Demand[],
  slotCount: number,
): FactoryPlan {
  const materials = expandToFactoryMaterials(demands);
  const jobs = createFactoryJobs(materials);
  return {
    materials,
    ...optimizeFactoryJobs(jobs, slotCount),
  };
}
