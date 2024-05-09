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
        top: 10%; /* Padding from the top of the screen */
        left: 50%;
        transform: translateX(-50%);
        background-color: #FF8E24; /* Neutral dark background */
        color: #f0f0f0; /* Soft white text */
        padding: 12px 24px; /* Padding adjusted for better spacing */
        border-radius: 8px; /* Slightly larger border radius for a smoother look */
        z-index: 1000;
        text-align: center;
        width: 300px; /* Fixed width */
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); /* Subtle shadow for depth */
        font-size: 18px; /* Standard text size */
        font-weight: 500; /* Medium font weight for better legibility */
        word-wrap: break-word; /* Ensures text wraps within the container */
        overflow: hidden; /* Prevents text from spilling out */
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
