import { NgOptimizedImage } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CollectionPromo {
  title: string;
  description: string;
  image: string;
  link: string;
  queryParams: Record<string, string>;
}

@Component({
  selector: 'app-collection-banner',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './collection-banner.html',
  styleUrl: './collection-banner.css',
})
export class CollectionBanner {
  promo = signal<CollectionPromo>({
    title: 'Colección Mediterránea',
    description: 'Inspírate en la calma y la luz del mar. Nuestra nueva colección combina texturas naturales, tonos neutros y la sencillez del diseño costero.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLl6iI3EnUuyyXLW-r6uULOGxJ91dO-wzKk7CjL9wLkblM93E_LiSwBL96QSkX9RqDIBddYcXFd_hidUe8Qg9fHz_Mk_LcfxLiLd-J-HITgUMV5PVEyc1Kj0-7JbX2gIW7vqZeyd94wW857PGsJ-L6L1l_K5XDl3aJfIVR1Nj_bccZ4X3S_Y_4ZZjxZ2snVLX1V0fAcBbfghLkTinTTROTJapuFzzNPRJ04CiCGZ_K9a-JuBGU459X6odA6bNLNTUIHfegL9HG89s',
    link: '/catalog',
    queryParams: { collection: 'mediterranean' }
  });
}
