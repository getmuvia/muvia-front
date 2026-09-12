import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-banner',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './hero-banner.html',
  styleUrl: './hero-banner.css',
})
export class HeroBanner {
  readonly heroImage = '/images/hero/muvia-home-2026-09.webp';
  readonly heroImageAlt = 'Sala y comedor de un hogar contemporáneo con muebles variados y luz natural';
}
