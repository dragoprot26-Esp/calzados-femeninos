/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Tenant } from '../types';
import { ExternalLink, Sparkles } from 'lucide-react';

interface FooterProps {
  tenant: Tenant;
}

export default function Footer({ tenant }: FooterProps) {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-white font-black text-sm">
            <span>{tenant.logo}</span>
            <span>{tenant.name}</span>
          </div>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Catálogo digital optimizado como Progressive Web App (PWA) de Calzado Femenino. Hecho para viralizar.
          </p>
        </div>

        {/* BOTÓN VISITA VITRINA (MANDATORY REQUIREMENT) */}
        <div className="flex flex-col items-center md:items-end gap-2.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Plataforma Aliada</span>
          <a
            id="link-visita-vitrina"
            href="https://vitrina-cyc.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-2.5 px-5 rounded-full text-xs uppercase tracking-wider hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-900/20 hover:shadow-pink-900/35 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
            <span>Visita Vitrina</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900/80 text-center text-[10px] text-slate-600">
        <p>&copy; 2026 {tenant.name}. Todos los derechos reservados. Diseñado para potenciar tu calzado.</p>
      </div>
    </footer>
  );
}
