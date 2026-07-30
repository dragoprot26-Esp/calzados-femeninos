/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tenant } from '../types';
import { Sparkles, Plus, Store, Check, RotateCcw } from 'lucide-react';

interface TenantSelectorProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  onCreateTenant: (name: string, slug: string) => void;
  onResetData: () => void;
}

export default function TenantSelector({
  tenants,
  activeTenant,
  onSelectTenant,
  onCreateTenant,
  onResetData
}: TenantSelectorProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const slug = newTenantSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const name = newTenantName.trim();

    if (!name) {
      setError('El nombre no puede estar vacío');
      return;
    }
    if (!slug) {
      setError('El enlace/slug no puede estar vacío');
      return;
    }

    if (tenants.some(t => t.slug === slug)) {
      setError('Este enlace/slug ya existe para otra tienda');
      return;
    }

    onCreateTenant(name, slug);
    setNewTenantName('');
    setNewTenantSlug('');
    setShowCreate(false);
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white py-3 px-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Store className="text-pink-400 w-5 h-5 animate-pulse" />
          <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
            PLATAFORMA MULTI-INQUILINO (Demo)
          </span>
          <span className="hidden md:inline text-xs text-slate-400">| Cambia de tienda en tiempo real:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tenants.map((tenant) => {
            const isActive = tenant.id === activeTenant.id;
            return (
              <button
                key={tenant.id}
                id={`btn-tenant-${tenant.slug}`}
                onClick={() => onSelectTenant(tenant)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white ring-2 ring-pink-300 ring-offset-2 ring-offset-slate-900 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <span>{tenant.logo}</span>
                <span>{tenant.name}</span>
                {isActive && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}

          <button
            id="btn-show-create-tenant"
            onClick={() => setShowCreate(!showCreate)}
            className="px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-all"
            title="Crear nueva tienda / inquilino"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Inquilino</span>
          </button>

          <button
            id="btn-reset-demo-data"
            onClick={onResetData}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors"
            title="Restablecer base de datos inicial"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="max-w-lg mx-auto mt-3 bg-slate-800 border border-indigo-500/30 rounded-xl p-4 shadow-xl text-slate-200 animate-fadeIn">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1 text-indigo-300">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Registrar Nuevo Inquilino / Tienda de Zapatos
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Comercial de la Tienda</label>
              <input
                id="input-new-tenant-name"
                type="text"
                placeholder="Ej. Bella Donna Shoes, Calzados Cristal"
                value={newTenantName}
                onChange={(e) => {
                  setNewTenantName(e.target.value);
                  setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                }}
                className="w-full text-sm bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Enlace Personalizado (Slug)</label>
              <div className="flex items-center">
                <span className="bg-slate-950 border border-slate-700 border-r-0 rounded-l-lg py-1.5 px-2.5 text-xs text-slate-500">
                  /shop/
                </span>
                <input
                  id="input-new-tenant-slug"
                  type="text"
                  placeholder="ej-bella-donna"
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value)}
                  className="w-full text-sm bg-slate-900 border border-slate-700 rounded-r-lg py-1.5 px-3 focus:outline-none focus:border-indigo-500 text-white font-mono"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Cancelar
              </button>
              <button
                id="btn-submit-create-tenant"
                type="submit"
                className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
              >
                Crear Tienda
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
