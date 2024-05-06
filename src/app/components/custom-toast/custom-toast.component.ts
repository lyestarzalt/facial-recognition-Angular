import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-custom-toast',
  template: `
    <div *ngIf="visible" class="custom-toast">
      {{ message }}
    </div>
  `,
  styles: [
    `
      .custom-toast {
        position: fixed;
        top: 15%; /* Padding from the top of the screen */
        left: 50%;
        transform: translateX(-50%);
        background-color: orange; /* Orange background */
        color: white; /* White text */
        padding: 10px 20px; /* Increase padding */
        border-radius: 5px;
        z-index: 1000;
        text-align: center;
        max-width: 50%; /* Max width to prevent overly wide messages */
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Enhanced shadow for elevation effect */
        font-size: 20px; /* Larger text size */
        font-weight: bold; /* Bolder text for better readability */
      }
    `,
  ],
})
export class CustomToastComponent {
  @Input() message: string = '';
  visible: boolean = false;
  private autoHideTimeout?: number; // Track the auto-hide timeout ID

  show(message: string, persist: boolean = false): void {
    this.message = message;
    this.visible = true;

    // Clear any existing auto-hide timeout
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = undefined;
    }

    // Auto-hide after 3 seconds unless persist is true
    if (!persist) {
      this.autoHideTimeout = setTimeout(
        () => this.hide(),
        3000
      ) as unknown as number;
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
