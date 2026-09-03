import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { VirtualStagingService } from '@core/services/virtual-staging/virtual-staging';
import { LoggerService } from '@core/services/logger/logger';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-virtual-staging',
    imports: [],
    templateUrl: './virtual-staging.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './virtual-staging.css'
})
export class VirtualStaging implements OnInit {
    private readonly stagingService = inject(VirtualStagingService);
    private readonly router = inject(Router);
    private readonly logger = inject(LoggerService);

    isUploading = signal(false);
    isQuotaLoading = signal(true);
    dragActive = signal(false);
    errorMessage = signal<string | null>(null);
    readonly quota = this.stagingService.quota;

    async ngOnInit(): Promise<void> {
        try {
            await firstValueFrom(this.stagingService.getQuota());
        } catch (error) {
            this.logger.error('Could not load quota', error, 'VirtualStaging');
            this.errorMessage.set('No pudimos consultar tus generaciones disponibles. Inténtalo nuevamente.');
        } finally {
            this.isQuotaLoading.set(false);
        }
    }

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
        if (this.isQuotaLoading() || this.quota()?.remaining === 0) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.errorMessage.set('Selecciona un archivo de imagen válido.');
            return;
        }

        this.errorMessage.set(null);
        this.isUploading.set(true);

        try {
            await firstValueFrom(this.stagingService.analyzeRoom(file));
            this.logger.info('Room analyzed successfully', undefined, 'VirtualStaging');
            await this.router.navigate(['/virtual-staging/result']);
        } catch (error) {
            this.logger.error('Analysis failed', error, 'VirtualStaging');
            this.errorMessage.set(this.getGenerationErrorMessage(error));
            await this.refreshQuota();
        } finally {
            this.isUploading.set(false);
        }
    }

    private async refreshQuota(): Promise<void> {
        try {
            await firstValueFrom(this.stagingService.getQuota());
        } catch (error) {
            this.logger.error('Could not refresh quota', error, 'VirtualStaging');
        }
    }

    private getGenerationErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse && error.status === 429) {
            return 'Has alcanzado el límite de 10 generaciones de hoy. Inténtalo nuevamente mañana.';
        }

        return 'No pudimos generar la imagen. Inténtalo nuevamente.';
    }
}
