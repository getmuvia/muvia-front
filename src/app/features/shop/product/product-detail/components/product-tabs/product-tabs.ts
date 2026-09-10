import { Component, input, signal } from '@angular/core';
import { Product } from '@core/models/product/product';

type TabType = 'description' | 'details';

@Component({
    selector: 'app-product-tabs',
    imports: [],
    templateUrl: './product-tabs.html',
    styleUrl: './product-tabs.css',
})
export class ProductTabs {
    readonly product = input.required<Product>();

    activeTab = signal<TabType>('description');

    setActiveTab(tab: TabType): void {
        this.activeTab.set(tab);
    }
}
