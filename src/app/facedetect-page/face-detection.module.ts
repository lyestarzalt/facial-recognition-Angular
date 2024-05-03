import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FaceDetectionPageRoutingModule } from './face-detection-routing.module';
import { FaceDetectionPage } from './face-detection.page';
import { CustomToastComponent } from '../components/custom-toast/custom-toast.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FaceDetectionPageRoutingModule,
  ],
  declarations: [FaceDetectionPage, CustomToastComponent],
})
export class FaceDetectionPageModule {}
