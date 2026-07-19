"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { itemById } from "./items";
import type { FactoryPlan } from "./types";

const materialColors: Record<string, string> = {
  metal: "#728091",
  wood: "#b87a42",
  plastic: "#46a7b6",
  seeds: "#6ca848",
  minerals: "#9b8775",
  chemicals: "#7466c6",
  textiles: "#d96f9b",
  sugarspices: "#c89c35",
  glass: "#5fa8d3",
  animalfeed: "#ad915c",
  electricalcomponents: "#e3aa21",
};

interface ScheduleChartProps {
  plan: FactoryPlan;
}

interface TooltipDatum {
  value?: number;
  data?: {
    value?: number;
    itemName?: string;
    startMinutes?: number;
    endMinutes?: number;
  };
}

export function ScheduleChart({ plan }: ScheduleChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const maxJobsPerSlot = Math.max(
      0,
      ...plan.schedules.map((schedule) => schedule.jobs.length),
    );

    return {
      animationDuration: 280,
      grid: { left: 64, right: 28, top: 20, bottom: 42 },
      tooltip: {
        trigger: "item",
        formatter: (rawParams: unknown) => {
          const params = rawParams as TooltipDatum;
          const datum = params.data;
          if (!datum?.itemName || !datum.value) return "";
          return [
            `<strong>${datum.itemName}</strong>`,
            `生产：${datum.value} 分钟`,
            `时段：${datum.startMinutes} → ${datum.endMinutes} 分钟`,
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: Math.max(1, plan.makespanMinutes),
        name: "分钟",
        nameLocation: "end",
        axisLine: { lineStyle: { color: "#aab5ae" } },
        splitLine: { lineStyle: { color: "#edf0ee", type: "dashed" } },
        axisLabel: { color: "#738078" },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: plan.schedules.map((schedule) => `槽位 ${schedule.slot + 1}`),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: "#405047", fontWeight: 600 },
      },
      series: Array.from({ length: maxJobsPerSlot }, (_, jobIndex) => ({
        type: "bar",
        stack: "factory",
        barWidth: 24,
        data: plan.schedules.map((schedule) => {
          const job = schedule.jobs[jobIndex];
          if (!job) {
            return { value: 0, itemStyle: { opacity: 0 } };
          }
          return {
            value: job.durationMinutes,
            itemName: itemById[job.itemId].name,
            startMinutes: job.startMinutes,
            endMinutes: job.endMinutes,
            itemStyle: {
              color: materialColors[job.itemId] ?? "#4f8f6b",
              borderColor: "#ffffff",
              borderWidth: 1,
              borderRadius: 4,
            },
          };
        }),
        emphasis: { focus: "series" },
      })),
    } as EChartsOption;
  }, [plan]);

  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ height: Math.max(250, plan.schedules.length * 46 + 72) }}
    />
  );
}
