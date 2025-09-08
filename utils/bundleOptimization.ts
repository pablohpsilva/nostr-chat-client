/**
 * Bundle Size Optimization & Performance
 * Advanced optimization techniques for production builds
 */

import { Platform } from "react-native";
import { analytics } from "./analytics";
import { performanceMonitor } from "./performanceMonitor";

// =============================================================================
// TYPES
// =============================================================================

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: BundleChunk[];
  dependencies: DependencyInfo[];
  duplicates: string[];
  unusedExports: string[];
  largeFiles: string[];
}

interface BundleChunk {
  name: string;
  size: number;
  modules: string[];
  isEntry: boolean;
  isAsync: boolean;
}

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  isDevDependency: boolean;
  usageCount: number;
  alternatives?: string[];
}

interface OptimizationConfig {
  enableTreeShaking: boolean;
  enableCodeSplitting: boolean;
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableMinification: boolean;
  enableCompression: boolean;
  targetBundleSize: number; // in KB
  chunkSizeWarning: number; // in KB
}

interface LoadingStrategy {
  critical: string[];
  important: string[];
  lazy: string[];
  preload: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: OptimizationConfig = {
  enableTreeShaking: true,
  enableCodeSplitting: true,
  enableLazyLoading: true,
  enableImageOptimization: true,
  enableMinification: true,
  enableCompression: true,
  targetBundleSize: 1000, // 1MB
  chunkSizeWarning: 250, // 250KB
};

const LARGE_DEPENDENCIES = [
  { name: "react", threshold: 100 },
  { name: "react-native", threshold: 500 },
  { name: "@nostr-dev-kit/ndk", threshold: 200 },
  { name: "dayjs", threshold: 50 },
  { name: "zustand", threshold: 30 },
];

const OPTIMIZATION_STRATEGIES = {
  images: {
    formats: ["webp", "avif", "jpg"],
    sizes: [400, 800, 1200],
    quality: 85,
  },
  fonts: {
    preload: ["Inter-Regular", "Inter-Bold"],
    fallbacks: ["system-ui", "sans-serif"],
  },
  scripts: {
    defer: true,
    async: false,
    integrity: true,
  },
} as const;

// =============================================================================
// BUNDLE OPTIMIZER
// =============================================================================

class BundleOptimizer {
  private config: OptimizationConfig = DEFAULT_CONFIG;
  private analysis: BundleAnalysis | null = null;
  private loadingStrategy: LoadingStrategy = {
    critical: [],
    important: [],
    lazy: [],
    preload: [],
  };

