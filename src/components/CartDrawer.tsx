/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Tenant } from '../types';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Copy,
  MessageCircle,
  Mail,
  Store,
  ChevronRight,
  Truck,
  MapPin
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  tenant: Tenant;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onPlaceOrder: (clientData: {
    name: string;
    phone: string;
    email?: string;
    shippingType?: 'delivery' | 'pickup';
    deliveryAddress?: string;
  }) => { code: string };
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  tenant,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  onClearCart
}: CartDrawerProps) {
  // Checkout flow state
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [shippingType, setShippingType] = useState<'delivery' | 'pickup'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [withdrawalCode, setWithdrawalCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const total = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) return;
    if (shippingType === 'delivery' && !deliveryAddress.trim()) return;

    // Place order and retrieve the generated withdrawal code
    const result = onPlaceOrder({
      name: clientName.trim(),
      phone: clientPhone.trim(),
      email: clientEmail.trim() || undefined,
      shippingType,
      deliveryAddress: shippingType === 'delivery' ? deliveryAddress.trim() : undefined
    });

    setWithdrawalCode(result.code);
    setStep('success');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(withdrawalCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = shippingType === 'delivery'
    ? `¡Hola! Acabo de hacer un encargo con Envío a Domicilio en ${tenant.name}. Mi código de pedido es: *${withdrawalCode}*. Dirección de entrega: *${deliveryAddress}*. Total a pagar: $${total.toLocaleString('es-AR')}.`
    : `¡Hola! Acabo de hacer un encargo en ${tenant.name}. Mi código de retiro en local es: *${withdrawalCode}*. Total a pagar: $${total.toLocaleString('es-AR')}.`;

  const handleShareWhatsApp = () => {
    // Standard phone clean format
    const cleanPhone = tenant.phone.replace(/[^0-9]/g, '');
    const url = `https://api.whatsapp.com/send?phone=${tenant.prefix}${cleanPhone}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const url = `mailto:${clientEmail || ''}?subject=${encodeURIComponent('Tu código de retiro de calzado en ' + tenant.name)}&body=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleResetCartAndClose = () => {
    onClearCart();
    setStep('cart');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setWithdrawalCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
      {/* Click outside to close (only if not on success screen) */}
      <div className="absolute inset-0 cursor-default" onClick={step !== 'success' ? onClose : undefined} />

      {/* Drawer Container */}
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col z-10 animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/20">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-gray-900 text-sm uppercase tracking-wider">
              {step === 'cart' && 'Canastita de Encargo'}
              {step === 'checkout' && 'Datos de Retiro'}
              {step === 'success' && '¡Encargo Confirmado!'}
            </span>
            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {cartItems.length} {cartItems.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>
          {step !== 'success' && (
            <button
              id="btn-close-cart"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {step === 'cart' && (
            <>
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                  <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm uppercase">Tu canastita está vacía</h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                      Explora el catálogo de calzado femenino de {tenant.name} y selecciona tus modelos favoritos para reservar.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-full shadow-md transition-transform active:scale-95"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100/80 hover:border-rose-100 transition-all"
                    >
                      {/* Imagen */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-100 flex-shrink-0">
                        <img
                          src={item.product.images[0] || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=100'}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Detalles e Incremento */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{item.product.name}</h4>
                            <button
                              id={`btn-remove-cart-${item.product.id}`}
                              onClick={() => onRemoveItem(item.product.id)}
                              className="text-slate-400 hover:text-red-500 p-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{item.product.category}</span>
                        </div>

                        <div className="flex justify-between items-center mt-1">
                          <span className="font-bold text-xs text-rose-600">
                            ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                          </span>

                          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-0.5">
                            <button
                              id={`btn-dec-qty-${item.product.id}`}
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-500 text-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-slate-800 px-1">{item.quantity}</span>
                            <button
                              id={`btn-inc-qty-${item.product.id}`}
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-500 text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              {/* Opciones de Método de Entrega (solo si envíos están habilitados en el local) */}
              {tenant.shippingEnabled !== false && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">
                    Método de Entrega *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="btn-shipping-pickup"
                      onClick={() => setShippingType('pickup')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer ${
                        shippingType === 'pickup'
                          ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Store className={`w-5 h-5 ${shippingType === 'pickup' ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span className="text-xs">Retiro en Local</span>
                    </button>

                    <button
                      type="button"
                      id="btn-shipping-delivery"
                      onClick={() => setShippingType('delivery')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer ${
                        shippingType === 'delivery'
                          ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className={`w-5 h-5 ${shippingType === 'delivery' ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span className="text-xs">Envío a Domicilio</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Caja Informativa según método de entrega */}
              {shippingType === 'delivery' ? (
                <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/70 text-xs text-amber-950 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Truck className="w-4 h-4 text-amber-700" />
                    <span>Envío a Domicilio</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-900">
                    Tu pedido será enviado a la dirección ingresada. Nos comunicaremos por WhatsApp para coordinar la entrega.
                  </p>
                </div>
              ) : (
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 text-xs text-rose-950 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <Store className="w-4 h-4" />
                    <span>Información de Retiro</span>
                  </div>
                  <p className="leading-relaxed">
                    Tu reserva será guardada en nuestro local ubicado en: <strong className="block text-[11px] mt-0.5">{tenant.address}</strong>
                  </p>
                  <p className="leading-relaxed text-[11px] text-rose-900">
                    Al confirmar, se te otorgará un código único para retirar y abonar el calzado físicamente en tienda.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carolina Pérez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono Móvil (WhatsApp) *</label>
                  <div className="flex">
                    <span className="bg-gray-100 border border-gray-200 border-r-0 rounded-l-xl py-2.5 px-3 text-xs text-gray-500 font-mono flex items-center">
                      {tenant.prefix}
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 11 2345 6789"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full text-sm bg-gray-50 border border-gray-200 rounded-r-xl py-2.5 px-3.5 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Campo Dirección habilitado si es Envío a Domicilio */}
                {shippingType === 'delivery' && (
                  <div className="animate-fadeIn">
                    <label className="block text-xs font-bold text-rose-700 uppercase mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Dirección de Entrega / Domicilio *</span>
                    </label>
                    <input
                      type="text"
                      id="input-delivery-address"
                      required
                      placeholder="Ej. Av. Santa Fe 2340, Depto 4B, CABA"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full text-sm bg-amber-50/50 border border-amber-300 rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Lista Resumen en Checkout */}
              <div className="pt-3 border-t border-rose-50">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Resumen de Modelos</span>
                <div className="space-y-1">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center text-xs text-gray-600 font-medium">
                      <span>{item.product.name} (x{item.quantity})</span>
                      <span>${(item.product.price * item.quantity).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                id="btn-submit-order"
                type="submit"
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-200 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <span>{shippingType === 'delivery' ? 'Confirmar Encargo con Envío' : 'Aceptar Encargo'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-5 text-center py-6 animate-scaleIn">
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-base">
                  {shippingType === 'delivery' ? '¡Encargo con Envío Registrado!' : '¡Reserva Registrada Exitosamente!'}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed px-4">
                  {shippingType === 'delivery' ? (
                    <>
                      Tu encargo será entregado en <strong>{deliveryAddress}</strong>. Guarda tu código para seguimiento.
                    </>
                  ) : (
                    <>
                      Presenta el siguiente código al visitar nuestro local de {tenant.name} para retirar y abonar tus calzados.
                    </>
                  )}
                </p>
              </div>

              {/* Codigo de Retiro Box */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-2 max-w-xs mx-auto shadow-inner">
                <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                  {shippingType === 'delivery' ? 'CÓDIGO DE SEGUIMIENTO / PEDIDO' : 'CÓDIGO DE RETIRO EN LOCAL'}
                </span>
                <span className="block text-2xl font-mono font-black tracking-widest text-pink-400 select-all">
                  {withdrawalCode}
                </span>

                <button
                  id="btn-copy-withdrawal"
                  onClick={handleCopyCode}
                  className="mx-auto flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-full text-slate-300 active:scale-95 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 font-bold">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar código</span>
                    </>
                  )}
                </button>
              </div>

              {/* Opciones de Envío por Redes/WhatsApp/Mail */}
              <div className="space-y-2 pt-4 border-t border-rose-50 max-w-xs mx-auto text-left">
                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center mb-2">
                  COMPARTIR CÓDIGO
                </span>

                <button
                  id="btn-send-code-whatsapp"
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center justify-between p-2.5 bg-green-50 hover:bg-green-100 text-green-800 rounded-xl transition-all text-xs font-semibold cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600 fill-green-600/15" />
                    <span>Enviar por WhatsApp</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id="btn-send-code-email"
                  onClick={handleShareEmail}
                  className="w-full flex items-center justify-between p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl transition-all text-xs font-semibold cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-600" />
                    <span>Enviar por Correo</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                id="btn-finish-cart"
                onClick={handleResetCartAndClose}
                className="w-full max-w-xs py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Volver al Catálogo
              </button>
            </div>
          )}
        </div>

        {/* Footer Subtotal Panel (only shown on 'cart' or 'checkout' stages) */}
        {cartItems.length > 0 && step !== 'success' && (
          <div className="p-4 border-t border-rose-100 bg-slate-50 space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-gray-500 font-medium">Subtotal de Reserva:</span>
              <span className="text-lg font-black text-rose-600">${total.toLocaleString('es-AR')}</span>
            </div>

            {step === 'cart' && (
              <button
                id="btn-go-to-checkout"
                onClick={() => setStep('checkout')}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-200 text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                style={{ backgroundColor: tenant.theme.primaryColor }}
              >
                <span>Proceder a Reserva</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 'checkout' && (
              <button
                id="btn-back-to-cart"
                onClick={() => setStep('cart')}
                className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
              >
                Volver a la canasta
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
