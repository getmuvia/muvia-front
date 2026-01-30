import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VirtualStagingService, StagingResult } from '@core/services/virtual-staging/virtual-staging';

@Component({
    selector: 'app-result',
    imports: [CommonModule],
    templateUrl: './result.html',
    styleUrl: './result.css'
})
export class Result implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly stagingService = inject(VirtualStagingService);

    result = signal<StagingResult | null>(null);
    isLoading = signal(true);
    sliderPosition = signal(50);

    ngOnInit(): void {
        const key = this.route.snapshot.queryParams['key'];
        if (!key) {
            this.router.navigate(['/virtual-staging']);
            return;
        }

        this.stagingService.getStagingResult(key).subscribe({
            next: (res) => {
                this.result.set(res);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    onSliderChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.sliderPosition.set(Number(input.value));
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(price);
    }
}
