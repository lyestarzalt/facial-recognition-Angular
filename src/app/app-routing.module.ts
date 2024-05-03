import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoadingPageComponent } from 'src/app/loading-page/loading-page.component';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./facedetect-page/face-detection.module').then(
        (m) => m.FaceDetectionPageModule
      ),
  },
  { path: 'loading-page', component: LoadingPageComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
