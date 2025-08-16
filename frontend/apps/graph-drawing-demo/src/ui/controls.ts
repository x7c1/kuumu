export interface DependencyListItem {
  id: number;
  label: string;
}

export class UIControls {
  private dependencyInput: HTMLInputElement;
  private algorithmSelect: HTMLSelectElement;
  private dependencyItems: HTMLElement;

  constructor() {
    this.dependencyInput = document.getElementById('dependency-input') as HTMLInputElement;
    this.algorithmSelect = document.getElementById('algorithm-select') as HTMLSelectElement;
    this.dependencyItems = document.getElementById('dependency-items') as HTMLElement;

    if (!this.dependencyInput || !this.algorithmSelect || !this.dependencyItems) {
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
}
