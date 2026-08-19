import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VirtualStagingService } from '@core/services/virtual-staging/virtual-staging';
import { LoggerService } from '@core/services/logger/logger';

@Component({
    selector: 'app-virtual-staging',
    imports: [CommonModule],
    templateUrl: './virtual-staging.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './virtual-staging.css'
})
export class VirtualStaging {
    private readonly stagingService = inject(VirtualStagingService);
    private readonly router = inject(Router);
    private readonly logger = inject(LoggerService);

    isUploading = signal(false);
    dragActive = signal(false);

    async onFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            await this.processFile(input.files[0]);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragActive.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragActive.set(false);
    }

    async onDrop(event: DragEvent): Promise<void> {
        event.preventDefault();
        event.stopPropagation();
        this.dragActive.set(false);

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            await this.processFile(event.dataTransfer.files[0]);
        }
    }

    private async processFile(file: File): Promise<void> {
        if (!file.type.startsWith('image/')) {
            return;
        }

        this.isUploading.set(true);

        this.stagingService.analyzeRoom(file).subscribe({
            next: (response) => {
                this.logger.info('Room analyzed successfully', 'VirtualStaging');
                this.router.navigate(['/virtual-staging/result']);
            },
            error: (error) => {
                this.logger.error('Analysis failed', error, 'VirtualStaging');
                this.isUploading.set(false);
            }
        });
    }
}
