import { NgOptimizedImage } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-banner',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './hero-banner.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './hero-banner.css',
})
export class HeroBanner {
  heroImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjgjUCsnqRCjz9qiKutKFuTHmGoP2ZqXRwpOhSE8ZjfI6P1u8p2aRHFLDCz1fJjDn_5EmnomAG_iSVhBGTOqdIwkkmX2Fp5oRIUYj-Scve5xQABxlceHXpy3qVdb-N9fOIZv-TbA0POfZN3W1Ah5d9W6etktHa9XEEGihwjoW8eDoPAy18MQWg1-xaK8elVdgC0wk2fhRAtp-Q9olvR0LBc0rba_DzWZ79ZArJWh9SoAePvH8HBTIk4DRSAzmJCWYwyq26xLTFPlw';
}
