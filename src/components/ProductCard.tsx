/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Tenant } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Info,
  Clock
} from 'lucide-react';

interface ProductCardProps {
  key?: string;
  product: Product;
  tenant: Tenant;
  onAddToBag: (product: Product) => void;
}

export default function ProductCard({
  product,
  tenant,
  onAddToBag
}: ProductCardProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : ''
  );

  const images = product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop'];

  // Handle auto-slide of images inside the single frame
  useEffect(() => {
    if (!product.autoSlide || images.length <= 1) return;

    const interval = setInterval(() => {
      setActiveImgIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3500); // changes image every 3.5 seconds

    return () => clearInterval(interval);
  }, [product.autoSlide, images.length]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-rose-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
    >
      {/* 1. CONTENEDOR DE IMAGEN (1 a 5 imágenes en el mismo recuadro) */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden select-none">
        <img
          src={images[activeImgIndex]}
          alt={`${product.name} - Vista ${activeImgIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Gradiente sutil inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Flechas de Navegación de Imágenes */}
        {images.length > 1 && (
          <>
            <button
              id={`btn-prev-img-${product.id}`}
              onClick={handlePrevImage}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-rose-950 flex items-center justify-center shadow transition-all cursor-pointer hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id={`btn-next-img-${product.id}`}
              onClick={handleNextImage}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-rose-950 flex items-center justify-center shadow transition-all cursor-pointer hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicadores de Burbuja (1 por cada foto) */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/25 backdrop-blur-sm py-1 px-2.5 rounded-full">
            {images.map((_, idx) => (
              <button
                key={idx}
                id={`btn-indicator-${product.id}-${idx}`}
                onClick={() => setActiveImgIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeImgIndex ? 'bg-white w-3' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}

        {/* Badge de Categoría */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-rose-500 text-white py-1 px-2.5 rounded-full shadow-sm">
            {product.category}
          </span>
        </div>

        {/* Auto Slide status badge (si está activado) */}
        {product.autoSlide && images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-[9px] text-pink-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 animate-spin" />
            <span>AUTO</span>
          </div>
        )}
      </div>

      {/* 2. CONTENIDO DEL PRODUCTO */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <h3 className="font-bold text-gray-900 group-hover:text-rose-600 transition-colors text-base tracking-tight leading-tight">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Selector de Talla (Solo aparece si el inquilino seleccionó tallas) */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-rose-50">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Talle / Talla Disponible:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  id={`btn-size-${product.id}-${sz}`}
                  onClick={() => setSelectedSize(sz)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    selectedSize === sz
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  style={{
                    backgroundColor: selectedSize === sz ? tenant.theme.primaryColor : undefined,
                    borderColor: selectedSize === sz ? tenant.theme.primaryColor : undefined
                  }}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Precio y botón de Canastita para encargo */}
        <div className="flex items-center justify-between pt-2 border-t border-rose-50">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Precio de Lista</span>
            <span className="text-xl font-black text-rose-600">
              ${product.price.toLocaleString('es-AR')}
            </span>
          </div>

          <button
            id={`btn-add-to-bag-${product.id}`}
            onClick={() => {
              const productWithSelectedSize = selectedSize && product.sizes && product.sizes.length > 0
                ? {
                    ...product,
                    name: `${product.name} (Talla: ${selectedSize})`
                  }
                : product;
              onAddToBag(productWithSelectedSize);
            }}
            className="flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-rose-200 transition-all hover:-translate-y-0.5 active:translate-y-0 text-xs uppercase tracking-wide cursor-pointer"
            style={{ backgroundColor: tenant.theme.primaryColor }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Encargar</span>
          </button>
        </div>

        {/* Acción adicional: Detalle */}
        <div className="pt-1">
          <button
            id={`btn-toggle-detail-${product.id}`}
            onClick={() => setShowDetail(!showDetail)}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1 border border-slate-100 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>{showDetail ? 'Menos Detalle' : 'Más Detalle'}</span>
          </button>
        </div>

        {/* Detalles expandidos (Campos Personalizados) */}
        {showDetail && (
          <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-600 space-y-2 border border-slate-100 animate-slideDown">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Ficha Técnica</h4>
            {product.customFields.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {product.customFields.map((field, idx) => (
                  <div key={idx} className="bg-white p-1.5 rounded border border-slate-100">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">{field.label}</span>
                    <span className="font-semibold text-slate-800">{field.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">No hay detalles adicionales cargados para este producto.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
