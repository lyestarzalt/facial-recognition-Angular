import { NgModule } from '@angular/core';
//@Author: Lyes Tarzalt
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Renderer2,
} from '@angular/core';

import { FaceDetectionService } from '@services/face-detection.service';
import { NavigationExtras, Router } from '@angular/router';
import { CameraService } from '@services/camera.service';
import { LoggerService } from '@services/logger.service';
import { CustomToastComponent } from '@components/custom-toast/custom-toast.component';

enum ToastState {
  None = 'none',
  Position = 'position',
  SingleFace = 'singleFace',
  HoldStill = 'holdStill',
}

@Component({
  selector: 'app-face-detection',
  templateUrl: 'face-detection.page.html',
  styleUrls: ['face-detection.page.scss'],
})
export class FaceDetectionPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('faceHole') faceHole!: ElementRef;
  @ViewChild('customToast') customToast!: CustomToastComponent;
  @ViewChild('glowWrapper') glowWrapper!: ElementRef;

  private conditionMetSince: number | null = null;
  //! If true, visual representations of both boxes will be displayed.
  private isDebugMode: boolean = false;
  private currentToastState: ToastState = ToastState.None;

  private isActionTaken: boolean = false;
  private canvas!: HTMLCanvasElement;
  //In percent
  private minimumFaceCoveragePercent: number = 30;
  private tooCloseThresholdPercent: number = 100;
  private tooFarThresholdPercent: number = 30;

  constructor(
    private router: Router,
    private cameraService: CameraService,
    private logger: LoggerService,
    private renderer: Renderer2,
    private faceDetectionService: FaceDetectionService
  ) {}

  ngOnInit(): void {
    this.faceDetectionService.initFaceMesh();
  }
  async ngAfterViewInit(): Promise<void> {
    console.log(this.glowWrapper);
    this.canvas = this.canvasElement.nativeElement;
    const video: HTMLVideoElement = this.videoElement.nativeElement;

    try {
      await this.faceDetectionService.initFaceMesh();
      await this.startVideo(video);
    } catch (error) {
      this.logger.error('Initialization failed', error);
    }
  }

  ngOnDestroy(): void {
    this.cameraService.stopCamera();
  }

  private startVideo(video: HTMLVideoElement): void {
    this.cameraService
      .startCamera(video)
      .then(() => {
        this.logger.info('Video started');
        this.faceDetectionService.startDetection(video, (results) =>
          this.onResults(results, this.canvas, video)
        );
      })
      .catch((error) => {
        this.logger.error('Error accessing the camera', error);
      });
  }
  /**
   * Processes face detection results, updating UI based on the presence and position of faces.
   * @param results Detection results from FaceMesh.
   * @param canvas Canvas element for drawing debug info or face mesh.
   * @param video Video element where faces are being detected.
   */
  private onResults(
    results: any,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
  ): void {
    if (
      !results.multiFaceLandmarks ||
      results.multiFaceLandmarks.length === 0
    ) {
this.customToast.show('Align your face within the frame.');
      this.resetAction();
      return;
    }
    this.handleFaceDetectionResults(results, canvas, video);
  }
  /**
   * Analyzes detection results and updates application state and UI accordingly.
   * @param results Detection results to analyze.
   * @param canvas Canvas element for additional processing or feedback.
   * @param video Video element related to the results.
   */
  private handleFaceDetectionResults(
    results: any,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
  ): void {
    let newState: ToastState = ToastState.None;
    let message = 'Position your face within the frame.';

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      if (results.multiFaceLandmarks.length > 1) {
        newState = ToastState.SingleFace;
        message = 'Only one face, please';
      } else {
        const faceLandmarks = results.multiFaceLandmarks[0];
        const scaledLandmarks =
          this.faceDetectionService.calculateFaceRegionBox(
            faceLandmarks,
            canvas,
            video
          );
        const guidanceBox = this.faceDetectionService.calculateFixedRegionBox(
          canvas,
          video
        );
        const { isWithinGuidance, isTooClose, isTooFar, positionOffset } =
          this.faceDetectionService.checkCondition(
            scaledLandmarks,
            guidanceBox,
            this.minimumFaceCoveragePercent,
            this.tooCloseThresholdPercent,
            this.tooFarThresholdPercent
          );
        if (this.isDebugMode) {
          this.faceDetectionService.drawMesh(
            results.multiFaceLandmarks[0],
            canvas,
            video
          );
        }
        if (isWithinGuidance) {
          newState = ToastState.HoldStill;
          message = 'Hold still.';
        }
        if (isTooClose) {
          newState = ToastState.Position;
          message = 'Too close! Move back a bit.'
        }
        if (isTooFar) {
          newState = ToastState.Position;
          message = 'A bit too far! Step closer, please.';
        }
      }
    }

    this.updateToast(newState, message);
  }

  private updateToast(newState: ToastState, message: string): void {
    if (newState !== this.currentToastState) {
      this.currentToastState = newState;
      this.customToast.show(message);
    }

    if (newState === ToastState.HoldStill) {
      this.handleConditionMet();
    } else {
      this.resetAction();
    }
  }

  /**
   * Takes appropriate action when a face detection condition has been met.
   */
  private handleConditionMet(): void {
    this.renderer.setStyle(
      this.glowWrapper.nativeElement,
      'box-shadow',
      '0 0 15px 3px green, 0 0 25px 15px green'
    );
    /*     this.renderer.setStyle(
      this.faceHole.nativeElement,
      'border',
      '8px solid green'
    );
 */
    if (this.conditionMetSince === null) {
      this.conditionMetSince = Date.now();
      // Show the custom toast message when the condition is first met
      this.customToast.show('Hold still, please.');
    }

    if (!this.isActionTaken && Date.now() - this.conditionMetSince >= 2000) {
      this.takeAction();
      this.isActionTaken = true;
      this.customToast.hide();
    }
  }
  /**
   * Resets the action state, clearing any conditions met or actions taken.
   */
  private resetAction(): void {
    this.renderer.setStyle(
      this.glowWrapper.nativeElement,
      'box-shadow',
      '0 0 10px 2px grey, 0 0 20px 10px grey'
    );
    this.conditionMetSince = null;
    this.isActionTaken = false;
    // Reset to default when condition is not met
    this.renderer.setStyle(
      this.faceHole.nativeElement,
      'border',
      '5px solid transparent'
    );
  }
  /**
   * Cature the current frame from the video element.
   */
  private takeAction(): void {
    // Create a new canvas element because we want the raw footage
    // and non inverted

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = this.videoElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to the canvas so we can save the picture
    context!.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL();

    this.flashScreenEffect();

    const navigationExtras: NavigationExtras = {
      state: { image: imageDataUrl },
    };

    this.router.navigate(['/loading-page'], navigationExtras);
    this.resetAction();
  }
  /**
   * Briefly flashes the screen white to indicate photo capture.
   */
  private flashScreenEffect(): void {
    const overlay = this.renderer.createElement('div');
    this.renderer.setStyle(overlay, 'position', 'fixed');
    this.renderer.setStyle(overlay, 'top', '0');
    this.renderer.setStyle(overlay, 'left', '0');
    this.renderer.setStyle(overlay, 'width', '100vw');
    this.renderer.setStyle(overlay, 'height', '100vh');
    this.renderer.setStyle(
      overlay,
      'backgroundColor',
      'rgba(255, 255, 255, 1)'
    );
    this.renderer.setStyle(overlay, 'zIndex', '10000');

    overlay.animate(
      [
        { backgroundColor: 'rgba(255, 255, 255, 1)' },
        { backgroundColor: 'transparent' },
      ],
      {
        duration: 800,
        fill: 'forwards',
      }
    );
    this.renderer.appendChild(document.body, overlay);

    setTimeout(() => {
      this.renderer.removeChild(document.body, overlay);
    }, 800);
  }
}
