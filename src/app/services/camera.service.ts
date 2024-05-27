import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  private stream: MediaStream | null = null;

  constructor() {}

  /**
   * Starts the camera and streams the video to the given video element.
   * Stops any existing stream before starting a new one.
   *
   * @param {HTMLVideoElement} videoElement - The video element to stream the camera feed to.
   * @return {Promise<void>} A promise that resolves when the camera feed starts successfully.
   * @throws Will throw an error if the camera access is denied or any other error occurs.
   * @memberof CameraService
   */
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

  /**
   * Stops the camera by stopping all tracks in the current media stream and setting the stream to null.
   *
   * @memberof CameraService
   */

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  /**
   * Captures a picture from the given video element and returns it as a base64-encoded PNG string.
   *
   * @param {HTMLVideoElement} videoElement - The video element to capture the picture from.
   * @return {string} The base64-encoded PNG image.
   * @throws Will throw an error if the drawing context cannot be obtained or any other error occurs.
   * @memberof CameraService
   */
  snapPicture(videoElement: HTMLVideoElement): string {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get the drawing context from the canvas');
      }
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error snapping picture:', error);
      throw error; // Propagate the error after logging it
    }
  }

  /**
   * Calculates the average brightness of the given video element.
   * The brightness is determined by scaling down the video and averaging the luminance of the pixels.
   *
   * @param {HTMLVideoElement} video - The video element to calculate the brightness from.
   * @param {HTMLCanvasElement} brightnessCanvas - The canvas element used for processing the video frame.
   * @return {number} The average brightness of the video element.
   * @memberof CameraService
   */

  calculateBrightness(
    video: HTMLVideoElement,
    brightnessCanvas: HTMLCanvasElement
  ): number {
    const context = brightnessCanvas.getContext('2d');

    // Reduce the size of the image processed
    const scaleFactor = 0.1;
    const scaledWidth = video.videoWidth * scaleFactor;
    const scaledHeight = video.videoHeight * scaleFactor;

    brightnessCanvas.width = scaledWidth;
    brightnessCanvas.height = scaledHeight;
    context!.drawImage(video, 0, 0, scaledWidth, scaledHeight);

    const imageData = context!.getImageData(0, 0, scaledWidth, scaledHeight);
    const data = imageData.data;
    let sumLuminance = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      sumLuminance += luminance;
    }

    const numPixels = scaledWidth * scaledHeight;
    return numPixels ? sumLuminance / numPixels : 0;
  }
}
