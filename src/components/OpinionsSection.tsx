/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tenant, Product, Comment } from '../types';
import { MessageSquare, Star, Plus, CheckCircle, X, Sparkles, Heart } from 'lucide-react';

interface OpinionsSectionProps {
  tenant: Tenant;
  products: Product[];
  comments: Comment[];
  onSubmitComment: (productId: string, name: string, content: string, isSuggestion: boolean) => void;
}

export default function OpinionsSection({
  tenant,
  products,
  comments,
  onSubmitComment
}: OpinionsSectionProps) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('general');
  const [clientName, setClientName] = useState('');
  const [content, setContent] = useState('');
  const [isSuggestion, setIsSuggestion] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Filter approved comments for this active tenant
  const approvedComments = comments.filter(c => c.tenantId === tenant.id && c.status === 'approved' && !c.isSuggestion);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !content.trim()) return;

    const targetProductId = selectedProductId === 'general' ? '' : selectedProductId;
    onSubmitComment(targetProductId, clientName.trim(), content.trim(), isSuggestion);

    setIsSuccess(true);
    setTimeout(() => {
      setClientName('');
      setContent('');
      setSelectedProductId('general');
      setIsSuggestion(false);
      setIsSuccess(false);
      setIsOpenModal(false);
    }, 2800);
  };

  return (
    <section id="section-opinions" className="mt-16 pt-10 border-t border-rose-100/40">
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-slate-800">
        {/* Adorno visual de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado de la sección */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-pink-500/20 border border-pink-500/30 text-pink-300 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Experiencia de Nuestras Clientas</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Opiniones y Reseñas de {tenant.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Descubre las experiencias de quienes ya lucen nuestros modelos o déjanos tu valoración. Tu opinión es moderada por nuestro equipo para mantener la comunidad segura.
            </p>
          </div>

          <button
            id="btn-open-opinion-modal"
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-pink-500/20 hover:shadow-pink-500/35 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0 self-start md:self-center"
          >
            <MessageSquare className="w-4 h-4 text-pink-200" />
            <span>Opinar o Sugerir</span>
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Opiniones Aprobadas */}
        <div className="relative z-10 pt-8">
          {approvedComments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {approvedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md hover:border-pink-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center text-xs font-black">
                          {comment.clientName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-100 text-xs">{comment.clientName}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    {comment.productName && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-pink-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                        Modelo: {comment.productName}
                      </span>
                    )}

                    <p className="text-slate-300 text-xs leading-relaxed italic pt-1">
                      "{comment.content}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 text-pink-400/80">
                      <Heart className="w-3 h-3 fill-pink-500/20" />
                      Opinión verificada
                    </span>
                    <span>{new Date(comment.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
              <div className="text-3xl text-pink-400">💬</div>
              <h4 className="font-bold text-slate-200 text-sm uppercase tracking-wide">
                Sé la primera en dar tu opinión
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Aún no hay opiniones publicadas para esta tienda. Haz clic en el botón superior para compartir tu experiencia con nosotros.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA SUBIR OPINIÓN / SUGERENCIA */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative border border-rose-100 overflow-hidden">
            <button
              type="button"
              id="btn-close-opinion-modal"
              onClick={() => setIsOpenModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-pink-600 mb-1">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Tu opinión nos importa</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Dejar una Opinión o Sugerencia
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Comparte tu experiencia con {tenant.name}. Tu mensaje será revisado por el equipo de administración antes de ser mostrado públicamente.
            </p>

            {isSuccess ? (
              <div className="py-8 text-center space-y-3 bg-pink-50/50 rounded-2xl border border-pink-100 p-6">
                <CheckCircle className="w-14 h-14 text-pink-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-gray-900 text-base">¡Muchas gracias por tu opinión!</h4>
                <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
                  Tu mensaje ha sido recibido correctamente y se encuentra pendiente de revisión por el administrador.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sofía Martínez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-gray-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    ¿Sobre qué modelo deseas opinar?
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-gray-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors"
                  >
                    <option value="general">✨ Opinión General sobre la Boutique</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        👠 {p.name} (${p.price.toLocaleString('es-AR')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-pink-50/80 p-3 rounded-xl border border-pink-100 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-pink-950">¿Es una sugerencia privada?</label>
                    <p className="text-[10px] text-pink-700/80">
                      Si lo marcas, solo lo leerá el equipo administrador y no se publicará.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSuggestion}
                    onChange={(e) => setIsSuggestion(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-500 border-pink-300 focus:ring-pink-400 shrink-0 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tu Comentario u Opinión *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Cuéntanos qué te pareció la atención, la calidad, el calce de los zapatos..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-gray-900 focus:outline-none focus:border-pink-500 focus:bg-white resize-none transition-colors"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpenModal(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-submit-opinion-final"
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-200 transition-all cursor-pointer"
                  >
                    Enviar para Revisión
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
