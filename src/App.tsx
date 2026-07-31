/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Tenant,
  Product,
  Order,
  Collaborator,
  Comment,
  AdminSettings
} from './types';
import {
  getSavedState,
  saveState,
  PRESETS,
  INITIAL_ADMIN_SETTINGS
} from './data/mockData';
import * as cloud from './services/cloud';
import * as biometria from './services/biometria';
import TenantSelector from './components/TenantSelector';
import HeaderPublic from './components/HeaderPublic';
import ProductCard from './components/ProductCard';
import OpinionsSection from './components/OpinionsSection';
import CartDrawer from './components/CartDrawer';
import AdminPanel from './components/AdminPanel';
import BackgroundMusicPlayer from './components/BackgroundMusicPlayer';
import Footer from './components/Footer';
import { ShoppingBag, Star, RefreshCw } from 'lucide-react';

export default function App() {
  // Master persistent state loaders
  const [db, setDb] = useState(() => getSavedState());

  // Active public views
  const [activeTenant, setActiveTenant] = useState<Tenant>(db.tenants[0]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [activeSection, setActiveSection] = useState<'todos' | 'calzados' | 'prendas' | 'otros'>('calzados');

  // Interactive panels
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Synchronize state changes to localStorage
  useEffect(() => {
    saveState(db);
  }, [db]);

  // Keep active tenant synchronized with any edits made in the admin panel
  useEffect(() => {
    const updatedTenant = db.tenants.find(t => t.id === activeTenant.id);
    if (updatedTenant) {
      setActiveTenant(updatedTenant);
    }
  }, [db.tenants, activeTenant.id]);

  // ── Nube (molde CyC) ───────────────────────────────────────────────────
  const cloudCodeRef = useRef<string | null>(null);
  const saveTimerRef = useRef<any>(null);
  const [bioAvail, setBioAvail] = useState(false);
  const [cloudAuthed, setCloudAuthed] = useState(false);

  // Inquilino NUEVO: boutique en blanco (sin datos demo), con el diseño base.
  const cleanTenant = (code: string, lic: any): Tenant => ({
    id: code,
    name: (lic && (lic.nombre_negocio || lic.cliente_nombre)) || 'Mi Boutique',
    slug: code.toLowerCase(),
    logo: '✨',
    banner: '',
    description: '',
    address: '',
    locationUrl: '',
    phone: '',
    prefix: '+549',
    language: 'es',
    categories: ['Todos', 'Zapatos', 'Zapatillas', 'Botas'],
    theme: { preset: 'Paris', primaryColor: '#ec4899', textColor: '#374151', fontSize: 'base', fontFamily: 'sans', logoUrl: '', bannerUrl: '' },
    showPrendas: true,
    showOtros: true,
    shippingEnabled: true,
  });

  // Escribe TODO el estado desde un blob de la nube (single-tenant = licencia).
  const hydrateFromCloud = (code: string, blob: cloud.CloudData) => {
    const t: Tenant = blob.tenant ? { ...(blob.tenant as Tenant), id: code, slug: (blob.tenant.slug || code.toLowerCase()) } : cleanTenant(code, null);
    const newDb = {
      tenants: [t],
      products: (blob.products || []).map((p: any) => ({ ...p, tenantId: code })),
      orders: (blob.orders || []).map((o: any) => ({ ...o, tenantId: code })),
      collaborators: (blob.collaborators || []).map((c: any) => ({ ...c, tenantId: code })),
      comments: (blob.comments || []).map((c: any) => ({ ...c, tenantId: code })),
      adminSettings: blob.adminSettings || INITIAL_ADMIN_SETTINGS,
    };
    setDb(newDb);
    setActiveTenant(t);
  };

  // Licencia NUEVA: arranca DE CERO.
  const cleanStart = (code: string, lic: any) => {
    const t = cleanTenant(code, lic);
    setDb({ tenants: [t], products: [], orders: [], collaborators: [], comments: [], adminSettings: INITIAL_ADMIN_SETTINGS });
    setActiveTenant(t);
  };

  // Login real con licencia (dueño o colaborador) — lo invoca el AdminPanel.
  const cloudLogin = async (role: 'admin' | 'collaborator', code: string, user: string, pass: string): Promise<{ ok: boolean; msg?: string }> => {
    const c = code.trim().toUpperCase();
    if (!c || !user || !pass) return { ok: false, msg: 'Completá licencia, usuario y contraseña.' };
    const lic = await cloud.validarLicencia(c);
    if (!lic) return { ok: false, msg: 'Licencia inválida, inactiva o vencida.' };
    const r = role === 'admin' ? await cloud.asegurarCuentaSeguraDueno(user.trim(), pass, c) : await cloud.asegurarCuentaSeguraColab(user.trim(), pass, c);
    if (!r.ok) return r;
    const remote = await cloud.cloudLoad(c);
    const tiene = !!(remote && (remote.tenant || (remote.products && remote.products.length)));
    if (tiene) hydrateFromCloud(c, remote as cloud.CloudData);
    else if (role === 'admin') cleanStart(c, lic);
    else if (remote) hydrateFromCloud(c, remote as cloud.CloudData);
    cloudCodeRef.current = c;
    try { localStorage.setItem('calf_last_license', c); } catch (e) { /* noop */ }
    setCloudAuthed(true);
    return { ok: true };
  };

  // Ingreso biométrico (reabre con la sesión de Supabase guardada).
  const cloudBioLogin = async (): Promise<{ ok: boolean; role?: 'admin' | 'collaborator'; msg?: string }> => {
    const meta = await biometria.desbloquear();
    if (!meta) return { ok: false, msg: 'No se pudo verificar la biometría.' };
    if (!cloud.estaLogueado()) return { ok: false, msg: 'La sesión venció. Ingresá con licencia una vez más.' };
    const remote = await cloud.cloudLoad(meta.licenseCode);
    if (remote) hydrateFromCloud(meta.licenseCode, remote as cloud.CloudData);
    cloudCodeRef.current = meta.licenseCode;
    setCloudAuthed(true);
    return { ok: true, role: meta.role };
  };

  const registrarBio = async (user: string, role: 'admin' | 'collaborator'): Promise<boolean> => {
    if (!cloudCodeRef.current) return false;
    try { return await biometria.registrar(cloudCodeRef.current, user, role); } catch (e) { return false; }
  };

  // Arranque: página pública por ?codigo o restaurar sesión admin.
  useEffect(() => {
    (async () => { try { setBioAvail(await biometria.soportada()); } catch (e) { /* noop */ } })();
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const codigo = (params.get('codigo') || params.get('tienda') || '').trim().toUpperCase();
      if (codigo) {
        cloudCodeRef.current = codigo;
        const pub = await cloud.calfPublica(codigo);
        // Siempre hidratamos por ?codigo (aunque la nube no devuelva nada): así
        // mostramos la tienda de esa licencia (limpia si no hay datos), nunca el demo.
        hydrateFromCloud(codigo, (pub || {}) as cloud.CloudData);
        return;
      }
      if (cloud.estaLogueado()) {
        try {
          const m = await cloud.miMembresia();
          if (m && m.tenant_id) {
            const remote = await cloud.cloudLoad(m.tenant_id);
            if (remote) hydrateFromCloud(m.tenant_id, remote as cloud.CloudData);
            cloudCodeRef.current = m.tenant_id;
            setCloudAuthed(true);
          }
        } catch (e) { /* sin sesión válida */ }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardado NO destructivo a la nube (solo con sesión admin/colaborador).
  useEffect(() => {
    if (!cloudAuthed || !cloudCodeRef.current) return;
    const code = cloudCodeRef.current;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const unir = (loc: any[], rem: any[]) => { const m = new Map<string, any>(); (rem || []).forEach(x => { if (x && x.id) m.set(x.id, x); }); (loc || []).forEach(x => { if (x && x.id) m.set(x.id, x); }); return Array.from(m.values()); };
        const remote = await cloud.cloudLoad(code);
        const tOrders = db.orders.filter(o => o.tenantId === code);
        const tComments = db.comments.filter(c => c.tenantId === code);
        const mergedOrders = unir(tOrders, (remote && remote.orders) || []);
        const mergedComments = unir(tComments, (remote && remote.comments) || []);
        const t = db.tenants.find(x => x.id === code) || db.tenants[0];
        await cloud.cloudSave(code, {
          tenant: t,
          products: db.products.filter(p => p.tenantId === code),
          orders: mergedOrders,
          collaborators: db.collaborators.filter(c => c.tenantId === code),
          comments: mergedComments,
          adminSettings: db.adminSettings,
        });
      } catch (e) { /* offline: queda local */ }
    }, 1000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, cloudAuthed]);

  // Poll en vivo (admin): trae pedidos/comentarios nuevos del público.
  useEffect(() => {
    if (!cloudAuthed || !cloudCodeRef.current) return;
    const code = cloudCodeRef.current;
    let lastVer = ''; let stop = false;
    const unir = (loc: any[], rem: any[]) => { const m = new Map<string, any>(); (rem || []).forEach(x => { if (x && x.id) m.set(x.id, x); }); (loc || []).forEach(x => { if (x && x.id) m.set(x.id, x); }); return Array.from(m.values()); };
    const traer = async () => {
      const ver = await cloud.calfVersion(code);
      if (stop || !ver || ver === lastVer) return;
      lastVer = ver;
      const remote = await cloud.cloudLoad(code);
      if (!remote) return;
      setDb(prev => {
        const others = prev.orders.filter(o => o.tenantId !== code);
        const otherC = prev.comments.filter(c => c.tenantId !== code);
        const mo = unir(prev.orders.filter(o => o.tenantId === code), (remote.orders || []).map((o: any) => ({ ...o, tenantId: code })));
        const mc = unir(prev.comments.filter(c => c.tenantId === code), (remote.comments || []).map((c: any) => ({ ...c, tenantId: code })));
        return { ...prev, orders: [...mo, ...others], comments: [...mc, ...otherC] };
      });
    };
    const iv = setInterval(traer, 12000);
    let ultimo = 0;
    const thr = () => { const n = Date.now(); if (n - ultimo < 4000) return; ultimo = n; traer(); };
    const alVolver = () => { if (document.visibilityState === 'visible') thr(); };
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('focus', thr);
    window.addEventListener('pageshow', thr);
    document.addEventListener('touchstart', thr, { passive: true });
    return () => { stop = true; clearInterval(iv); document.removeEventListener('visibilitychange', alVolver); window.removeEventListener('focus', thr); window.removeEventListener('pageshow', thr); document.removeEventListener('touchstart', thr); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudAuthed]);

  // Handle tenant switches
  const handleSelectTenant = (tenant: Tenant) => {
    setActiveTenant(tenant);
    setActiveCategory('Todos');
    setCart([]); // reset basket for the new store
  };

  // Handle new tenant additions
  const handleCreateTenant = (name: string, slug: string) => {
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name,
      slug,
      logo: '✨',
      banner: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&auto=format&fit=crop',
      description: 'Nueva boutique de calzado femenino. Catálogo listo para recibir tus encargos en tienda.',
      address: 'Dirección Comercial, Centro Histórico',
      locationUrl: 'https://maps.google.com',
      phone: '123456789',
      prefix: '+549',
      language: 'es',
      categories: ['Todos', 'Zapatos', 'Zapatillas', 'Botas'],
      theme: {
        preset: 'NewYork',
        primaryColor: '#000000',
        textColor: '#1f2937',
        fontSize: 'base',
        fontFamily: 'serif',
        logoUrl: '',
        bannerUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&auto=format&fit=crop'
      }
    };

    setDb(prev => ({
      ...prev,
      tenants: [...prev.tenants, newTenant]
    }));

    // Auto switch to the new tenant store
    setActiveTenant(newTenant);
    setActiveCategory('Todos');
    setCart([]);
  };

  // Reset demo databases
  const handleResetData = () => {
    if (confirm('¿Desea restablecer todas las tiendas, productos y reservas al estado original de la demo?')) {
      localStorage.clear();
      const fresh = getSavedState();
      setDb(fresh);
      setActiveTenant(fresh.tenants[0]);
      setActiveCategory('Todos');
      setCart([]);
    }
  };

  // Public shopping bag addition
  const handleAddToBag = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const nextQty = item.quantity + delta;
          return { ...item, quantity: nextQty < 1 ? 1 : nextQty };
        }
        return item;
      });
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handlePlaceOrder = (clientData: {
    name: string;
    phone: string;
    email?: string;
    shippingType?: 'delivery' | 'pickup';
    deliveryAddress?: string;
  }) => {
    const code = `RET-${Math.floor(1000 + Math.random() * 9000)}`;
    const total = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tenantId: activeTenant.id,
      clientName: clientData.name,
      clientPhone: clientData.phone,
      clientEmail: clientData.email,
      shippingType: clientData.shippingType || 'pickup',
      deliveryAddress: clientData.deliveryAddress,
      productIds: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
      total,
      status: 'pending',
      withdrawalCode: code,
      createdAt: new Date().toISOString()
    };

    setDb(prev => ({
      ...prev,
      orders: [newOrder, ...prev.orders]
    }));

    // Molde CyC: el pedido del cliente se agrega ATÓMICO a la nube (sin login).
    if (cloudCodeRef.current) cloud.calfAgregarPedido(cloudCodeRef.current, newOrder);

    return { code };
  };

  // Submit dynamic comment/opinions
  const handleSubmitComment = (productId: string, name: string, content: string, isSuggestion: boolean) => {
    const pName = db.products.find(p => p.id === productId)?.name || '';

    const newComment: Comment = {
      id: `com-${Date.now()}`,
      tenantId: activeTenant.id,
      productId,
      productName: pName,
      clientName: name,
      content,
      status: 'pending', // waits moderation in admin suggestions tab
      isSuggestion,
      createdAt: new Date().toISOString()
    };

    setDb(prev => ({
      ...prev,
      comments: [newComment, ...prev.comments]
    }));

    // Molde CyC: el comentario queda PENDIENTE de aprobar y se sube a la nube.
    if (cloudCodeRef.current) cloud.calfAgregarComentario(cloudCodeRef.current, newComment);
  };

  // Master update callbacks for admin mutations
  const handleUpdateTenant = (updated: Tenant) => {
    setDb(prev => ({
      ...prev,
      tenants: prev.tenants.map(t => t.id === updated.id ? updated : t)
    }));
  };

  const handleAddProduct = (p: Omit<Product, 'id' | 'tenantId'>) => {
    const newProduct: Product = {
      ...p,
      id: `prod-${Date.now()}`,
      tenantId: activeTenant.id
    };
    setDb(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
  };

  const handleUpdateProduct = (updated: Product) => {
    setDb(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === updated.id ? updated : p)
    }));
  };

  const handleDeleteProduct = (productId: string) => {
    setDb(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }));
  };

  const handleUpdateOrder = (updated: Order) => {
    setDb(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === updated.id ? updated : o)
    }));
  };

  const handleClearDeliveredOrders = () => {
    setDb(prev => ({
      ...prev,
      orders: prev.orders.filter(o => o.tenantId === activeTenant.id ? o.status !== 'delivered' : true)
    }));
  };

  const handleAddCollaborator = (collab: Omit<Collaborator, 'id' | 'tenantId' | 'active'>) => {
    const newCollab: Collaborator = {
      ...collab,
      id: `col-${Date.now()}`,
      tenantId: activeTenant.id,
      active: true
    };
    setDb(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, newCollab]
    }));
  };

  const handleUpdateCollaborator = (updated: Collaborator) => {
    setDb(prev => ({
      ...prev,
      collaborators: prev.collaborators.map(c => c.id === updated.id ? updated : c)
    }));
  };

  const handleDeleteCollaborator = (id: string) => {
    setDb(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c.id !== id)
    }));
  };

  const handleUpdateComment = (updated: Comment) => {
    setDb(prev => ({
      ...prev,
      comments: prev.comments.map(c => c.id === updated.id ? updated : c)
    }));
  };

  const handleUpdateAdminSettings = (settings: AdminSettings) => {
    setDb(prev => ({
      ...prev,
      adminSettings: settings
    }));
  };

  // Public filtered products list by section and category
  const allTenantProducts = db.products.filter(p => p.tenantId === activeTenant.id);

  const activeTenantProducts = allTenantProducts.filter(p => {
    if (activeSection === 'todos') return true;
    const pType = p.productType || 'calzados';
    return pType === activeSection;
  });

  // Dynamic category list for the currently selected section
  const sectionCategories = React.useMemo(() => {
    const set = new Set<string>();

    activeTenantProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });

    if (activeSection === 'calzados' || activeSection === 'todos') {
      activeTenant.categories.forEach(c => {
        if (c.toLowerCase() !== 'todos') set.add(c);
      });
    }

    return ['Todos', ...Array.from(set)];
  }, [activeTenantProducts, activeTenant.categories, activeSection]);

  const filteredProducts = activeCategory === 'Todos'
    ? activeTenantProducts
    : activeTenantProducts.filter(p => p.category === activeCategory);

  // Apply visual preset classes based on selected tenant theme
  const presetStyle = PRESETS[activeTenant.theme.preset] || PRESETS.NewYork;

  const getSectionTitle = () => {
    if (activeSection === 'todos') return 'Todos los Productos';
    if (activeSection === 'prendas') return 'Prendas';
    if (activeSection === 'otros') return 'Otros Productos';
    return 'Calzados';
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 ${presetStyle.classes.wrapper}`}
      style={{
        fontSize: activeTenant.theme.fontSize === 'sm' ? '14px' : activeTenant.theme.fontSize === 'lg' ? '18px' : activeTenant.theme.fontSize === 'xl' ? '20px' : '16px',
        fontFamily: activeTenant.theme.fontFamily === 'serif' ? 'Georgia, serif' : activeTenant.theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif'
      }}
    >
      {/* Header público interactivo */}
      <HeaderPublic
        tenant={activeTenant}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setActiveCategory('Todos');
        }}
        categories={sectionCategories}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onChangeLanguage={(lang) => {
          handleUpdateTenant({
            ...activeTenant,
            language: lang
          });
        }}
      />

      {/* Catálogo de calzado / prendas / otros */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <div className="flex justify-between items-center pb-2 border-b border-rose-100/30">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <span>{getSectionTitle()}</span>
              {activeCategory !== 'Todos' && (
                <span className="text-sm font-medium text-rose-500">/ {activeCategory}</span>
              )}
            </h2>
            <p className="text-xs text-gray-400">
              {activeTenant.language === 'es'
                ? `Mostrando ${filteredProducts.length} productos en ${getSectionTitle()}`
                : `Showing ${filteredProducts.length} items in ${getSectionTitle()}`}
            </p>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                tenant={activeTenant}
                onAddToBag={handleAddToBag}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/40 border border-dashed border-rose-200 rounded-3xl space-y-3">
            <div className="text-4xl text-rose-300">
              {activeSection === 'prendas' ? '👗' : activeSection === 'otros' ? '📦' : '👠'}
            </div>
            <h3 className="font-bold text-gray-800 text-sm uppercase">
              Sin productos en {getSectionTitle()}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Esta sección o categoría no posee productos asignados actualmente. Ingresa al panel de administración para agregarlos.
            </p>
          </div>
        )}

        {/* Apartado inferior de Opiniones y Reseñas de Clientes */}
        <OpinionsSection
          tenant={activeTenant}
          products={activeTenantProducts}
          comments={db.comments}
          onSubmitComment={handleSubmitComment}
        />
      </main>

      {/* Reproductor parlantito de música de ambiente para clientes */}
      <BackgroundMusicPlayer tenant={activeTenant} />

      {/* Botón flotante para canastita */}
      {cart.length > 0 && (
        <button
          id="btn-floating-cart"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-pink-500 text-white p-4 rounded-full shadow-2xl hover:bg-pink-600 transition-all hover:scale-110 active:scale-95 z-40 flex items-center gap-2 border border-pink-400"
          style={{ backgroundColor: activeTenant.theme.primaryColor }}
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-white text-pink-600 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-pink-500 shadow-sm animate-bounce">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <span className="text-xs font-bold uppercase hidden sm:inline tracking-wider">Ver Canasta</span>
        </button>
      )}

      {/* Drawer de la canastita de encargos */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        tenant={activeTenant}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onPlaceOrder={handlePlaceOrder}
        onClearCart={() => setCart([])}
      />

      {/* Panel de control de administrador con licencias, biometría y roles */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        tenant={activeTenant}
        tenants={db.tenants}
        onSelectTenant={handleSelectTenant}
        onCreateTenant={handleCreateTenant}
        products={db.products}
        orders={db.orders}
        collaborators={db.collaborators}
        comments={db.comments}
        adminSettings={db.adminSettings}
        onUpdateTenant={handleUpdateTenant}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateOrder={handleUpdateOrder}
        onClearDeliveredOrders={handleClearDeliveredOrders}
        onAddCollaborator={handleAddCollaborator}
        onUpdateCollaborator={handleUpdateCollaborator}
        onDeleteCollaborator={handleDeleteCollaborator}
        onUpdateComment={handleUpdateComment}
        onUpdateAdminSettings={handleUpdateAdminSettings}
        onRestoreBackup={(newDb) => setDb(newDb)}
        onResetData={handleResetData}
        cloudLogin={cloudLogin}
        cloudBioLogin={cloudBioLogin}
        registrarBio={registrarBio}
        bioAvail={bioAvail}
      />

      {/* Pie de página con botón de Visita Vitrina */}
      <Footer tenant={activeTenant} />
    </div>
  );
}
