import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-custom-toast',
  template: `
    <div *ngIf="visible" class="custom-toast" [ngClass]="color">
      {{ message }}
    </div>
  `,
  styles: [
    `
      .custom-toast {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        background-color: black;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
      }
      .dark {
        background-color: #555;
      }
      .light {
        background-color: #ddd;
        color: #333;
      }
    `,
  ],
})
export class CustomToastComponent {
  @Input() message: string = '';
  @Input() color: 'dark' | 'light' = 'dark';
  visible: boolean = false;
  private autoHideTimeout?: number; // Track the auto-hide timeout ID

  show(
    message: string,
    color: 'dark' | 'light' = 'dark',
    persist: boolean = false
  ): void {
    this.message = message;
    this.color = color;
    this.visible = true;

    // Clear any existing auto-hide
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = undefined;
    }

    // Auto-hide after 3 seconds unless persist is true
    if (!persist) {
      
this.autoHideTimeout = setTimeout(() => this.hide(), 3000) as unknown as number;
    }
  }

  hide(): void {
    this.visible = false;
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = undefined;
    }
  }
}
