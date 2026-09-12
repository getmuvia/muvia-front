import { Component } from '@angular/core';
import { HeroBanner } from './components/hero-banner/hero-banner';
import { FeaturedCategories } from './components/featured-categories/featured-categories';
import { NewArrivals } from './components/new-arrivals/new-arrivals';
import { AiDecoratorBanner } from './components/ai-decorator-banner/ai-decorator-banner';

@Component({
  selector: 'app-home',
  imports: [HeroBanner, FeaturedCategories, NewArrivals, AiDecoratorBanner],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
