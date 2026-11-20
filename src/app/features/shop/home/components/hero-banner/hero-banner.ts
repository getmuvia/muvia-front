import { TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-banner',
  imports: [TranslatePipe, UiTextPipe, NgOptimizedImage, RouterLink],
  templateUrl: './hero-banner.html',
  styles: `
    .hero-vignette {
      mask-image: linear-gradient(to bottom, var(--color-ink), transparent, var(--color-ink));
    }
  `,
})
export class HeroBanner {
  readonly heroImage = '/images/hero/muvia-home-2026-09.webp';
  readonly heroImageAlt = 'Sala y comedor de un hogar contemporáneo con muebles variados y luz natural';
}
