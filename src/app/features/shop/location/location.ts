import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Market } from '@core/models/market/market';
import { MarketService } from '@core/services/market/market';

@Component({
  selector: 'app-location',
  templateUrl: './location.html',
  styleUrl: './location.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Location {
  private readonly router = inject(Router);
  readonly marketService = inject(MarketService);
  private readonly regionLabels: Readonly<Record<string, string>> = {
    SOUTH_AMERICA: 'América del Sur',
    NORTH_AMERICA: 'América del Norte',
    CENTRAL_AMERICA: 'América Central y el Caribe',
    EUROPE: 'Europa',
    AFRICA: 'África',
    ASIA_PACIFIC: 'Asia Pacífico',
    MIDDLE_EAST: 'Medio Oriente',
  };
  readonly marketGroups = computed(() => {
    const groups = new Map<string, Market[]>();
    for (const market of this.marketService.markets()) {
      const group = groups.get(market.regionCode) ?? [];
      group.push(market);
      groups.set(market.regionCode, group);
    }
    return [...groups.entries()].map(([regionCode, markets]) => ({
      regionCode,
      name: this.regionLabels[regionCode] ?? regionCode,
      markets,
    }));
  });

  selectMarket(market: Market): void {
    this.marketService.selectMarket(market);
    void this.router.navigate(['/products']);
  }
}
