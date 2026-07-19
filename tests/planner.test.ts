import { describe, expect, it } from "vitest";
import {
  createCommercialProductionPlan,
  createFactoryPlan,
  expandProductionRequirements,
  expandToFactoryMaterials,
  optimizeFactoryJobs,
} from "../app/mayorflow/planner";
import type { FactoryJob } from "../app/mayorflow/types";

describe("recipe expansion", () => {
  it("expands a chair recursively to factory materials", () => {
    const result = expandToFactoryMaterials([
      { itemId: "chairs", quantity: 1 },
    ]);
    const quantities = Object.fromEntries(
      result.map((material) => [material.itemId, material.quantity]),
    );

    expect(quantities).toEqual({
      metal: 3,
      wood: 3,
    });
  });

  it("combines shared raw materials in a pizza recipe", () => {
    const result = expandToFactoryMaterials([
      { itemId: "pizza", quantity: 1 },
    ]);
    const quantities = Object.fromEntries(
      result.map((material) => [material.itemId, material.quantity]),
    );

    expect(quantities).toEqual({
      seeds: 2,
      textiles: 2,
      animalfeed: 5,
    });
  });

  it("keeps every commercial step required for a chair", () => {
    const result = expandProductionRequirements([
      { itemId: "chairs", quantity: 1 },
    ]);
    const quantities = Object.fromEntries(
      result.map((requirement) => [
        requirement.itemId,
        requirement.quantity,
      ]),
    );

    expect(quantities).toEqual({
      nails: 1,
      hammer: 1,
      chairs: 1,
    });
  });
});

describe("factory scheduling", () => {
  it("finds a balanced exact schedule when LPT is not enough", () => {
    const durations = [3, 3, 3, 3, 2, 2, 2];
    const jobs: FactoryJob[] = durations.map((durationMinutes, index) => ({
      id: String(index),
      itemId: "metal",
      durationMinutes,
    }));

    const result = optimizeFactoryJobs(jobs, 3);

    expect(result.makespanMinutes).toBe(6);
    expect(result.isOptimal).toBe(true);
    expect(
      result.schedules.map((schedule) => schedule.totalMinutes).sort(),
    ).toEqual([6, 6, 6]);
  });

  it("reports the expected plan for three factory materials", () => {
    const result = createFactoryPlan(
      [
        { itemId: "metal", quantity: 1 },
        { itemId: "wood", quantity: 1 },
        { itemId: "plastic", quantity: 1 },
      ],
      2,
    );

    expect(result.totalWorkMinutes).toBe(13);
    expect(result.makespanMinutes).toBe(9);
    expect(result.isOptimal).toBe(true);
  });

  it("does not cap the number of factory slots", () => {
    const result = createFactoryPlan(
      [{ itemId: "metal", quantity: 1 }],
      40,
    );

    expect(result.schedules).toHaveLength(40);
  });
});

describe("commercial scheduling", () => {
  it("runs stores in parallel and waits for commercial ingredients", () => {
    const result = createCommercialProductionPlan([
      { itemId: "chairs", quantity: 1 },
    ]);
    const steps = Object.fromEntries(
      result.lanes.flatMap((lane) =>
        lane.steps.map((step) => [step.itemId, step]),
      ),
    );

    expect(steps.nails).toMatchObject({
      quantity: 1,
      startMinutes: 0,
      endMinutes: 5,
    });
    expect(steps.hammer).toMatchObject({
      quantity: 1,
      startMinutes: 0,
      endMinutes: 14,
    });
    expect(steps.chairs).toMatchObject({
      quantity: 1,
      startMinutes: 14,
      endMinutes: 34,
    });
    expect(result.makespanMinutes).toBe(34);
  });
});
