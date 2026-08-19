import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { Product } from '@core/models/product/product';

type TabType = 'description' | 'details' | 'shipping';

@Component({
    selector: 'app-product-tabs',
    imports: [],
    templateUrl: './product-tabs.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './product-tabs.css',
})
export class ProductTabs {
    product = input.required<Product>();

    activeTab = signal<TabType>('description');

    setActiveTab(tab: TabType): void {
        this.activeTab.set(tab);
    }
}
