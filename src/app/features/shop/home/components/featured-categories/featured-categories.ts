import { NgOptimizedImage } from '@angular/common';
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-featured-categories',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './featured-categories.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './featured-categories.css',
})
export class FeaturedCategories {
  categories = signal([
    {
      id: 1,
      name: 'Iluminación',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhTh7MZ01hIvH-ISQrG5UoAYtjP9z3PSTPg4Sc8HDHOkbZWPACvkaPnNxrl7B5zzqtl5P7EBY8UD66OJRkKGG2HsRQ5AY3NdR4dbwEe2hUzyU_XIpfjwspruENZj5qlX3I3KYfbZOITovjuMgEHeX1Z0xrov05U_WqvrtJZbSZsxYDddgSMaLQIM4Fe3vgr7IBR8ZIaI_doh8DtL3yk0xaNpJuP8CLS4PcO3BQmUBtGxV-qEl15E9Dbr_D8I0cTNAhe_4hzqv93ck',
      link: '/catalog',
      queryParams: { category: 'lighting' }
    },
    {
      id: 2,
      name: 'Textiles',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7KsJ99OoCbpol7yww_0tPEcHiD839LBFqXWuun7tRE02Wc4BcC2opzWIwxY6Xm_ymNbYnmG21WraoyCVQFQ-6N8b_a_tznZAveUDHvUdtmVOImOYZY7S0W1Tt9wppRVfmeC8FyJLRcFlfuYKWzKYpLXoAPNRnEVQDplmiiKvJnZOpBNNt1acjFxPEZbkLOOboVyfTEVoWVo4Ev5mHFn6y7HaXHtNrZ58V08ham5Zla7MMtQK75R2ajidzpK6hNeYJs97cQD6teVM',
      link: '/catalog',
      queryParams: { category: 'textiles' }
    },
    {
      id: 3,
      name: 'Muebles',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaI6ywVY47AYYrMfwMOnQ9U9po26wHvThPlVOQvbriN6x5v0fnamOvlhbjKABn98E_496TIBHMi5LQhKPUx1LoT8wuIAvUTY-4_11FNnuLMcx4iq3Ej1vbgJXtsxK71DRdX4koWntn4S-syC5W6zGjZFBSWUVYnL71nqnWt1z4fUIaMtlP68k3iIXHIKeRd92myDTbmwC42wngri6BeH2ZEC1QqFcaOXoNmzMPpo9BYuMvDNResBEzdfOnnn_4cxXH6JA7QAqtvrI',
      link: '/catalog',
      queryParams: { category: 'furniture' }
    },
    {
      id: 4,
      name: 'Jarrones',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM8p0sOHGZ-OU-MBIb25qlBjz3GEkm-Gn8uNerHD43OWy3ENsLKQHkrSObQ8RkYtYKYHxC6kxFIjc55ONkot_MT111hBAuYS71wjg9XZ4QGfv3jvQl9Li28TpM2C6I0owpGu7cqtsBnADRxWVca9yB9Z6crfxPkk6HP6xobaK2bJy0zrtXZCLAX5s-2pZkvXyymn3xT8GXuwKSaI9dYjF-nzR30kOCDN_KtAHYlmjArrFYdPsCHm4QgBhQhDZgIBpSeu4SpryPM-g',
      link: '/catalog',
      queryParams: { category: 'decor' }
    }
  ]);
}
