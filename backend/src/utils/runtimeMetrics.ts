import { monitorEventLoopDelay, performance } from 'perf_hooks';

export type EventLoopDelayMetrics = {
  minMs: number;
  maxMs: number;
  meanMs: number;
  stddevMs: number;
  p50Ms: number;
  p90Ms: number;
  p99Ms: number;
};

export type EventLoopUtilizationMetrics = {
  idle: number;
  active: number;
  utilization: number;
};

export type RuntimeMetrics = {
  uptimeSeconds: number;
  memory: NodeJS.MemoryUsage;
  resourceUsage: {
    userCPUSeconds: number;
    systemCPUSeconds: number;
    maxRSS: number;
    sharedMemorySize: number;
    unsharedDataSize: number;
    unsharedStackSize: number;
    minorPageFaults: number;
    majorPageFaults: number;
    voluntaryContextSwitches: number;
    involuntaryContextSwitches: number;
  };
  eventLoop: {
    delay: EventLoopDelayMetrics;
    utilization: EventLoopUtilizationMetrics;
  };
};

const eventLoopHistogram = monitorEventLoopDelay({ resolution: 20 });
eventLoopHistogram.enable();

let previousUtilization = performance.eventLoopUtilization();

function round(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function nsToMs(value: number): number {
  return round(value / 1e6, 3);
}

export function getRuntimeMetrics(): RuntimeMetrics {
  const uptimeSeconds = process.uptime();
  const memory = process.memoryUsage();
  const resource = process.resourceUsage();

  const currentUtilization = performance.eventLoopUtilization();
  const diff = performance.eventLoopUtilization(currentUtilization, previousUtilization);
  previousUtilization = currentUtilization;

  const delayMetrics: EventLoopDelayMetrics = {
    minMs: nsToMs(eventLoopHistogram.min),
    maxMs: nsToMs(eventLoopHistogram.max),
    meanMs: nsToMs(eventLoopHistogram.mean),
    stddevMs: nsToMs(eventLoopHistogram.stddev),
    p50Ms: nsToMs(eventLoopHistogram.percentile(50)),
    p90Ms: nsToMs(eventLoopHistogram.percentile(90)),
    p99Ms: nsToMs(eventLoopHistogram.percentile(99)),
  };

  eventLoopHistogram.reset();

  return {
    uptimeSeconds,
    memory,
    resourceUsage: {
      userCPUSeconds: round(resource.userCPUTime / 1e6, 6),
      systemCPUSeconds: round(resource.systemCPUTime / 1e6, 6),
      maxRSS: resource.maxRSS,
      sharedMemorySize: resource.sharedMemorySize,
      unsharedDataSize: resource.unsharedDataSize,
      unsharedStackSize: resource.unsharedStackSize,
      minorPageFaults: resource.minorPageFault,
      majorPageFaults: resource.majorPageFault,
      voluntaryContextSwitches: resource.voluntaryContextSwitches,
      involuntaryContextSwitches: resource.involuntaryContextSwitches,
    },
    eventLoop: {
      delay: delayMetrics,
      utilization: {
        idle: round(diff.idle, 6),
        active: round(diff.active, 6),
        utilization: round(diff.utilization, 6),
      },
    },
  };
}
