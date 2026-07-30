/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tenant } from '../types';
import { PRESETS } from '../data/mockData';
import {
  Share2,
  MapPin,
  Shield,
  Check,
  Copy,
  MessageCircle,
  Facebook,
  Instagram,
  X,
  Languages
} from 'lucide-react';

interface HeaderPublicProps {
  tenant: Tenant;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  activeSection: 'todos' | 'calzados' | 'prendas' | 'otros';
  onSelectSection: (section: 'todos' | 'calzados' | 'prendas' | 'otros') => void;
  categories?: string[];
  onOpenAdmin: () => void;
  onChangeLanguage: (lang: 'es' | 'en') => void;
}

export default function HeaderPublic({
  tenant,
  activeCategory,
  onSelectCategory,
  activeSection,
  onSelectSection,
  categories,
  onOpenAdmin,
  onChangeLanguage
}: HeaderPublicProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const presetStyle = PRESETS[tenant.theme.preset] || PRESETS.NewYork;
  const classes = presetStyle.classes;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `¡Mira los increíbles zapatos de dama en ${tenant.name}! Visita su catálogo digital y haz tu encargo.`;
  const shareUrl = window.location.href;

  const handleWhatsappShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  return (
    <header className="relative w-full">
      {/* 1. BARRA ARRIBA DE TODO: Compartir, Ubicación, Escudo */}
      <div className="bg-neutral-900 text-white text-xs py-2 px-4 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Idioma selector */}
            <button
              id="btn-toggle-language"
              onClick={() => onChangeLanguage(tenant.language === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1 hover:text-pink-300 transition-colors bg-neutral-800 px-2 py-0.5 rounded"
            >
              <Languages className="w-3.5 h-3.5 text-pink-400" />
              <span>{tenant.language === 'es' ? 'ES' : 'EN'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* BOTÓN COMPARTIR */}
            <button
              id="btn-public-share"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 hover:text-pink-400 transition-colors font-medium cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-pink-400" />
              <span>{tenant.language === 'es' ? 'Compartir' : 'Share'}</span>
            </button>

            {/* BOTÓN UBICACIÓN */}
            <button
              id="btn-public-location"
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-1.5 hover:text-pink-400 transition-colors font-medium cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{tenant.language === 'es' ? 'Ubicación' : 'Location'}</span>
            </button>

            {/* BOTÓN ESCUDO PARA EL ADMINISTRADOR */}
            <button
              id="btn-admin-escudo"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 bg-neutral-800 hover:bg-pink-900/40 text-rose-300 hover:text-rose-200 transition-all px-3 py-1 rounded border border-rose-500/30 cursor-pointer font-bold"
              title="Panel de Administración"
            >
              <Shield className="w-4 h-4 text-rose-400 fill-rose-400/20" />
              <span>{tenant.language === 'es' ? 'Admin' : 'Admin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CABEZERA CON EL LOGO / IMAGEN DE FONDO / TEXTO */}
      <div
        className="relative py-20 px-6 text-center bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.75)), url(${tenant.banner || tenant.theme.bannerUrl})`,
        }}
      >
        <div className="max-w-3xl mx-auto space-y-4 text-white">
          {/* Logo del Inquilino */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 text-4xl shadow-xl animate-bounce overflow-hidden">
            {tenant.logo && (tenant.logo.startsWith('http') || tenant.logo.startsWith('data:image')) ? (
              <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-cover" />
            ) : (
              <span>{tenant.logo || '👠'}</span>
            )}
          </div>

          <h1
            className="text-4xl md:text-5xl font-black tracking-tight"
            style={{
              fontFamily: tenant.theme.fontFamily === 'serif' ? 'Georgia, serif' : tenant.theme.fontFamily === 'mono' ? 'monospace' : 'inherit',
              color: 'white' // always white on top of dark banner mask
            }}
          >
            {tenant.name}
          </h1>

          <p className="text-sm md:text-base text-rose-100 max-w-xl mx-auto font-light leading-relaxed">
            {tenant.description}
          </p>

          <div className="pt-2 flex justify-center gap-3">
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full border border-white/20 text-white backdrop-blur-sm">
              ✨ 100% Calidad Garantizada
            </span>
            <span className="text-xs bg-pink-500/40 px-3 py-1 rounded-full border border-pink-400/30 text-white backdrop-blur-sm font-semibold">
              📦 Retiro en Local
            </span>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE SECCIONES (Todos, Calzados, Prendas, Otros) */}
      {(tenant.showPrendas !== false || tenant.showOtros !== false) && (
        <div className="bg-slate-900 text-white py-2 border-b border-slate-800 sticky top-[41px] z-45 shadow-md">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-3">
              {/* BOTÓN TODOS (alojado a la izquierda de Calzados) */}
              <button
                id="btn-section-todos"
                type="button"
                onClick={() => onSelectSection('todos')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSection === 'todos'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>✨ Todos</span>
              </button>

              <button
                id="btn-section-calzados"
                type="button"
                onClick={() => onSelectSection('calzados')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSection === 'calzados'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>👠 Calzados</span>
              </button>

              {tenant.showPrendas !== false && (
                <button
                  id="btn-section-prendas"
                  type="button"
                  onClick={() => onSelectSection('prendas')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSection === 'prendas'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>👗 Prendas</span>
                </button>
              )}

              {tenant.showOtros !== false && (
                <button
                  id="btn-section-otros"
                  type="button"
                  onClick={() => onSelectSection('otros')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSection === 'otros'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>📦 Otros Productos</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. BARRA DE CATEGORÍAS FILTRABLES */}
      {((categories || tenant.categories).filter(c => c.toLowerCase() !== 'todos').length > 0) && (
        <div className="bg-white border-b border-rose-100 py-3 sticky top-[77px] z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-2 whitespace-nowrap py-1">
              {(categories || tenant.categories)
                .filter((category) => category.toLowerCase() !== 'todos')
                .map((category) => {
                  const isActive = activeCategory === category;
                  return (
                    <button
                      key={category}
                      id={`btn-cat-${category}`}
                      onClick={() => onSelectCategory(isActive ? 'Todos' : category)}
                      className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-rose-500 text-white rounded-full shadow-sm shadow-rose-200'
                          : 'text-rose-950/60 hover:text-rose-600 hover:bg-rose-50 rounded-full'
                      }`}
                      style={{
                        backgroundColor: isActive ? tenant.theme.primaryColor : undefined,
                        borderColor: isActive ? tenant.theme.primaryColor : undefined,
                      }}
                    >
                      {category}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COMPARTIR */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-rose-50">
            <button
              id="btn-close-share-modal"
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 r-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              style={{ right: '16px' }}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 pr-8 mb-2 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-pink-500" />
              {tenant.language === 'es' ? 'Viralizar Catálogo' : 'Viralize Catalog'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              {tenant.language === 'es'
                ? '¡Comparte esta tienda con tus amigas y en tus redes para que vean la última colección!'
                : 'Share this store with friends and on social media!'}
            </p>

            <div className="space-y-3">
              {/* WhatsApp */}
              <button
                id="btn-share-whatsapp"
                onClick={handleWhatsappShare}
                className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 text-green-800 rounded-xl transition-all font-semibold text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="bg-green-500 text-white p-1.5 rounded-lg">
                    <MessageCircle className="w-4 h-4 fill-white" />
                  </div>
                  <span>WhatsApp</span>
                </div>
                <span className="text-xs font-normal text-green-600">Compartir catálogo</span>
              </button>

              {/* Facebook */}
              <button
                id="btn-share-facebook"
                onClick={handleFacebookShare}
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl transition-all font-semibold text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <Facebook className="w-4 h-4 fill-white" />
                  </div>
                  <span>Facebook</span>
                </div>
                <span className="text-xs font-normal text-blue-600">Publicar</span>
              </button>

              {/* Instagram info */}
              <div className="p-3 bg-pink-50 text-pink-800 rounded-xl text-sm border border-pink-100/30">
                <div className="flex items-center gap-2.5 mb-1 font-semibold">
                  <div className="bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 text-white p-1.5 rounded-lg">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <span>Instagram</span>
                </div>
                <p className="text-xs text-pink-700/80 leading-relaxed pl-8">
                  {tenant.language === 'es'
                    ? 'Copia el enlace de abajo y agrégalo a tu biografía o historia para recibir encargos directos.'
                    : 'Copy the link below and add it to your bio or story for orders.'}
                </p>
              </div>

              {/* Copiar enlace */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Enlace directo de la tienda</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-600 focus:outline-none"
                  />
                  <button
                    id="btn-copy-share-url"
                    onClick={handleCopyLink}
                    className="px-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE UBICACIÓN */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-rose-50">
            <button
              id="btn-close-location-modal"
              onClick={() => setShowLocationModal(false)}
              className="absolute top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              style={{ right: '16px' }}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              {tenant.language === 'es' ? 'Ubicación y Contacto' : 'Location & Contact'}
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dirección de Retiro</h4>
                  <p className="text-sm text-gray-800 font-semibold">{tenant.address || 'Av. Corrientes 1540, Buenos Aires'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teléfono de Consultas</h4>
                  <p className="text-sm text-gray-800 font-semibold">
                    {tenant.prefix} {tenant.phone}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Horario de Atención</h4>
                  <p className="text-xs text-gray-600 font-medium">Lunes a Sábados de 10:00 a 19:00 hs.</p>
                </div>
              </div>

              {/* Enlace para abrir mapa */}
              <a
                id="link-open-map"
                href={tenant.locationUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Ver ubicación en Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
