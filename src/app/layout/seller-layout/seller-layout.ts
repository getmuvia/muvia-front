import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SellerHeader } from '../components/seller/seller-header/seller-header';
import { SellerCoverBanner } from '../components/seller/seller-cover-banner/seller-cover-banner';
import { SellerProfileHeader } from '../components/seller/seller-profile-header/seller-profile-header';
import { SellerSidebar } from '../components/seller/seller-sidebar/seller-sidebar';
import { SellerFilterChips } from '../components/seller/seller-filter-chips/seller-filter-chips';
import { SellerProductGrid } from '../components/seller/seller-product-grid/seller-product-grid';
import { SellerPagination } from '../components/seller/seller-pagination/seller-pagination';
import { ShopFooter } from '../components/shop-footer/shop-footer';
import { Product } from '@core/models/product/product';

@Component({
  selector: 'app-seller-layout',
  imports: [
    RouterOutlet,
    SellerHeader,
    SellerCoverBanner,
    SellerProfileHeader,
    SellerSidebar,
    SellerFilterChips,
    SellerProductGrid,
    SellerPagination,
    ShopFooter
  ],
  templateUrl: './seller-layout.html',
  styleUrl: './seller-layout.css',
})
export class SellerLayout {
  // Demo data - in real implementation, this would come from a service
  coverImageUrl = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=400&fit=crop';
  avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop';
  sellerName = 'Atelier Chic';
  sellerDescription = 'Diseño de interiores y piezas únicas.';
  aboutText = 'Atelier Chic crea piezas de decoración atemporales que combinan artesanía tradicional con estética moderna.';
  rating = 4.7;
  totalReviews = 120;
  socialLinks = [
    { name: 'Website', url: '#', icon: 'language' as const },
    { name: 'Instagram', url: '#', icon: 'instagram' as const },
    { name: 'Pinterest', url: '#', icon: 'pinterest' as const }
  ];

  // Demo products
  products: Product[] = [
    { id: '1', name: 'Silla Nórdica de Roble', price: 250.00, imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=600&fit=crop', brand: 'Atelier Chic' },
    { id: '2', name: 'Jarrón de Cerámica', price: 75.00, imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&h=600&fit=crop', brand: 'Atelier Chic' },
    { id: '3', name: 'Lienzo Abstracto Dorado', price: 320.00, imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=600&fit=crop', brand: 'Atelier Chic' },
    { id: '4', name: 'Lámpara de Mármol', price: 180.00, imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', brand: 'Atelier Chic' },
    { id: '5', name: 'Set de Cojines de Lino', price: 95.00, imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=600&fit=crop', brand: 'Atelier Chic' },
    { id: '6', name: 'Mesa Auxiliar Artesanal', price: 220.00, imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400&h=600&fit=crop', brand: 'Atelier Chic' },
  ];

  currentPage = 1;
  totalPages = 8;

  onFollow(): void {
    console.log('Follow clicked');
  }

  onContact(): void {
    console.log('Contact clicked');
  }

  onFilterChange(filterId: string): void {
    console.log('Filter changed:', filterId);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    console.log('Page changed:', page);
  }
}
