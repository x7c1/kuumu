export interface DependencyListItem {
  id: number;
  label: string;
}

export interface AlgorithmParameters {
  [key: string]: number;
}

export class UIControls {
  private dependencyInput: HTMLInputElement;
  private algorithmSelect: HTMLSelectElement;
  private dependencyItems: HTMLElement;
  private parametersContainer: HTMLElement;
  private applyLayoutBtn: HTMLElement;
  private clearGraphBtn: HTMLElement;
  private performanceMetricsContainer: HTMLElement;
  private showComparisonBtn: HTMLElement;
  private comparisonModal: HTMLElement;
  private closeComparisonBtn: HTMLElement;
  private comparisonDataContainer: HTMLElement;

  constructor() {
    this.dependencyInput = document.getElementById('dependency-input') as HTMLInputElement;
    this.algorithmSelect = document.getElementById('algorithm-select') as HTMLSelectElement;
    this.dependencyItems = document.getElementById('dependency-items') as HTMLElement;
    this.parametersContainer = document.getElementById('algorithm-parameters') as HTMLElement;
    this.applyLayoutBtn = document.getElementById('apply-layout-btn') as HTMLElement;
    this.clearGraphBtn = document.getElementById('clear-graph-btn') as HTMLElement;
    this.performanceMetricsContainer = document.getElementById(
      'performance-metrics'
    ) as HTMLElement;
    this.showComparisonBtn = document.getElementById('show-comparison-btn') as HTMLElement;
    this.comparisonModal = document.getElementById('comparison-modal') as HTMLElement;
    this.closeComparisonBtn = document.getElementById('close-comparison-btn') as HTMLElement;
    this.comparisonDataContainer = document.getElementById('comparison-data') as HTMLElement;

    if (
      !this.dependencyInput ||
      !this.algorithmSelect ||
      !this.dependencyItems ||
      !this.parametersContainer ||
      !this.applyLayoutBtn ||
      !this.clearGraphBtn ||
      !this.performanceMetricsContainer ||
      !this.showComparisonBtn ||
      !this.comparisonModal ||
      !this.closeComparisonBtn ||
      !this.comparisonDataContainer
    ) {
      throw new Error('Required UI elements not found');
    }
  }

