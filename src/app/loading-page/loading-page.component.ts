import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular'; // Import ToastController

@Component({
  selector: 'app-loading-page',
  templateUrl: './loading-page.component.html',
  styleUrls: ['./loading-page.component.scss'],
})
export class LoadingPageComponent implements OnInit {
  imageDataUrl: string | null = null; // Image captured
  loading: boolean = true;

  constructor(
    private router: Router,
    private toastController: ToastController // Inject ToastController
  ) {} // Inject MatSnackBar

  ngOnInit() {
    const routerState = this.router.getCurrentNavigation()?.extras.state;
    if (routerState && routerState['image']) {
      this.imageDataUrl = routerState['image'];
    }
    setTimeout(() => {
      this.loading = false;
    }, 2000);
  }

  async retakePicture() {
    this.router.navigate(['/']); // Navigate to the root which loads face detection
  }

  async proceedWithPicture() {
    const toast = await this.toastController.create({
      message: 'Proceeding with picture Api call...etc',
      duration: 2000,
      position: 'bottom',
    });
    toast.present();
  }
}
