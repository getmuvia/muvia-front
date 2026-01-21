import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [className]="computedClasses()"
      [style.width]="width()"
      [style.height]="height()">
    </div>
  `
})
export class Skeleton {
  width = input<string>('100%');
  height = input<string>('1rem');
  shape = input<'rect' | 'circle'>('rect');
  className = input<string>('');

  computedClasses = computed(() => {
    const baseClasses = 'animate-pulse bg-text-light/10';
    const shapeClasses = this.shape() === 'circle' ? 'rounded-full' : 'rounded-md';
    return `${baseClasses} ${shapeClasses} ${this.className()}`;
  });
}
