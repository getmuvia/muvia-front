import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';

@Injectable({
    providedIn: 'root'
})
export class ImageOptimizerService {

    /**
     * Compresses an image file and converts it to WebP format.
     * Uses a Web Worker to avoid blocking the main thread.
     * 
     * @param file The original image file.
     * @returns A Promise that resolves to the compressed WebP file.
     */
    async compressImage(file: File): Promise<File> {
        // If it's not an image, return original
        if (!file.type.startsWith('image/')) {
            return file;
        }

        const options = {
            maxSizeMB: 1,              // Max size in MB
            maxWidthOrHeight: 1920,    // Max width/height
            useWebWorker: true,        // Use Web Worker for performance
            fileType: 'image/webp',    // Force conversion to WebP
            initialQuality: 0.8        // Initial quality (0 to 1)
        };

        try {
            const compressedFile = await imageCompression(file, options);

            // The library might return a Blob/File with the original name but updated type.
            // We explicitly create a new File to ensure the name has .webp extension if needed,
            // although browser-image-compression usually handles this.
            // Let's verify extension.
            const newName = this.ensureWebpExtension(file.name);

            return new File([compressedFile], newName, { type: 'image/webp' });
        } catch (error) {
            console.error('Image compression failed:', error);
            // Fallback: return original file if compression fails
            return file;
        }
    }

    private ensureWebpExtension(filename: string): string {
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1) return `${filename}.webp`;
        return `${filename.substring(0, lastDotIndex)}.webp`;
    }
}
