import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  private stream: MediaStream | null = null;

  constructor() {}

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    if (this.stream) {
      this.stopCamera(); 
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.srcObject = this.stream;
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(resolve).catch(reject);
        };
      });
    } catch (error) {
      console.error('Error accessing the camera', error);
      throw new Error('Unable to access the camera.');
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  snapPicture(videoElement: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    }
    return '';
  }
}
