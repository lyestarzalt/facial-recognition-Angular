//@Author: Lyes Tarzalt
import { Injectable } from '@angular/core';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { LoggerService } from '@services/logger.service';

interface FaceDetectionArea {
  topLeftX: number;
  topLeftY: number;
  bottomRightX: number;
  bottomRightY: number;
}

interface GuidanceBox {
  centerX: number;
  centerY: number;
  size: number;
}
interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}
interface CheckResult {
  isWithinGuidance: boolean;
  isTooClose: boolean;
  isTooFar: boolean;
  positionOffset: { x: number; y: number };
}

@Injectable({
  providedIn: 'root',
})
export class FaceDetectionService {
  private faceMesh!: FaceMesh;

  constructor(private logger: LoggerService) {}
  initFaceMesh(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.faceMesh) {
        resolve();
        return;
      }

      this.faceMesh = new FaceMesh({
        locateFile: (file) => `assets/face_mesh/${file}`,
      });

      this.faceMesh.setOptions({
        maxNumFaces: 2,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.faceMesh.onResults((results) => {
        console.log('FaceMesh is ready and receiving results');
        resolve(); // Resolve once we are sure FaceMesh is operational
      });
    });
  }

  /**
   * Begins face detection on the given video element and processes results through a callback.
   * @param video HTMLVideoElement to perform detection on.
   * @param onResultsCallback Callback function to handle detection results.
   * @returns A promise that resolves when detection setup is complete.
   */
  startDetection(
    videoElement: HTMLVideoElement,
    onResultsCallback: (results: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.faceMesh) {
        reject('FaceMesh is not initialized.');
        return;
      }

      this.faceMesh.onResults(onResultsCallback);

      const onFrame = async () => {
        try {
          await this.faceMesh.send({ image: videoElement });
          requestAnimationFrame(onFrame);
        } catch (error) {
          this.logger.error('Error in face detection frame processing', error);
          reject(error);
        }
      };

      requestAnimationFrame(onFrame);
      resolve(); // Indicate that the setup is complete
    });
  }

  calculateFaceRegionBox(
    faceLandmarks: LandmarkPoint[],
    canvas: HTMLCanvasElement,
    videoElement: HTMLVideoElement
  ): FaceDetectionArea {
    //this.ensureCanvasSize(canvas, videoElement);
    let topLeftX = Infinity,
      topLeftY = Infinity,
      bottomRightX = 0,
      bottomRightY = 0;

    // Scaling factors based on the aspect ratio differences
    // between the video and the canvas
    let scale: number;
    let xOffset: number;
    let yOffset: number;
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    const videoAspectRatio = videoWidth / videoHeight;

    if (canvasAspectRatio > videoAspectRatio) {
      scale = canvasHeight / videoHeight;
      xOffset = (canvasWidth - videoWidth * scale) / 2;
      yOffset = 0;
    } else {
      scale = canvasWidth / videoWidth;
      xOffset = 0;
      yOffset = (canvasHeight - videoHeight * scale) / 2;
    }

    // Calculate the minimum and maximum x and y values of the face landmarks
    faceLandmarks.forEach(({ x, y }) => {
      const scaledX = x * videoWidth * scale + xOffset;
      const scaledY = y * videoHeight * scale + yOffset;

      topLeftX = Math.min(topLeftX, scaledX);
      bottomRightX = Math.max(bottomRightX, scaledX);
      topLeftY = Math.min(topLeftY, scaledY);
      bottomRightY = Math.max(bottomRightY, scaledY);
    });

    return {
      topLeftX: topLeftX,
      topLeftY: topLeftY,
      bottomRightX: bottomRightX,
      bottomRightY: bottomRightY,
    };
  }

  calculateFixedRegionBox(
    canvas: HTMLCanvasElement,
    videoElement: HTMLVideoElement
  ): GuidanceBox {
    // Ensure that the canvas size matches the size of the video element
    this.ensureCanvasSize(canvas, videoElement);

    const vw = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    );

    // Calculate the size of the central region (guidance box) as 70% of the viewport width
    // following simulate the face hole.
    const centralRegionSize = 0.8 * vw;

    // Calculate the coordinates of the top-left corner of the central region
    const centerX = (canvas.width - centralRegionSize) / 2;
    const centerY = (canvas.height - centralRegionSize) / 2;

    // Return an object containing the parameters defining the guidance box
    return {
      centerX: centerX,
      centerY: centerY,
      size: centralRegionSize,
    };
  }
  /**
   * Draws the face mesh on the canvas and performs condition checking for debugging purposes.
   *
   * @param faceLandmarks The landmarks of the detected face, containing coordinates of facial features.
   * @returns void
   */
  drawMesh(
    faceLandmarks: LandmarkPoint[],
    canvas: HTMLCanvasElement,
    videoElement: HTMLVideoElement
  ): void {
    if (!faceLandmarks) {
      this.logger.info('No landmarks to draw');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.logger.error('Unable to get canvas context');
      return;
    }

    // Set the canvas size to match the video element size
    const canvasWidth = videoElement.clientWidth;
    const canvasHeight = videoElement.clientHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear the previous frame
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const headBox = this.calculateFixedRegionBox(canvas, videoElement);
    ctx.strokeStyle = 'yellow';
    ctx.strokeRect(
      headBox.centerX,
      headBox.centerY,
      headBox.size,
      headBox.size
    );

    const faceRegion = this.calculateFaceRegionBox(
      faceLandmarks,
      canvas,
      videoElement
    );

    //const conditionMet = this.checkCondition(faceRegion, headBox ,0.5);

    //ctx.strokeStyle = conditionMet ? 'green' : 'red';

    ctx.lineWidth = 10;
    ctx.strokeRect(
      faceRegion.topLeftX,
      faceRegion.topLeftY,
      faceRegion.bottomRightX - faceRegion.topLeftX,
      faceRegion.bottomRightY - faceRegion.topLeftY
    );
  }

  /**
   * Checks if the detected face is properly positioned within the guidance box and meets size requirements.
   *
   * @param faceBoundingBox - Coordinates defining the detected face's bounding box.
   * @param yellowBox - Coordinates and size of the fixed guidance box.
   * @param minimumFaceCoverageRatio - Minimum required ratio of face area to guidance box area to consider face fully within the box.
   * @returns {CheckResult} - Result containing whether the face is within the guidance, too close, too far, and its positional offset relative to center.
   */
  checkCondition(
    faceBoundingBox: FaceDetectionArea,
    yellowBox: GuidanceBox,
    minimumFaceCoverageRatio: number
  ): CheckResult {
    if (!faceBoundingBox) {
      return {
        isWithinGuidance: false,
        isTooClose: false,
        isTooFar: false,
        positionOffset: { x: 0, y: 0 },
      };
    }

    const { topLeftX, topLeftY, bottomRightX, bottomRightY } = faceBoundingBox;
    const { centerX, centerY, size } = yellowBox;

    const faceWidth = bottomRightX - topLeftX;
    const faceHeight = bottomRightY - topLeftY;
    const faceCenterX = (bottomRightX + topLeftX) / 2;
    const faceCenterY = (bottomRightY + topLeftY) / 2;

    const isTopLeftInside = topLeftX >= centerX && topLeftY >= centerY;
    const isTopRightInside =
      bottomRightX <= centerX + size && topLeftY >= centerY;
    const isBottomLeftInside =
      topLeftX >= centerX && bottomRightY <= centerY + size;
    const isBottomRightInside =
      bottomRightX <= centerX + size && bottomRightY <= centerY + size;
    const allCornersInside =
      isTopLeftInside &&
      isTopRightInside &&
      isBottomLeftInside &&
      isBottomRightInside;

    const faceBoundingBoxArea = faceWidth * faceHeight;
    const guidanceBoxArea = size * size;
    const meetsMinimumCoverageRequirement =
      faceBoundingBoxArea >= minimumFaceCoverageRatio * guidanceBoxArea;

    // Determine size difference
    const sizeRatio = Math.sqrt(faceBoundingBoxArea / guidanceBoxArea);
    const isTooClose = sizeRatio > 1.0;
    const isTooFar = sizeRatio < 0.8; // You might adjust this threshold based on testing
   
    // Calculate position offset
    const positionOffset = {
      x: faceCenterX - (centerX + size / 2),
      y: faceCenterY - (centerY + size / 2),
    };

    return {
      isWithinGuidance: allCornersInside && meetsMinimumCoverageRequirement,
      isTooClose,
      isTooFar,
      positionOffset,
    };
  }
  /**
   * Makes the canvas the same size as the video.
   * Sets canvas width and height to match the video's.
   * @param canvas The canvas element to resize.
   * @param videoElement The video element used as reference for resizing.
   */
  private ensureCanvasSize(
    canvas: HTMLCanvasElement,
    videoElement: HTMLVideoElement
  ): void {
    canvas.width = videoElement.clientWidth;
    canvas.height = videoElement.clientHeight;
  }
}
