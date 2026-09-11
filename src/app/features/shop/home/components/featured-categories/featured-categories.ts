import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FEATURED_CATEGORIES } from '@core/constants/featured-categories';

@Component({
  selector: 'app-featured-categories',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './featured-categories.html',
  styleUrl: './featured-categories.css',
})
export class FeaturedCategories {
  readonly categories = FEATURED_CATEGORIES;
}
