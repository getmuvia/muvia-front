import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface AiDecoratorPromo {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly resultImage: string;
  readonly resultImageAlt: string;
  readonly beforeImage: string;
  readonly beforeImageAlt: string;
  readonly productImage: string;
  readonly productImageAlt: string;
  readonly link: string;
  readonly cta: string;
}

@Component({
  selector: 'app-ai-decorator-banner',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './ai-decorator-banner.html',
  styleUrl: './ai-decorator-banner.css',
})
export class AiDecoratorBanner {
  readonly promo: AiDecoratorPromo = {
    eyebrow: 'Visualización con IA · Beta',
    title: 'Mira el mueble en tu espacio',
    description: 'Sube una foto de tu habitación, elige un producto del catálogo y genera una vista previa con IA.',
    resultImage: '/images/ai-decorator/room-result-2026-09.webp',
    resultImageAlt: 'Resultado de una prueba real del IA Decorator con muebles añadidos a una habitación',
    beforeImage: '/images/ai-decorator/room-before-2026-09.webp',
    beforeImageAlt: 'Habitación original utilizada en la prueba del IA Decorator',
    productImage: '/images/ai-decorator/selected-desk-2026-09.webp',
    productImageAlt: 'Escritorio seleccionado para la prueba del IA Decorator',
    link: '/virtual-staging',
    cta: 'Probar IA Decorator',
  };
}
