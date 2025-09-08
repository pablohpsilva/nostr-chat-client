/**
 * Performance monitoring utilities
 * Helps track and optimize app performance
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface MemoryUsage {
  used: number;
  total: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private memoryHistory: MemoryUsage[] = [];
  private maxHistorySize = 100;

  /**
   * Start timing a performance metric
   */
  startTiming(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End timing and calculate duration
   */
  endTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log performance metric in development
    if (__DEV__) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`, metric.metadata);
    }

    return duration;
  }

  /**
   * Time a function execution
   */
  timeFunction<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    this.startTiming(name, metadata);
    try {
      const result = fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  /**
   * Time an async function execution
   */
  async timeAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTiming(name, metadata);
    try {
      const result = await fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): void {
    if (typeof performance !== "undefined" && "memory" in performance) {
      const memory = (performance as any).memory;
      const usage: MemoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        timestamp: Date.now(),
      };

      this.memoryHistory.push(usage);

      // Keep history size manageable
      if (this.memoryHistory.length > this.maxHistorySize) {
        this.memoryHistory.shift();
      }

      if (__DEV__) {
        console.log(
          `📊 Memory: ${(usage.used / 1024 / 1024).toFixed(2)}MB / ${(
            usage.total /
            1024 /
            1024
          ).toFixed(2)}MB`
        );
      }
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryUsage | null {
    if (this.memoryHistory.length === 0) {
      this.recordMemoryUsage();
    }
    return this.memoryHistory[this.memoryHistory.length - 1] || null;
  }

  /**
   * Get performance metrics summary
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(
      (m) => m.duration !== undefined
    );
  }

  /**
   * Get memory usage history
   */
  getMemoryHistory(): MemoryUsage[] {
    return [...this.memoryHistory];
  }

  /**
   * Get average metric duration
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.getMetrics().filter((m) => m.name === name);
    if (metrics.length === 0) return null;

    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Clear memory history
   */
  clearMemoryHistory(): void {
    this.memoryHistory = [];
  }

  /**
   * Export performance data for analysis
   */
  exportData() {
    return {
      metrics: this.getMetrics(),
      memoryHistory: this.getMemoryHistory(),
      averageMetrics: this.getUniqueMetricNames().reduce(
        (acc, name) => {
          acc[name] = this.getAverageMetric(name);
          return acc;
        },
        {} as Record<string, number | null>
      ),
    };
  }

  /**
   * Get unique metric names
   */
  private getUniqueMetricNames(): string[] {
    const names = new Set(this.getMetrics().map((m) => m.name));
    return Array.from(names);
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export function usePerformanceMonitor() {
  const startTiming = (name: string, metadata?: Record<string, any>) => {
    performanceMonitor.startTiming(name, metadata);
  };

  const endTiming = (name: string) => {
    return performanceMonitor.endTiming(name);
  };

  const recordMemoryUsage = () => {
    performanceMonitor.recordMemoryUsage();
  };

  return {
    startTiming,
    endTiming,
    recordMemoryUsage,
    timeFunction: performanceMonitor.timeFunction.bind(performanceMonitor),
    timeAsyncFunction:
      performanceMonitor.timeAsyncFunction.bind(performanceMonitor),
  };
}

// Performance measurement decorators
export function measurePerformance(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.timeFunction(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        { name, args: args.length }
      );
    };

    return descriptor;
  };
}

export function measureAsyncPerformance(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.timeAsyncFunction(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        { name, args: args.length }
      );
    };

    return descriptor;
  };
}

export { performanceMonitor };
export type { MemoryUsage, PerformanceMetric };
