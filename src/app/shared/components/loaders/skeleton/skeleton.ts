import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div 
      [className]="computedClasses()"
      [style.width]="width()"
      [style.height]="height()">
    </div>
  `
})
export class Skeleton {
  readonly width = input<string>('100%');
  readonly height = input<string>('1rem');
  readonly shape = input<'rect' | 'circle'>('rect');
  readonly className = input<string>('');

  computedClasses = computed(() => {
    const baseClasses = 'animate-pulse bg-text-light/10';
    const shapeClasses = this.shape() === 'circle' ? 'rounded-full' : 'rounded-editorial';
    return `${baseClasses} ${shapeClasses} ${this.className()}`;
  });
}
