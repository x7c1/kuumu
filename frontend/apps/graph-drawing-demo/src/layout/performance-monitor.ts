export interface PerformanceMetrics {
  algorithmName: string;
  executionTime: number; // milliseconds
  nodeCount: number;
  edgeCount: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxHistorySize = 50;

  measureAlgorithm<T>(
    algorithmName: string,
    nodeCount: number,
    edgeCount: number,
    algorithm: () => T
  ): { result: T; metrics: PerformanceMetrics } {
    const startTime = performance.now();
    const result = algorithm();
    const endTime = performance.now();

    const metrics: PerformanceMetrics = {
      algorithmName,
      executionTime: endTime - startTime,
      nodeCount,
      edgeCount,
      timestamp: Date.now(),
    };

    this.addMetrics(metrics);

    return { result, metrics };
  }

  private addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxHistorySize) {
      this.metrics = this.metrics.slice(-this.maxHistorySize);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getAverageExecutionTime(algorithmName?: string): number {
    const relevantMetrics = algorithmName
      ? this.metrics.filter((m) => m.algorithmName === algorithmName)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const totalTime = relevantMetrics.reduce((sum, m) => sum + m.executionTime, 0);
    return totalTime / relevantMetrics.length;
  }

  getMetricsByAlgorithm(): Map<string, PerformanceMetrics[]> {
    const byAlgorithm = new Map<string, PerformanceMetrics[]>();

    this.metrics.forEach((metric) => {
      const existing = byAlgorithm.get(metric.algorithmName) || [];
      existing.push(metric);
      byAlgorithm.set(metric.algorithmName, existing);
    });

    return byAlgorithm;
  }

  clear(): void {
    this.metrics = [];
  }

  formatExecutionTime(time: number): string {
    if (time < 1) {
      return `${(time * 1000).toFixed(1)}μs`;
    } else if (time < 1000) {
      return `${time.toFixed(2)}ms`;
    } else {
      return `${(time / 1000).toFixed(2)}s`;
    }
  }
}
