import { type ExampleType, isValidExampleType } from './build-example';
import type { HeightMode } from './models';

export interface DebugPanelConfig {
  onExampleChange: (exampleType: ExampleType) => void;
  onAlignmentChange?: (alignment: string) => void;
  onVerticalAlignmentChange?: (verticalAlignment: string) => void;
  onProjectionChange?: (projection: string) => void;
  onWireframeChange?: (wireframe: boolean) => void;
  onHeightModeChange?: (heightMode: HeightMode) => void;
  onThemeChange?: (theme: 'dark' | 'light') => void;
  onAxisHelperChange?: (show: boolean) => void;
}

export class DebugPanel {
  private static readonly STORAGE_KEY = 'three-js-layouter-example-selected';
  private static readonly ALIGNMENT_STORAGE_KEY = 'three-js-layouter-alignment-selected';
  private static readonly VERTICAL_ALIGNMENT_STORAGE_KEY =
    'three-js-layouter-vertical-alignment-selected';
  private static readonly PROJECTION_STORAGE_KEY = 'three-js-layouter-projection-selected';
  private static readonly WIREFRAME_STORAGE_KEY = 'three-js-layouter-wireframe-enabled';
  private static readonly HEIGHT_MODE_STORAGE_KEY = 'three-js-layouter-height-mode-selected';
  private static readonly THEME_STORAGE_KEY = 'three-js-layouter-theme-selected';
  private static readonly AXIS_HELPER_STORAGE_KEY = 'three-js-layouter-axis-helper-enabled';
  private config: DebugPanelConfig;
  private radioButtons: NodeListOf<HTMLInputElement>;
  private alignmentButtons: NodeListOf<HTMLInputElement>;
  private verticalAlignmentButtons: NodeListOf<HTMLInputElement>;
  private projectionButtons: NodeListOf<HTMLInputElement>;
  private wireframeCheckbox: HTMLInputElement;
  private heightModeButtons: NodeListOf<HTMLInputElement>;
  private themeButtons: NodeListOf<HTMLInputElement>;
  private axisHelperCheckbox: HTMLInputElement;

  constructor(config: DebugPanelConfig) {
    this.config = config;
    this.radioButtons = document.querySelectorAll(
      'input[name="example"]'
    ) as NodeListOf<HTMLInputElement>;
    this.alignmentButtons = document.querySelectorAll(
      'input[name="alignment"]'
    ) as NodeListOf<HTMLInputElement>;
    this.verticalAlignmentButtons = document.querySelectorAll(
      'input[name="verticalAlignment"]'
    ) as NodeListOf<HTMLInputElement>;
    this.projectionButtons = document.querySelectorAll(
      'input[name="projection"]'
    ) as NodeListOf<HTMLInputElement>;
    this.wireframeCheckbox = document.querySelector('input[name="wireframe"]') as HTMLInputElement;
    this.heightModeButtons = document.querySelectorAll(
      'input[name="heightMode"]'
    ) as NodeListOf<HTMLInputElement>;
    this.themeButtons = document.querySelectorAll(
      'input[name="theme"]'
    ) as NodeListOf<HTMLInputElement>;
    this.axisHelperCheckbox = document.querySelector(
      'input[name="axisHelper"]'
    ) as HTMLInputElement;
  }

  initialize(): void {
    this.loadSavedState();
    this.setupEventListeners();
  }

  getSavedExample(): string | null {
    return localStorage.getItem(DebugPanel.STORAGE_KEY);
  }

  getSavedAlignment(): string | null {
    return localStorage.getItem(DebugPanel.ALIGNMENT_STORAGE_KEY);
  }

  getSavedVerticalAlignment(): string | null {
    return localStorage.getItem(DebugPanel.VERTICAL_ALIGNMENT_STORAGE_KEY);
  }

  getSavedProjection(): string | null {
    return localStorage.getItem(DebugPanel.PROJECTION_STORAGE_KEY);
  }

  getSavedWireframe(): boolean {
    const saved = localStorage.getItem(DebugPanel.WIREFRAME_STORAGE_KEY);
    return saved === 'true';
  }

  getSavedHeightMode(): HeightMode {
    const saved = localStorage.getItem(DebugPanel.HEIGHT_MODE_STORAGE_KEY);
    return saved === 'fixed' || saved === 'dynamic' ? saved : 'dynamic';
  }

