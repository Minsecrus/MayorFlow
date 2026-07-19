"use client";

import {
  ApartmentOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  GithubOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  App as AntApp,
  Badge,
  Button,
  Card,
  Collapse,
  ConfigProvider,
  Empty,
  Flex,
  Input,
  InputNumber,
  Modal,
  Popover,
  Select,
  Space,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import {
  Fragment,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatCompactDuration, formatDuration } from "./format";
import { categories, categoryById, itemById, items } from "./items";
import {
  createCommercialProductionPlan,
  createFactoryPlan,
} from "./planner";
import { usePlannerStore } from "./store";
import type {
  CategoryId,
  Demand,
  FactoryPlan,
  PlannerWorkerResponse,
  ProductionItem,
  ScheduledJob,
} from "./types";
import styles from "./MayorFlowApp.module.css";

const ScheduleChart = lazy(
  () =>
    import("./ScheduleChart").then((module) => ({
      default: module.ScheduleChart,
    })),
);

const { Text, Title } = Typography;

interface ItemImageProps {
  item: ProductionItem;
  size?: number;
}

function ItemImage({ item, size = 48 }: ItemImageProps) {
  return (
    <span
      className={styles.itemImageFrame}
      style={{ width: size, height: size }}
    >
      <img src={item.image} alt={item.name} width={size} height={size} />
    </span>
  );
}

function RecipeSummary({ item }: { item: ProductionItem }) {
  if (item.isFactoryMaterial) {
    return <Text>{formatDuration(item.productionMinutes)}</Text>;
  }

  return (
    <Space direction="vertical" size={8}>
      {item.ingredients.map((ingredient) => {
        const ingredientItem = itemById[ingredient.itemId];
        return (
          <Flex key={ingredient.itemId} align="center" gap={8}>
            <ItemImage item={ingredientItem} size={30} />
            <Text>{ingredientItem.name}</Text>
            <Text strong>×{ingredient.quantity}</Text>
          </Flex>
        );
      })}
    </Space>
  );
}

interface GroupedJob {
  itemId: string;
  count: number;
  startMinutes: number;
  endMinutes: number;
}

function groupConsecutiveJobs(jobs: ScheduledJob[]): GroupedJob[] {
  return jobs.reduce<GroupedJob[]>((groups, job) => {
    const previous = groups.at(-1);
    if (previous?.itemId === job.itemId) {
      previous.count += 1;
      previous.endMinutes = job.endMinutes;
      return groups;
    }
    groups.push({
      itemId: job.itemId,
      count: 1,
      startMinutes: job.startMinutes,
      endMinutes: job.endMinutes,
    });
    return groups;
  }, []);
}

export function MayorFlowApp() {
  const targets = usePlannerStore((state) => state.targets);
  const slotCount = usePlannerStore((state) => state.slotCount);
  const addTarget = usePlannerStore((state) => state.addTarget);
  const setTarget = usePlannerStore((state) => state.setTarget);
  const removeTarget = usePlannerStore((state) => state.removeTarget);
  const clearTargets = usePlannerStore((state) => state.clearTargets);
  const setSlotCount = usePlannerStore((state) => state.setSlotCount);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | CategoryId>("all");
  const [infoOpen, setInfoOpen] = useState(false);
  const [plan, setPlan] = useState<FactoryPlan | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    Promise.resolve(usePlannerStore.persist.rehydrate()).finally(() => {
      setHydrated(true);
    });
  }, []);

  const demands = useMemo<Demand[]>(
    () =>
      Object.entries(targets)
        .filter(([itemId, quantity]) => itemById[itemId] && quantity > 0)
        .map(([itemId, quantity]) => ({ itemId, quantity })),
    [targets],
  );
  const commercialPlan = useMemo(
    () => createCommercialProductionPlan(demands),
    [demands],
  );

  useEffect(() => {
    try {
      const worker = new Worker(new URL("./planner.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.addEventListener(
        "message",
        (event: MessageEvent<PlannerWorkerResponse>) => {
          if (event.data.requestId === latestRequestRef.current) {
            setPlan(event.data.plan);
          }
        },
      );
      workerRef.current = worker;
      return () => worker.terminate();
    } catch {
      workerRef.current = null;
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    if (workerRef.current) {
      workerRef.current.postMessage({ requestId, demands, slotCount });
    } else {
      setPlan(createFactoryPlan(demands, slotCount));
    }
  }, [demands, hydrated, slotCount]);

  const selectedItems = useMemo(
    () =>
      demands
        .map((demand) => ({
          item: itemById[demand.itemId],
          quantity: demand.quantity,
        }))
        .sort((left, right) => left.item.level - right.item.level),
    [demands],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesSearch =
        !query ||
        item.name.includes(query) ||
        item.englishName.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const collapseItems =
    plan?.schedules.map((schedule) => ({
      key: String(schedule.slot),
      label: (
        <Flex align="center" justify="space-between" className={styles.slotLabel}>
          <Text strong>槽位 {schedule.slot + 1}</Text>
          <Space size={16}>
            <Text type="secondary">{schedule.jobs.length} 件</Text>
            <Text>{formatDuration(schedule.totalMinutes)}</Text>
          </Space>
        </Flex>
      ),
      children: (
        <div className={styles.jobSequence}>
          {groupConsecutiveJobs(schedule.jobs).map((group, index) => {
            const item = itemById[group.itemId];
            return (
              <Tooltip
                key={[group.itemId, index].join("-")}
                title={[group.startMinutes, " → ", group.endMinutes, " 分钟"].join(
                  "",
                )}
              >
                <div className={styles.jobGroup}>
                  <ItemImage item={item} size={34} />
                  <span>{item.name}</span>
                  {group.count > 1 && <strong>×{group.count}</strong>}
                </div>
              </Tooltip>
            );
          })}
          {schedule.jobs.length === 0 && <Text type="secondary">空闲</Text>}
        </div>
      ),
    })) ?? [];

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#31785a",
          colorInfo: "#31785a",
          colorSuccess: "#4f8f63",
          borderRadius: 12,
          colorBgLayout: "#ffffff",
          colorText: "#22352b",
          colorTextSecondary: "#718078",
          fontFamily:
            'Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Card: { headerBg: "transparent" },
          Button: { controlHeight: 38 },
          Input: { controlHeight: 40 },
          Select: { controlHeight: 40 },
        },
      }}
    >
      <AntApp>
        <div className={styles.pageShell}>
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Flex align="center" gap={10}>
                <span className={styles.brandMark}>
                  <ApartmentOutlined />
                </span>
                <Title level={3} className={styles.brandTitle}>
                  MayorFlow
                </Title>
              </Flex>
              <Button
                type="text"
                shape="circle"
                className={styles.infoButton}
                icon={<InfoCircleOutlined />}
                aria-label="关于 MayorFlow"
                onClick={() => setInfoOpen(true)}
              />
            </div>
          </header>

          <main className={styles.main}>
            <section className={styles.workspace}>
              <Card
                className={[styles.panelCard, styles.libraryPanel].join(" ")}
                title={
                  <Space>
                    <AppstoreOutlined />
                    <span>物品库</span>
                  </Space>
                }
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Input
                    allowClear
                    value={search}
                    prefix={<SearchOutlined />}
                    placeholder="搜索物品名称"
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <Select
                    value={category}
                    style={{ width: "100%" }}
                    onChange={setCategory}
                    options={[
                      { value: "all", label: "全部商店与原料" },
                      ...categories.map((entry) => ({
                        value: entry.id,
                        label: entry.name,
                      })),
                    ]}
                  />
                </Space>

                <div className={styles.itemGrid}>
                  {filteredItems.map((item) => {
                    const selectedCount = targets[item.id] ?? 0;
                    return (
                      <Badge
                        key={item.id}
                        count={selectedCount}
                        size="small"
                        overflowCount={99}
                        offset={[-8, 8]}
                      >
                        <Popover
                          placement="right"
                          title={
                            <Flex
                              align="center"
                              justify="space-between"
                              gap={20}
                            >
                              <span>{item.name}配方</span>
                              <Text type="secondary">Lv.{item.level}</Text>
                            </Flex>
                          }
                          content={<RecipeSummary item={item} />}
                        >
                          <Button
                            className={styles.itemChoice}
                            onClick={() => addTarget(item.id)}
                            aria-label={["添加", item.name].join("")}
                          >
                            <ItemImage item={item} size={50} />
                            <span className={styles.itemChoiceText}>
                              <Text strong ellipsis={{ tooltip: item.name }}>
                                {item.name}
                              </Text>
                              <Text
                                type="secondary"
                                className={styles.itemMeta}
                              >
                                Lv.{item.level} ·{" "}
                                {formatCompactDuration(item.productionMinutes)}
                              </Text>
                            </span>
                            <PlusOutlined className={styles.addIcon} />
                          </Button>
                        </Popover>
                      </Badge>
                    );
                  })}
                </div>
              </Card>

              <div className={styles.resultColumn}>
                <Card
                  className={styles.panelCard}
                  title="本次生产清单"
                  extra={
                    <Button
                      type="text"
                      icon={<ClearOutlined />}
                      disabled={selectedItems.length === 0}
                      onClick={clearTargets}
                    >
                      清空
                    </Button>
                  }
                >
                  {selectedItems.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={false}
                    />
                  ) : (
                    <div className={styles.targetList}>
                      {selectedItems.map(({ item, quantity }) => (
                        <div className={styles.targetRow} key={item.id}>
                          <ItemImage item={item} size={44} />
                          <div className={styles.targetName}>
                            <Text strong>{item.name}</Text>
                          </div>
                          <InputNumber
                            min={1}
                            max={99}
                            value={quantity}
                            onChange={(value) => setTarget(item.id, value ?? 1)}
                            addonBefore="数量"
                          />
                          <Tooltip title="移除">
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              aria-label={["移除", item.name].join("")}
                              onClick={() => removeTarget(item.id)}
                            />
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card
                  className={styles.panelCard}
                  title="递归原料清单"
                >
                  {!plan ? (
                    <Flex
                      align="center"
                      justify="center"
                      className={styles.loadingBox}
                    >
                      <Spin />
                    </Flex>
                  ) : plan.materials.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={false}
                    />
                  ) : (
                    <div className={styles.materialGrid}>
                      {plan.materials.map((material) => {
                        const item = itemById[material.itemId];
                        return (
                          <div
                            key={material.itemId}
                            className={styles.materialTile}
                          >
                            <ItemImage item={item} size={48} />
                            <div className={styles.materialDetails}>
                              <Text strong>{item.name}</Text>
                            </div>
                            <span className={styles.materialQuantity}>
                              ×{material.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card
                  className={styles.panelCard}
                  title={
                    <Space>
                      <ClockCircleOutlined />
                      <span>工厂槽位排程</span>
                    </Space>
                  }
                  extra={
                    <InputNumber
                      min={1}
                      value={slotCount}
                      addonBefore="槽位"
                      onChange={(value) => setSlotCount(value ?? 1)}
                    />
                  }
                >
                  {!plan ? (
                    <Flex
                      align="center"
                      justify="center"
                      className={styles.loadingBox}
                    >
                      <Spin />
                    </Flex>
                  ) : plan.materials.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={false}
                    />
                  ) : (
                    <>
                      <Suspense
                        fallback={
                          <Flex
                            align="center"
                            justify="center"
                            style={{ minHeight: 250 }}
                          >
                            <Spin size="small" />
                          </Flex>
                        }
                      >
                        <ScheduleChart plan={plan} />
                      </Suspense>
                      <Collapse
                        ghost
                        size="small"
                        className={styles.scheduleCollapse}
                        items={collapseItems}
                      />
                    </>
                  )}
                </Card>

                <Card
                  className={styles.panelCard}
                  title={
                    <Space>
                      <ShopOutlined />
                      <span>后续生产流程</span>
                    </Space>
                  }
                >
                  {commercialPlan.lanes.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={false}
                    />
                  ) : (
                    <div className={styles.storeFlow}>
                      {commercialPlan.lanes.map((lane) => (
                        <div className={styles.storeLane} key={lane.category}>
                          <div className={styles.storeLaneHeader}>
                            <Text strong>
                              {categoryById[lane.category].name}
                            </Text>
                            <Text type="secondary">
                              {formatDuration(lane.totalMinutes)}
                            </Text>
                          </div>
                          <div className={styles.storeSteps}>
                            {lane.steps.map((step, index) => {
                              const item = itemById[step.itemId];
                              return (
                                <Fragment key={step.itemId}>
                                  {index > 0 && (
                                    <ArrowRightOutlined
                                      className={styles.storeArrow}
                                    />
                                  )}
                                  <Popover
                                    title={`${item.name}配方`}
                                    content={<RecipeSummary item={item} />}
                                  >
                                    <div className={styles.storeStep}>
                                      <ItemImage item={item} size={40} />
                                      <div className={styles.storeStepText}>
                                        <Text strong>
                                          {item.name} ×{step.quantity}
                                        </Text>
                                        <Text type="secondary">
                                          +{formatCompactDuration(step.startMinutes)}
                                          {" → +"}
                                          {formatCompactDuration(step.endMinutes)}
                                        </Text>
                                      </div>
                                    </div>
                                  </Popover>
                                </Fragment>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </section>
          </main>

          <Modal
            title="MayorFlow"
            open={infoOpen}
            footer={null}
            width={480}
            centered
            onCancel={() => setInfoOpen(false)}
          >
            <Typography.Paragraph>
              《模拟城市：我是市长》生产规划工具。选择目标物品和数量后，
              自动递归计算工厂原料，并生成工厂槽位与商店加工流程。
            </Typography.Paragraph>
            <Space size={8}>
              <GithubOutlined />
              <Typography.Link
                href="https://github.com/Minsecrus/MayorFlow"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </Typography.Link>
            </Space>
          </Modal>
        </div>
      </AntApp>
    </ConfigProvider>
  );
}
