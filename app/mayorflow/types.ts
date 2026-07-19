export type ItemId = string;

export type CategoryId =
  | "factory"
  | "building-supplies"
  | "hardware"
  | "farmers-market"
  | "furniture"
  | "gardening"
  | "donut-shop"
  | "fashion"
  | "fast-food"
  | "home-appliances";

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  color: string;
}

export interface Ingredient {
  itemId: ItemId;
  quantity: number;
}

export interface ProductionItem {
  id: ItemId;
  name: string;
  englishName: string;
  category: CategoryId;
  level: number;
  productionMinutes: number;
  ingredients: Ingredient[];
  image: string;
  isFactoryMaterial: boolean;
}

export interface Demand {
  itemId: ItemId;
  quantity: number;
}

export interface ExpandedMaterial {
  itemId: ItemId;
  quantity: number;
  unitMinutes: number;
  totalWorkMinutes: number;
}

export interface FactoryJob {
  id: string;
  itemId: ItemId;
  durationMinutes: number;
}

export interface ScheduledJob extends FactoryJob {
  slot: number;
  startMinutes: number;
  endMinutes: number;
}

export interface FactorySlotSchedule {
  slot: number;
  totalMinutes: number;
  jobs: ScheduledJob[];
}

export interface FactoryPlan {
  materials: ExpandedMaterial[];
  schedules: FactorySlotSchedule[];
  makespanMinutes: number;
  totalWorkMinutes: number;
  lowerBoundMinutes: number;
  isOptimal: boolean;
  exploredNodes: number;
}

export interface ProductionRequirement {
  itemId: ItemId;
  quantity: number;
  layer: number;
  totalMinutes: number;
}

export interface StoreProductionStep extends ProductionRequirement {
  startMinutes: number;
  endMinutes: number;
}

export interface StoreProductionLane {
  category: CategoryId;
  totalMinutes: number;
  steps: StoreProductionStep[];
}

export interface CommercialProductionPlan {
  requirements: ProductionRequirement[];
  lanes: StoreProductionLane[];
  makespanMinutes: number;
}

export interface PlannerWorkerRequest {
  requestId: number;
  demands: Demand[];
  slotCount: number;
}

export interface PlannerWorkerResponse {
  requestId: number;
  plan: FactoryPlan;
}