  /**
   * Initialize bundle optimizer
   */
  async initialize(): Promise<void> {
    try {
      await this.detectOptimizationOpportunities();
      this.setupLoadingStrategy();

      analytics.track("bundle_optimizer_initialized", {
        config: this.config,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error("Failed to initialize bundle optimizer:", error);
    }
  }

  /**
   * Analyze current bundle
   */
  async analyzBundle(): Promise<BundleAnalysis> {
    const startTime = Date.now();

    try {
      // Simulate bundle analysis (in real implementation, this would parse webpack stats)
      const analysis: BundleAnalysis = {
        totalSize: this.calculateTotalSize(),
        gzippedSize: this.calculateGzippedSize(),
        chunks: this.analyzeChunks(),
        dependencies: this.analyzeDependencies(),
        duplicates: this.findDuplicates(),
        unusedExports: this.findUnusedExports(),
        largeFiles: this.findLargeFiles(),
      };

      this.analysis = analysis;

      performanceMonitor.timeFunction("bundle_analysis", () => analysis, {
        bundleSize: analysis.totalSize,
      });

      analytics.track("bundle_analyzed", {
        totalSize: analysis.totalSize,
        gzippedSize: analysis.gzippedSize,
        chunkCount: analysis.chunks.length,
        dependencyCount: analysis.dependencies.length,
        analysisTime: Date.now() - startTime,
      });

      return analysis;
    } catch (error) {
      console.error("Bundle analysis failed:", error);
      throw error;
    }
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    expectedSavings: number;
    implementation: string;
  }> {
    if (!this.analysis) {
      return [
        {
          type: "analysis_required",
          severity: "high",
          description: "Run bundle analysis first",
          expectedSavings: 0,
          implementation: "Call analyzBundle() method",
        },
      ];
    }

    const recommendations = [];

    // Check bundle size
    if (this.analysis.totalSize > this.config.targetBundleSize * 1024) {
      recommendations.push({
        type: "bundle_size",
        severity: "high" as const,
        description: `Bundle size (${this.formatSize(
          this.analysis.totalSize
        )}) exceeds target (${this.formatSize(
          this.config.targetBundleSize * 1024
        )})`,
        expectedSavings:
          this.analysis.totalSize - this.config.targetBundleSize * 1024,
        implementation: "Enable code splitting and lazy loading",
      });
    }

    // Check for large chunks
    const largeChunks = this.analysis.chunks.filter(
      (chunk) => chunk.size > this.config.chunkSizeWarning * 1024
    );

    if (largeChunks.length > 0) {
      recommendations.push({
        type: "large_chunks",
        severity: "medium" as const,
        description: `${largeChunks.length} chunks exceed size warning threshold`,
        expectedSavings:
          largeChunks.reduce((sum, chunk) => sum + chunk.size, 0) * 0.3,
        implementation: "Split large chunks into smaller ones",
      });
    }

    // Check for duplicated dependencies
    if (this.analysis.duplicates.length > 0) {
      recommendations.push({
        type: "duplicate_dependencies",
        severity: "medium" as const,
        description: `${this.analysis.duplicates.length} duplicate dependencies found`,
        expectedSavings: this.analysis.duplicates.length * 50 * 1024, // Estimate
        implementation: "Use webpack-bundle-analyzer to eliminate duplicates",
      });
    }

    // Check for unused exports
    if (this.analysis.unusedExports.length > 0) {
      recommendations.push({
        type: "unused_exports",
        severity: "low" as const,
        description: `${this.analysis.unusedExports.length} unused exports detected`,
        expectedSavings: this.analysis.unusedExports.length * 10 * 1024, // Estimate
        implementation: "Enable tree shaking and remove unused exports",
      });
    }

    // Check for large dependencies
    const largeDeps = this.analysis.dependencies.filter(
      (dep) => dep.size > 100 * 1024
    );

    if (largeDeps.length > 0) {
      recommendations.push({
        type: "large_dependencies",
        severity: "medium" as const,
        description: `${largeDeps.length} large dependencies detected`,
        expectedSavings:
          largeDeps.reduce((sum, dep) => sum + dep.size, 0) * 0.2,
        implementation: "Consider lighter alternatives or lazy loading",
      });
    }

    return recommendations;
  }

  /**
   * Apply automatic optimizations
   */
  async applyOptimizations(): Promise<{
    applied: string[];
    skipped: string[];
    errors: string[];
    sizeBefore: number;
    sizeAfter: number;
  }> {
    const sizeBefore = this.analysis?.totalSize || 0;
    const applied: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    try {
      // Apply tree shaking
      if (this.config.enableTreeShaking) {
        try {
          await this.enableTreeShaking();
          applied.push("tree_shaking");
        } catch (error) {
          errors.push(`Tree shaking failed: ${error.message}`);
        }
      } else {
        skipped.push("tree_shaking");
      }

      // Apply code splitting
      if (this.config.enableCodeSplitting) {
        try {
          await this.enableCodeSplitting();
          applied.push("code_splitting");
        } catch (error) {
          errors.push(`Code splitting failed: ${error.message}`);
        }
      } else {
        skipped.push("code_splitting");
      }

      // Apply lazy loading
      if (this.config.enableLazyLoading) {
        try {
          await this.enableLazyLoading();
          applied.push("lazy_loading");
        } catch (error) {
          errors.push(`Lazy loading failed: ${error.message}`);
        }
      } else {
        skipped.push("lazy_loading");
      }

      // Apply image optimization
      if (this.config.enableImageOptimization) {
        try {
          await this.optimizeImages();
          applied.push("image_optimization");
        } catch (error) {
          errors.push(`Image optimization failed: ${error.message}`);
        }
      } else {
        skipped.push("image_optimization");
      }

      // Simulate size after optimization
      const sizeAfter = sizeBefore * (1 - applied.length * 0.1); // 10% reduction per optimization

      analytics.track("optimizations_applied", {
        applied: applied.length,
        skipped: skipped.length,
        errors: errors.length,
        sizeBefore,
        sizeAfter,
        sizeReduction: sizeBefore - sizeAfter,
      });

      return {
        applied,
        skipped,
        errors,
        sizeBefore,
        sizeAfter,
      };
    } catch (error) {
      console.error("Failed to apply optimizations:", error);
      throw error;
    }
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(): {
    summary: {
      totalSize: string;
      gzippedSize: string;
      chunkCount: number;
      score: number;
    };
    recommendations: Array<any>;
    loadingStrategy: LoadingStrategy;
    performanceMetrics: any;
  } {
    if (!this.analysis) {
      throw new Error("Bundle analysis required before generating report");
    }

    const recommendations = this.getOptimizationRecommendations();
    const score = this.calculateOptimizationScore();

    return {
      summary: {
        totalSize: this.formatSize(this.analysis.totalSize),
        gzippedSize: this.formatSize(this.analysis.gzippedSize),
        chunkCount: this.analysis.chunks.length,
        score,
      },
      recommendations,
      loadingStrategy: this.loadingStrategy,
      performanceMetrics: performanceMonitor.getMetrics(),
    };
  }

  /**
   * Monitor runtime performance
   */
  monitorRuntimePerformance(): {
    bundleLoadTime: number;
    chunkLoadTimes: Record<string, number>;
    memoryUsage: any;
    renderPerformance: any;
  } {
    const memoryUsage = performanceMonitor.getMemoryUsage();

    return {
      bundleLoadTime: performance.now(), // Simplified
      chunkLoadTimes: {}, // Would track actual chunk load times
      memoryUsage,
      renderPerformance: {
        // Would include actual render metrics
        fps: 60,
        renderTime: 16.67,
      },
    };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async detectOptimizationOpportunities(): Promise<void> {
    // Detect current environment and adjust config
    if (__DEV__) {
      // Development optimizations
      this.config.enableMinification = false;
      this.config.enableCompression = false;
    } else {
      // Production optimizations
      this.config.enableMinification = true;
      this.config.enableCompression = true;
    }

    // Platform-specific optimizations
    if (Platform.OS === "web") {
      this.config.enableCodeSplitting = true;
      this.config.enableLazyLoading = true;
    } else {
      // React Native has different optimization strategies
      this.config.enableCodeSplitting = false;
      this.config.targetBundleSize = 2000; // Larger target for mobile
    }
  }

  private setupLoadingStrategy(): void {
    this.loadingStrategy = {
      critical: [
        "react",
        "react-native",
        "expo",
        "@/components/Context",
        "@/utils/errorHandling",
      ],
      important: [
        "@/components/Chat",
        "@/hooks/nostr",
        "@/store",
        "@/utils/analytics",
      ],
      lazy: [
        "@/components/Examples",
        "@/utils/offlineSync",
        "@/utils/accessibility",
        "@/utils/security",
      ],
      preload: ["@/assets/fonts", "@/components/ui"],
    };
  }

  private calculateTotalSize(): number {
    // Simulate bundle size calculation
    return 850 * 1024; // 850KB
  }

  private calculateGzippedSize(): number {
    // Gzipped is typically 30-40% of original size
    return this.calculateTotalSize() * 0.35;
  }

  private analyzeChunks(): BundleChunk[] {
    // Simulate chunk analysis
    return [
      {
        name: "main",
        size: 400 * 1024,
        modules: ["react", "react-native", "expo"],
        isEntry: true,
        isAsync: false,
      },
      {
        name: "vendor",
        size: 300 * 1024,
        modules: ["@nostr-dev-kit/ndk", "dayjs", "zustand"],
        isEntry: false,
        isAsync: false,
      },
      {
        name: "chat",
        size: 150 * 1024,
        modules: ["@/components/Chat", "@/hooks/nostr"],
        isEntry: false,
        isAsync: true,
      },
    ];
  }

  private analyzeDependencies(): DependencyInfo[] {
    // Simulate dependency analysis
    return [
      {
        name: "react",
        version: "18.2.0",
        size: 42 * 1024,
        isDevDependency: false,
        usageCount: 50,
      },
      {
        name: "@nostr-dev-kit/ndk",
        version: "2.0.0",
        size: 180 * 1024,
        isDevDependency: false,
        usageCount: 15,
        alternatives: ["nostr-tools"],
      },
      {
        name: "dayjs",
        version: "1.11.0",
        size: 20 * 1024,
        isDevDependency: false,
        usageCount: 8,
        alternatives: ["date-fns", "native Date"],
      },
    ];
  }

  private findDuplicates(): string[] {
    // Simulate duplicate detection
    return ["react", "dayjs"];
  }

  private findUnusedExports(): string[] {
    // Simulate unused export detection
    return ["@/utils/unusedFunction", "@/components/OldComponent"];
  }

  private findLargeFiles(): string[] {
    // Simulate large file detection
    return ["@nostr-dev-kit/ndk (180KB)", "@/assets/large-image.png (250KB)"];
  }

  private async enableTreeShaking(): Promise<void> {
    // Simulate tree shaking implementation
    console.log("Enabling tree shaking...");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async enableCodeSplitting(): Promise<void> {
    // Simulate code splitting implementation
    console.log("Enabling code splitting...");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async enableLazyLoading(): Promise<void> {
    // Simulate lazy loading implementation
    console.log("Enabling lazy loading...");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async optimizeImages(): Promise<void> {
    // Simulate image optimization
    console.log("Optimizing images...");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private calculateOptimizationScore(): number {
    if (!this.analysis) return 0;

    let score = 100;

    // Deduct points for size issues
    if (this.analysis.totalSize > this.config.targetBundleSize * 1024) {
      score -= 20;
    }

    // Deduct points for large chunks
    const largeChunks = this.analysis.chunks.filter(
      (chunk) => chunk.size > this.config.chunkSizeWarning * 1024
    );
    score -= largeChunks.length * 10;

    // Deduct points for duplicates
    score -= this.analysis.duplicates.length * 5;

    // Deduct points for unused exports
    score -= this.analysis.unusedExports.length * 2;

    return Math.max(0, score);
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// =============================================================================
// REACT HOOKS
// =============================================================================

import { useCallback, useEffect, useState } from "react";

/**
 * Hook for bundle optimization monitoring
 */
export function useBundleOptimization() {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const result = await bundleOptimizer.analyzBundle();
      setAnalysis(result);
    } catch (error) {
      console.error("Bundle analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const getRecommendations = useCallback(() => {
    return bundleOptimizer.getOptimizationRecommendations();
  }, [analysis]);

  return {
    analysis,
    isAnalyzing,
    runAnalysis,
    getRecommendations,
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const runtimeMetrics = bundleOptimizer.monitorRuntimePerformance();
      setMetrics(runtimeMetrics);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return { metrics };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const bundleOptimizer = new BundleOptimizer();

export type {
  BundleAnalysis,
  BundleChunk,
  DependencyInfo,
  LoadingStrategy,
  OptimizationConfig,
};

export {
  OPTIMIZATION_STRATEGIES,
  useBundleOptimization,
  usePerformanceMonitoring,
};
