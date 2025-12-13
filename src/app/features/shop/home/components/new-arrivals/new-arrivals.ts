import { Component, signal } from '@angular/core';
import { ProductCard } from '@shared/components/product-card/product-card';
import { Product } from '@core/models/product/product';

@Component({
  selector: 'app-new-arrivals',
  imports: [ProductCard],
  templateUrl: './new-arrivals.html',
  styleUrl: './new-arrivals.css',
})
export class NewArrivals {
  products = signal<Product[]>([
    {
      id: '1',
      brand: 'Marca A',
      name: 'Jarrón de Cerámica Blanca',
      price: 45.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3zARg8O_iZKy48vOiGdjC49BgdTVmT6FZWTfX94n38N7jZ8fypp3GZ7e1RsboO5R4c8Ol2qvAHHQpyIIQMVR_Tcep2dNa6J1W4YystiS80cJRLq-Hugyjgilh2yKnUxF-1D61FvuwZpY6OLa_Evkga31AKrEMiEwriGqOtNQa_IS_SaMloQWwbRrd7lCeOVQ-J9JqQG088jOyJ-5euHIL6_TSN3vfswGlC0FpUzlosp1ruetb0bV73IPRVHib0rv_Jbj6GBweDLw',
      altText: 'Jarrón minimalista con rama seca'
    },
    {
      id: '2',
      brand: 'Marca B',
      name: 'Lámpara de Mesa "Elegance"',
      price: 120.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAttIV104FUEMRuD6KkQLReJTXbrZi_rZffauITrlV0rlwC9h_4wJ5DHqstNnqowXw4B-qLd_Igo_yW9INDd1OfwVCi6TRuwkrHMPAlcHyP7o3Tp4u8LE7RHLQhEwWDikRD0z1aUD0I5Ci9miHuDSgNfclpae06kr45Rkk1bk9MrH854AGzY0A0Tg0MehgpuXeOEv3Gcs062xYI3QzqXB7oD-J4ll4hUvnhLqkqwo8jokOvETJODlXYMzg98qJYLgdXVEFjRE1gzQ4',
      altText: 'Lámpara de mesa con base de latón'
    },
    {
      id: '3',
      brand: 'Marca C',
      name: 'Cojín de Lino Texturizado',
      price: 55.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJxt_P0m5TiZC1E1VuxoQ1Mav35XvIufgJ-r7Cozf9C9XDczmYOPCkMZjn0DCxcjYDbJCvBq3sq8g97anP2SCiEqMdP3ch24UqCZhY7mMmYpx9jH5KpiA-_S0hgTRaxnXar0rX556qkuGBCvDx2adWwhC51JRS2eoDz31vZsGfd9MKrteEpbHUoNR7Y6m2nkhti5m2Mtgaz5wu09H2bt8YoZfPFWOgUIY79tkwnssod9bxvaYfwd9JpUa-EURuVu8iKpNiE9LCtVo',
      altText: 'Cojín beige sobre sofá moderno'
    },
    {
      id: '4',
      brand: 'Marca D',
      name: 'Taburete de Madera Rústico',
      price: 89.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfMHfQHPlv3QJAkiIWwrilr44WsNvIjrJR4bDJZrv7--Wt27yIpv1HxxdE8ZMqhfa_M4st0NZgdvmoaR_25aEO851dM9mXYP8KuE5pAgjXkTM6eVdx9MxxlXO1AItkS4O0Cu-XSYhZwZw6j3t9gDIUWer8Zw58JPpzVkmZ2lM49ntBGaXGlL1uCP5USm5ZwbOF2NlPrD-zotS0pVLk2EmWZ7KB0G_6DsjLk8DGPIh8n7qqSBYSNQjOo4UjcrUjo0Kbyfgp2p15fYU',
      altText: 'Taburete pequeño de madera'
    }
  ]);
}