  onDependencyAdd(callback: (input: string) => void): void {
    this.dependencyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = this.dependencyInput.value.trim();
        if (value) {
          callback(value);
          this.dependencyInput.value = '';
        }
      }
    });
  }

  onAlgorithmChange(callback: (algorithm: string) => void): void {
    this.algorithmSelect.addEventListener('change', () => {
      callback(this.algorithmSelect.value);
    });
  }

  onDependencyRemove(callback: (id: number) => void): void {
    this.dependencyItems.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('remove-btn')) {
        const id = parseInt(target.dataset.id || '0');
        if (id > 0) {
          callback(id);
        }
      }
    });
  }

  updateDependencyList(dependencies: DependencyListItem[]): void {
    if (dependencies.length === 0) {
      this.dependencyItems.innerHTML =
        '<div class="no-dependencies">No dependencies added yet</div>';
      return;
    }

    this.dependencyItems.innerHTML = dependencies
      .map(
        (dep) => `
        <div class="dependency-item">
          <span class="dependency-text">${dep.id}:${dep.label}</span>
          <button class="remove-btn" data-id="${dep.id}" title="Remove dependency">×</button>
        </div>
      `
      )
      .join('');
  }

  showError(message: string): void {
    // Create or update error display
    let errorDiv = document.querySelector('.error-message') as HTMLElement;
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      this.dependencyInput.parentNode?.insertBefore(errorDiv, this.dependencyInput.nextSibling);
    }

    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }, 3000);
  }

  clearError(): void {
    const errorDiv = document.querySelector('.error-message') as HTMLElement;
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  getCurrentAlgorithm(): string {
    return this.algorithmSelect.value;
  }

  onApplyLayout(callback: () => void): void {
    this.applyLayoutBtn.addEventListener('click', callback);
  }

  onClearGraph(callback: () => void): void {
    this.clearGraphBtn.addEventListener('click', callback);
  }

  onParameterChange(callback: (parameters: AlgorithmParameters) => void): void {
    this.parametersContainer.addEventListener('input', () => {
      callback(this.getCurrentParameters());
    });
  }

  updateParameterControls(algorithmKey: string): void {
    const parameterConfigs = this.getParameterConfig(algorithmKey);

    this.parametersContainer.innerHTML = '';

    if (parameterConfigs.length === 0) {
      this.parametersContainer.innerHTML =
        '<div class="no-parameters">No parameters for this algorithm</div>';
      return;
    }

    parameterConfigs.forEach((config) => {
      const parameterGroup = document.createElement('div');
      parameterGroup.className = 'parameter-group';

      parameterGroup.innerHTML = `
        <label for="${config.key}">${config.label}:</label>
        <input type="range"
               id="${config.key}"
               min="${config.min}"
               max="${config.max}"
               step="${config.step}"
               value="${config.default}"
               data-param="${config.key}">
        <div class="parameter-value">
          <span id="${config.key}-value">${config.default}</span> ${config.unit || ''}
        </div>
      `;

      this.parametersContainer.appendChild(parameterGroup);

      // Update value display when slider changes
      const slider = parameterGroup.querySelector(`#${config.key}`) as HTMLInputElement;
      const valueDisplay = parameterGroup.querySelector(`#${config.key}-value`) as HTMLElement;

      slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value;
      });
    });
  }

  getCurrentParameters(): AlgorithmParameters {
    const parameters: AlgorithmParameters = {};
    const inputs = this.parametersContainer.querySelectorAll(
      'input[data-param]'
    ) as NodeListOf<HTMLInputElement>;

    inputs.forEach((input) => {
      const paramName = input.dataset.param!;
      parameters[paramName] = parseFloat(input.value);
    });

    return parameters;
  }

  private getParameterConfig(algorithmKey: string): Array<{
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    default: number;
    unit?: string;
  }> {
    switch (algorithmKey) {
      case 'grid':
        return [
          {
            key: 'spacing',
            label: 'Spacing',
            min: 50,
            max: 200,
            step: 10,
            default: 100,
            unit: 'px',
          },
          { key: 'columns', label: 'Columns', min: 1, max: 10, step: 1, default: 3 },
        ];

      case 'circle':
        return [
          { key: 'radius', label: 'Radius', min: 50, max: 300, step: 10, default: 150, unit: 'px' },
        ];

      case 'force':
        return [
          {
            key: 'springLength',
            label: 'Spring Length',
            min: 50,
            max: 200,
            step: 10,
            default: 100,
            unit: 'px',
          },
          {
            key: 'springStrength',
            label: 'Spring Strength',
            min: 0.01,
            max: 0.5,
            step: 0.01,
            default: 0.1,
          },
          {
            key: 'repulsionForce',
            label: 'Repulsion Force',
            min: 500,
            max: 2000,
            step: 100,
            default: 1000,
          },
          { key: 'damping', label: 'Damping', min: 0.1, max: 0.99, step: 0.01, default: 0.9 },
          { key: 'iterations', label: 'Iterations', min: 10, max: 100, step: 5, default: 50 },
        ];

      case 'hierarchical':
        return [
          {
            key: 'levelHeight',
            label: 'Level Height',
            min: 50,
            max: 150,
            step: 10,
            default: 100,
            unit: 'px',
          },
          {
            key: 'nodeSpacing',
            label: 'Node Spacing',
            min: 40,
            max: 120,
            step: 10,
            default: 80,
            unit: 'px',
          },
        ];

      default:
        return [];
    }
  }

  updatePerformanceDisplay(
    latestMetrics: {
      algorithmName: string;
      executionTime: number;
      nodeCount: number;
      edgeCount: number;
    } | null,
    averageTime?: number
  ): void {
    if (!latestMetrics) {
      this.performanceMetricsContainer.innerHTML =
        '<div class="no-performance">No performance data available</div>';
      return;
    }

    const formatTime = (time: number): string => {
      if (time < 1) {
        return `${(time * 1000).toFixed(1)}μs`;
      } else if (time < 1000) {
        return `${time.toFixed(2)}ms`;
      } else {
        return `${(time / 1000).toFixed(2)}s`;
      }
    };

    let html = `
      <div class="performance-metric">
        <span class="performance-metric-label">Algorithm:</span>
        <span class="performance-metric-value">${latestMetrics.algorithmName}</span>
      </div>
      <div class="performance-metric">
        <span class="performance-metric-label">Execution Time:</span>
        <span class="performance-metric-value">${formatTime(latestMetrics.executionTime)}</span>
      </div>
      <div class="performance-metric">
        <span class="performance-metric-label">Nodes:</span>
        <span class="performance-metric-value">${latestMetrics.nodeCount}</span>
      </div>
      <div class="performance-metric">
        <span class="performance-metric-label">Edges:</span>
        <span class="performance-metric-value">${latestMetrics.edgeCount}</span>
      </div>
    `;

    if (averageTime !== undefined) {
      html += `
        <div class="performance-metric">
          <span class="performance-metric-label">Avg Time:</span>
          <span class="performance-metric-value">${formatTime(averageTime)}</span>
        </div>
      `;
    }

    this.performanceMetricsContainer.innerHTML = html;
  }

  clearPerformanceDisplay(): void {
    this.performanceMetricsContainer.innerHTML =
      '<div class="no-performance">No performance data available</div>';
  }

  onShowComparison(callback: () => void): void {
    this.showComparisonBtn.addEventListener('click', callback);
  }

  onCloseComparison(callback: () => void): void {
    this.closeComparisonBtn.addEventListener('click', callback);

    // Close when clicking outside the modal content
    this.comparisonModal.addEventListener('click', (e) => {
      if (e.target === this.comparisonModal) {
        callback();
      }
    });
  }

  showComparisonModal(
    comparisonData: Map<
      string,
      Array<{ executionTime: number; nodeCount: number; edgeCount: number }>
    >
  ): void {
    this.renderComparisonData(comparisonData);
    this.comparisonModal.style.display = 'flex';
  }

  hideComparisonModal(): void {
    this.comparisonModal.style.display = 'none';
  }

  private renderComparisonData(
    data: Map<string, Array<{ executionTime: number; nodeCount: number; edgeCount: number }>>
  ): void {
    if (data.size === 0) {
      this.comparisonDataContainer.innerHTML =
        '<div class="no-performance">No performance data available for comparison</div>';
      return;
    }

    const formatTime = (time: number): string => {
      if (time < 1) {
        return `${(time * 1000).toFixed(1)}μs`;
      } else if (time < 1000) {
        return `${time.toFixed(2)}ms`;
      } else {
        return `${(time / 1000).toFixed(2)}s`;
      }
    };

    // Calculate statistics for each algorithm
    const algorithmStats = new Map<
      string,
      {
        averageTime: number;
        minTime: number;
        maxTime: number;
        totalRuns: number;
        averageNodes: number;
        averageEdges: number;
      }
    >();

    data.forEach((metrics, algorithmName) => {
      const times = metrics.map((m) => m.executionTime);
      const nodes = metrics.map((m) => m.nodeCount);
      const edges = metrics.map((m) => m.edgeCount);

      algorithmStats.set(algorithmName, {
        averageTime: times.reduce((sum, t) => sum + t, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        totalRuns: metrics.length,
        averageNodes: nodes.reduce((sum, n) => sum + n, 0) / nodes.length,
        averageEdges: edges.reduce((sum, e) => sum + e, 0) / edges.length,
      });
    });

    // Find the fastest algorithm
    const fastestTime = Math.min(...Array.from(algorithmStats.values()).map((s) => s.averageTime));

    let html = `
      <p>Performance comparison across all tested algorithms:</p>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Avg Time</th>
            <th>Min Time</th>
            <th>Max Time</th>
            <th>Runs</th>
            <th>Avg Nodes</th>
            <th>Avg Edges</th>
          </tr>
        </thead>
        <tbody>
    `;

    Array.from(algorithmStats.entries())
      .sort(([, a], [, b]) => a.averageTime - b.averageTime)
      .forEach(([algorithmName, stats]) => {
        const isFastest = stats.averageTime === fastestTime;
        const timeClass = isFastest ? 'best-time' : '';

        html += `
          <tr>
            <td class="algorithm-name">${algorithmName}</td>
            <td class="${timeClass}">${formatTime(stats.averageTime)}</td>
            <td>${formatTime(stats.minTime)}</td>
            <td>${formatTime(stats.maxTime)}</td>
            <td>${stats.totalRuns}</td>
            <td>${Math.round(stats.averageNodes)}</td>
            <td>${Math.round(stats.averageEdges)}</td>
          </tr>
        `;
      });

    html += `
        </tbody>
      </table>
      <p style="margin-top: 15px; font-size: 11px; color: #6b7280;">
        <strong>Note:</strong> Performance can vary based on graph size and structure.
        The fastest algorithm is highlighted in green.
      </p>
    `;

    this.comparisonDataContainer.innerHTML = html;
  }
}