  getSavedTheme(): 'dark' | 'light' {
    const saved = localStorage.getItem(DebugPanel.THEME_STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : 'dark';
  }

  getSavedAxisHelper(): boolean {
    const saved = localStorage.getItem(DebugPanel.AXIS_HELPER_STORAGE_KEY);
    const result = saved === null ? true : saved === 'true'; // Default to true when no saved value
    console.log('[DEBUG] getSavedAxisHelper - saved:', saved, 'result:', result);
    return result;
  }

  private loadSavedState(): void {
    const savedExample = this.getSavedExample();
    if (savedExample) {
      this.setCurrentExample(savedExample);
      this.updateChildOptionsVisibility(savedExample);
    } else {
      // Default case - check which example is currently selected
      const checkedExample = document.querySelector(
        'input[name="example"]:checked'
      ) as HTMLInputElement;
      if (checkedExample) {
        this.updateChildOptionsVisibility(checkedExample.value);
      }
    }

    const savedAlignment = this.getSavedAlignment();
    if (savedAlignment) {
      this.setCurrentAlignment(savedAlignment);
    }

    const savedVerticalAlignment = this.getSavedVerticalAlignment();
    if (savedVerticalAlignment) {
      this.setCurrentVerticalAlignment(savedVerticalAlignment);
    }

    const savedProjection = this.getSavedProjection();
    if (savedProjection) {
      this.setCurrentProjection(savedProjection);
    }

    const savedWireframe = this.getSavedWireframe();
    this.setCurrentWireframe(savedWireframe);

    const savedHeightMode = this.getSavedHeightMode();
    this.setCurrentHeightMode(savedHeightMode);

    const savedTheme = this.getSavedTheme();
    this.setCurrentTheme(savedTheme);

    const savedAxisHelper = this.getSavedAxisHelper();
    this.setCurrentAxisHelper(savedAxisHelper);
    console.log('[DEBUG] Initial axis helper state set to:', savedAxisHelper);
  }

  private saveCurrentState(exampleType: string): void {
    localStorage.setItem(DebugPanel.STORAGE_KEY, exampleType);
  }

  private saveCurrentAlignment(alignment: string): void {
    localStorage.setItem(DebugPanel.ALIGNMENT_STORAGE_KEY, alignment);
  }

  private saveCurrentVerticalAlignment(verticalAlignment: string): void {
    localStorage.setItem(DebugPanel.VERTICAL_ALIGNMENT_STORAGE_KEY, verticalAlignment);
  }

  private saveCurrentProjection(projection: string): void {
    localStorage.setItem(DebugPanel.PROJECTION_STORAGE_KEY, projection);
  }

  private saveCurrentWireframe(wireframe: boolean): void {
    localStorage.setItem(DebugPanel.WIREFRAME_STORAGE_KEY, wireframe.toString());
  }

  private saveCurrentHeightMode(heightMode: HeightMode): void {
    localStorage.setItem(DebugPanel.HEIGHT_MODE_STORAGE_KEY, heightMode);
  }

  private saveCurrentTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem(DebugPanel.THEME_STORAGE_KEY, theme);
  }

  private saveCurrentAxisHelper(show: boolean): void {
    localStorage.setItem(DebugPanel.AXIS_HELPER_STORAGE_KEY, show.toString());
  }

  private setupEventListeners(): void {
    this.radioButtons.forEach((radio) => {
      radio.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.checked && isValidExampleType(target.value)) {
          this.saveCurrentState(target.value);
          this.updateChildOptionsVisibility(target.value);
          this.config.onExampleChange(target.value);
        }
      });
    });

    this.alignmentButtons.forEach((radio) => {
      radio.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
          this.saveCurrentAlignment(target.value);
          this.config.onAlignmentChange?.(target.value);
        }
      });
    });

    this.verticalAlignmentButtons.forEach((radio) => {
      radio.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
          this.saveCurrentVerticalAlignment(target.value);
          this.config.onVerticalAlignmentChange?.(target.value);
        }
      });
    });

    this.projectionButtons.forEach((radio) => {
      radio.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
          this.saveCurrentProjection(target.value);
          this.config.onProjectionChange?.(target.value);
        }
      });
    });

    this.wireframeCheckbox.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      this.saveCurrentWireframe(target.checked);
      this.config.onWireframeChange?.(target.checked);
    });

    this.heightModeButtons.forEach((radio) => {
      radio.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.checked && (target.value === 'fixed' || target.value === 'dynamic')) {
          this.saveCurrentHeightMode(target.value);
          this.config.onHeightModeChange?.(target.value);
        }
      });
    });

    this.themeButtons.forEach((radio) => {
      radio.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.checked && (target.value === 'dark' || target.value === 'light')) {
          this.saveCurrentTheme(target.value);
          this.config.onThemeChange?.(target.value);
        }
      });
    });

    this.axisHelperCheckbox.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      this.saveCurrentAxisHelper(target.checked);
      this.config.onAxisHelperChange?.(target.checked);
    });
  }

  setCurrentExample(exampleType: string): void {
    this.radioButtons.forEach((radio) => {
      radio.checked = radio.value === exampleType;
    });
  }

  setCurrentAlignment(alignment: string): void {
    this.alignmentButtons.forEach((radio) => {
      radio.checked = radio.value === alignment;
    });
  }

  setCurrentVerticalAlignment(verticalAlignment: string): void {
    this.verticalAlignmentButtons.forEach((radio) => {
      radio.checked = radio.value === verticalAlignment;
    });
  }

  setCurrentProjection(projection: string): void {
    this.projectionButtons.forEach((radio) => {
      radio.checked = radio.value === projection;
    });
  }

  setCurrentWireframe(wireframe: boolean): void {
    this.wireframeCheckbox.checked = wireframe;
  }

  setCurrentHeightMode(heightMode: HeightMode): void {
    this.heightModeButtons.forEach((radio) => {
      radio.checked = radio.value === heightMode;
    });
  }

  setCurrentTheme(theme: 'dark' | 'light'): void {
    this.themeButtons.forEach((radio) => {
      radio.checked = radio.value === theme;
    });
  }

  setCurrentAxisHelper(show: boolean): void {
    console.log('[DEBUG] setCurrentAxisHelper called with:', show);
    this.axisHelperCheckbox.checked = show;
  }

  private updateChildOptionsVisibility(exampleType: string): void {
    const horizontalAlignmentOptions = document.getElementById('horizontal-alignment-options');
    const verticalAlignmentOptions = document.getElementById('vertical-alignment-options');

    if (horizontalAlignmentOptions) {
      horizontalAlignmentOptions.style.display =
        exampleType === 'simple-horizontal' ? 'block' : 'none';
    }

    if (verticalAlignmentOptions) {
      verticalAlignmentOptions.style.display = exampleType === 'simple-vertical' ? 'block' : 'none';
    }
  }

  dispose(): void {
    this.radioButtons.forEach((radio) => {
      radio.removeEventListener('change', this.handleRadioChange);
    });
  }

  private handleRadioChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.checked && isValidExampleType(target.value)) {
      this.config.onExampleChange(target.value);
    }
  };
}
