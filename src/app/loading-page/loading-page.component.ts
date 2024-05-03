//@Author: Lyes Tarzalt
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loading-page',
  templateUrl: './loading-page.component.html',
  styleUrls: ['./loading-page.component.scss'],
})
export class LoadingPageComponent implements OnInit {
  imageDataUrl: string | null = null; // Image captured
  loading: boolean = true;

  constructor(private router: Router) {}

  ngOnInit() {
    const routerState = this.router.getCurrentNavigation()?.extras.state;
    if (routerState && routerState['image']) {
      this.imageDataUrl = routerState['image'];
    }
    // Simulate loading for 2 seconds
    setTimeout(() => {
      this.loading = false;
    }, 2000);
  }
}
