import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-store-avatar',
  template: `
    <span
      class="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-current/20 bg-current/10"
      [style.width.px]="size()"
      [style.height.px]="size()"
    >
      @if (visibleLogoUrl(); as logoUrl) {
        <img
          [src]="logoUrl"
          [alt]="storeName() ? 'Logo de ' + storeName() : 'Logo de la tienda'"
          class="h-full w-full object-cover"
          decoding="async"
          (error)="handleImageError(logoUrl)"
        />
      } @else {
        <span class="material-symbols-outlined text-[1.15rem]" aria-hidden="true">
          {{ fallbackIcon() }}
        </span>
      }
    </span>
  `,
})
export class StoreAvatar {
  readonly logoUrl = input<string | null | undefined>('');
  readonly storeName = input<string>('');
  readonly fallbackIcon = input('account_circle');
  readonly size = input(28);

  private readonly failedLogoUrl = signal<string | null>(null);

  readonly visibleLogoUrl = computed(() => {
    const logoUrl = this.logoUrl()?.trim() ?? '';
    return logoUrl && logoUrl !== this.failedLogoUrl() ? logoUrl : '';
  });

  handleImageError(logoUrl: string): void {
    this.failedLogoUrl.set(logoUrl);
  }
}
