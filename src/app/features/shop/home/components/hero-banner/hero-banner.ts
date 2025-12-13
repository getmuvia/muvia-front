import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-hero-banner',
  imports: [NgOptimizedImage],
  templateUrl: './hero-banner.html',
  styleUrl: './hero-banner.css',
})
export class HeroBanner {
  heroImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjgjUCsnqRCjz9qiKutKFuTHmGoP2ZqXRwpOhSE8ZjfI6P1u8p2aRHFLDCz1fJjDn_5EmnomAG_iSVhBGTOqdIwkkmX2Fp5oRIUYj-Scve5xQABxlceHXpy3qVdb-N9fOIZv-TbA0POfZN3W1Ah5d9W6etktHa9XEEGihwjoW8eDoPAy18MQWg1-xaK8elVdgC0wk2fhRAtp-Q9olvR0LBc0rba_DzWZ79ZArJWh9SoAePvH8HBTIk4DRSAzmJCWYwyq26xLTFPlw';
}
