/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tenant, Product, Order, Collaborator, Comment, AdminSettings } from '../types';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Sofía Calzados',
    slug: 'sofia',
    logo: '🌸',
    banner: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&auto=format&fit=crop',
    description: 'Calzado exclusivo para damas modernas. Diseños que inspiran elegancia y comodidad en cada paso.',
    address: 'Av. Corrientes 1540, Buenos Aires',
    locationUrl: 'https://maps.google.com/?q=Av.+Corrientes+1540,+Buenos+Aires',
    phone: '1123456789',
    prefix: '+549',
    language: 'es',
    categories: ['Todos', 'Zapatos', 'Zapatillas', 'Botas', 'Sandalias'],
    theme: {
      preset: 'NewYork',
      primaryColor: '#000000',
      textColor: '#1f2937',
      fontSize: 'base',
      fontFamily: 'serif',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&auto=format&fit=crop'
    },
    bgMusicEnabled: true,
    bgMusicUrl: 'https://www.youtube.com/watch?v=Dx5qFacd15s',
    bgMusicTitle: 'Bossa Nova Chill & Boutique',
    showPrendas: true,
    showOtros: true,
    shippingEnabled: true
  },
  {
    id: 'tenant-2',
    name: 'Milán Luxury Shoes',
    slug: 'milan',
    logo: '✨',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop',
    description: 'Estilo europeo de alta costura. Descubre el arte del calzado italiano diseñado especialmente para ti.',
    address: 'Vía Montenapoleone 8, Milán',
    locationUrl: 'https://maps.google.com/?q=Via+Montenapoleone+8,+Milano',
    phone: '2345678901',
    prefix: '+39',
    language: 'es',
    categories: ['Todos', 'Zapatos', 'Botas', 'Fiesta'],
    theme: {
      preset: 'Milan',
      primaryColor: '#b45309',
      textColor: '#111827',
      fontSize: 'lg',
      fontFamily: 'sans',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop'
    }
  },
  {
    id: 'tenant-3',
    name: 'París Glamour',
    slug: 'paris',
    logo: '👠',
    banner: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop',
    description: 'Delicadeza, romanticismo y colores pastel. Encuentra tus zapatos perfectos para brillar todos los días.',
    address: 'Rue de Rivoli 42, París',
    locationUrl: 'https://maps.google.com/?q=Rue+de+Rivoli+42,+Paris',
    phone: '3456789012',
    prefix: '+33',
    language: 'es',
    categories: ['Todos', 'Zapatos', 'Zapatillas', 'Tacos-Altos'],
    theme: {
      preset: 'Paris',
      primaryColor: '#ec4899',
      textColor: '#374151',
      fontSize: 'sm',
      fontFamily: 'sans',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop'
    }
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  // Tenant 1
  {
    id: 'prod-1',
    tenantId: 'tenant-1',
    name: 'Stilettos Velvet Royale',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596568129885-63385b76343a?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581089781785-603411fa81e5?w=500&auto=format&fit=crop'
    ],
    autoSlide: true,
    description: 'Zapatos de tacón alto en acabado de gamuza azul real y suela reforzada para una comodidad sin igual. Ideales para eventos especiales.',
    price: 12500,
    category: 'Zapatos',
    customFields: [
      { label: 'Tacón', value: '9.5 cm' },
      { label: 'Material', value: 'Gamuza Premium' },
      { label: 'Suela', value: 'Goma Antideslizante' }
    ]
  },
  {
    id: 'prod-2',
    tenantId: 'tenant-1',
    name: 'Sneakers Golden Sunset',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&auto=format&fit=crop'
    ],
    autoSlide: false,
    description: 'Zapatillas deportivas urbanas con detalles en tonos dorados y plantilla de espuma con memoria. Súper cancheras y cómodas.',
    price: 9800,
    category: 'Zapatillas',
    customFields: [
      { label: 'Estilo', value: 'Urbano/Casual' },
      { label: 'Plantilla', value: 'Memory Foam' }
    ]
  },
  {
    id: 'prod-3',
    tenantId: 'tenant-1',
    name: 'Botas Croft de Cuero Negro',
    images: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&auto=format&fit=crop'
    ],
    autoSlide: true,
    description: 'Botas de cuero vacuno legítimo con cordones y cierre lateral para calzado rápido. Suela tractorada de alta durabilidad.',
    price: 18500,
    category: 'Botas',
    customFields: [
      { label: 'Caña', value: 'Media (15 cm)' },
      { label: 'Material', value: 'Cuero Vacuno 100%' }
    ]
  },
  {
    id: 'prod-4',
    tenantId: 'tenant-1',
    name: 'Sandalia Sahara Coral',
    images: [
      'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=500&auto=format&fit=crop'
    ],
    autoSlide: false,
    description: 'Sandalias de cuero ecológico coral con tiras ajustables y taco plataforma de corcho liviano. Perfectas para la primavera.',
    price: 8400,
    category: 'Sandalias',
    customFields: [
      { label: 'Plataforma', value: '4.5 cm' },
      { label: 'Ajuste', value: 'Hebilla Metálica' }
    ]
  },

  // Tenant 2
  {
    id: 'prod-5',
    tenantId: 'tenant-2',
    name: 'Mocasines Milano Oro',
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&auto=format&fit=crop'
    ],
    autoSlide: false,
    description: 'Clásicos mocasines italianos con aplique metálico dorado de alta gama. Máxima finura y cuero ultra suave.',
    price: 24500,
    category: 'Zapatos',
    customFields: [
      { label: 'Origen', value: 'Hecho en Italia' },
      { label: 'Forro', value: 'Piel de Cabra' }
    ]
  },
  {
    id: 'prod-6',
    tenantId: 'tenant-2',
    name: 'Botas Chelsea Florence',
    images: [
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&auto=format&fit=crop'
    ],
    autoSlide: true,
    description: 'Botas tipo chelsea con elásticos laterales y cuero engrasado repelente al agua. El toque de distinción para el invierno.',
    price: 32000,
    category: 'Botas',
    productType: 'calzados',
    sizes: ['36', '37', '38', '39'],
    customFields: [
      { label: 'Modelo', value: 'Chelsea Boots' },
      { label: 'Resistencia', value: 'Semi-Impermeable' }
    ]
  },
  // Prendas para Tenant 1
  {
    id: 'prod-p1',
    tenantId: 'tenant-1',
    name: 'Vestido Midi Lino Noche',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop'
    ],
    autoSlide: true,
    description: 'Vestido midi confeccionado en lino natural, escote corte corazón y breteles regulables. Elegancia fresca para eventos.',
    price: 24900,
    category: 'Vestidos',
    productType: 'prendas',
    sizes: ['XS', 'S', 'M', 'L'],
    customFields: [
      { label: 'Tela', value: '100% Lino Importado' },
      { label: 'Cuidado', value: 'Lavar con agua fría' }
    ]
  },
  {
    id: 'prod-p2',
    tenantId: 'tenant-1',
    name: 'Blazer Oversize Brizza',
    images: [
      'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=500&auto=format&fit=crop'
    ],
    autoSlide: false,
    description: 'Blazer de sastrería corte holgado oversize con solapa clásica y botones carey. Ideal para combinar con jean o pantalón de vestir.',
    price: 31500,
    category: 'Sastrería',
    productType: 'prendas',
    sizes: ['S', 'M', 'L', 'XL'],
    customFields: [
      { label: 'Corte', value: 'Oversize Fit' },
      { label: 'Forro', value: 'Satinado interior' }
    ]
  },
  // Otros productos para Tenant 1
  {
    id: 'prod-o1',
    tenantId: 'tenant-1',
    name: 'Cartera Tote Leather Rose',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&auto=format&fit=crop'
    ],
    autoSlide: true,
    description: 'Cartera amplia estilo Tote fabricada en eco-cuero graneado con broche magnético e interior organizador.',
    price: 19800,
    category: 'Accesorios',
    productType: 'otros',
    sizes: ['Única'],
    customFields: [
      { label: 'Dimensiones', value: '35 x 28 x 12 cm' },
      { label: 'Cierre', value: 'Cierre metálico central' }
    ]
  }
];

export const INITIAL_COLLABORATORS: Collaborator[] = [
  {
    id: 'col-1',
    tenantId: 'tenant-1',
    name: 'Carolina Gómez',
    phone: '1134567890',
    username: 'caro.calzados',
    password: '123',
    isAdmin2: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop',
    active: true,
    sessionActive: true,
    lastLoginAt: '2026-07-28T18:00:00.000Z'
  },
  {
    id: 'col-2',
    tenantId: 'tenant-1',
    name: 'Lucía Fernández',
    phone: '1145678901',
    username: 'lucia.calzados',
    password: '123',
    isAdmin2: false,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop',
    active: true,
    sessionActive: true,
    lastLoginAt: '2026-07-28T17:30:00.000Z'
  },
  {
    id: 'col-3',
    tenantId: 'tenant-2',
    name: 'Francesca Rossi',
    phone: '2345678999',
    username: 'francesca',
    password: '123',
    isAdmin2: false,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop',
    active: true,
    sessionActive: true,
    lastLoginAt: '2026-07-28T16:15:00.000Z'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1',
    tenantId: 'tenant-1',
    clientName: 'María Eugenia',
    clientPhone: '1155556666',
    clientEmail: 'maru@example.com',
    productIds: [{ productId: 'prod-1', quantity: 1 }],
    total: 12500,
    status: 'delivered',
    withdrawalCode: 'RET-3948',
    shippingType: 'pickup',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000 * 2).toISOString() // 2 days ago
  },
  {
    id: 'ord-2',
    tenantId: 'tenant-1',
    clientName: 'Valeria Solís',
    clientPhone: '1166667777',
    clientEmail: 'valeria@example.com',
    productIds: [{ productId: 'prod-2', quantity: 1 }],
    total: 9800,
    status: 'accepted',
    withdrawalCode: 'RET-9012',
    shippingType: 'delivery',
    deliveryAddress: 'Av. Santa Fe 2340, Depto 4B, CABA',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() // 1 day ago
  },
  {
    id: 'ord-3',
    tenantId: 'tenant-1',
    clientName: 'Gabriela Paz',
    clientPhone: '1177778888',
    productIds: [{ productId: 'prod-4', quantity: 1 }],
    total: 8400,
    status: 'pending',
    withdrawalCode: 'RET-1523',
    shippingType: 'delivery',
    deliveryAddress: 'Calle Las Heras 1820, Palermo',
    createdAt: new Date().toISOString() // today
  }
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'com-1',
    tenantId: 'tenant-1',
    productId: 'prod-1',
    productName: 'Stilettos Velvet Royale',
    clientName: 'Alejandra Pérez',
    content: '¡Los zapatos son un sueño! Cómodos y el color es idéntico a las fotos.',
    status: 'approved',
    isSuggestion: false,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000 * 3).toISOString()
  },
  {
    id: 'com-2',
    tenantId: 'tenant-1',
    productId: 'prod-2',
    productName: 'Sneakers Golden Sunset',
    clientName: 'Luciana Di',
    content: '¿Vienen en color plateado también o solo dorado?',
    status: 'pending',
    isSuggestion: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'com-3',
    tenantId: 'tenant-1',
    productId: '',
    productName: '',
    clientName: 'Natalia Ruiz',
    content: 'Me encantaría que abrieran un local en Palermo, el catálogo digital está genial.',
    email: 'natalia.ruiz@example.com',
    status: 'approved',
    isSuggestion: true,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  }
];

export const INITIAL_ADMIN_SETTINGS: AdminSettings = {
  adminTextColor: '#1e293b',
  adminMode: 'light'
};

// Key presets style declarations
export const PRESETS = {
  NewYork: {
    name: 'Estilo Nueva York',
    description: 'Estética moderna, minimalista de alto contraste. Tipografía Serif elegante y colores sobrios (Negro, Blanco y Gris).',
    classes: {
      wrapper: 'bg-stone-50 font-serif text-neutral-900',
      header: 'bg-black text-white py-6 border-b border-neutral-800',
      hero: 'bg-neutral-900 text-white py-16 px-4 text-center border-b border-neutral-800',
      card: 'bg-white rounded-none border border-neutral-200 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:border-neutral-400',
      badge: 'bg-black text-white text-xs tracking-wider uppercase px-2.5 py-1 font-sans',
      button: 'bg-black text-white hover:bg-neutral-800 rounded-none transition-colors py-2 px-4 uppercase tracking-wider font-sans text-xs font-semibold',
      secondaryButton: 'bg-white text-black border border-neutral-300 hover:bg-neutral-50 rounded-none py-2 px-4 uppercase tracking-wider font-sans text-xs',
      categoryActive: 'border-b-2 border-black font-semibold text-black py-2 font-sans',
      categoryInactive: 'text-neutral-500 hover:text-black py-2 font-sans',
      footer: 'bg-black text-neutral-400 py-12 border-t border-neutral-800 font-sans'
    },
    colors: {
      primary: '#000000',
      secondary: '#f5f5f4',
      accent: '#a3a3a3'
    }
  },
  Milan: {
    name: 'Estilo Milán',
    description: 'Estilo italiano de lujo y calidez. Tonos tabaco, café y oro con tipografía Sans pulida.',
    classes: {
      wrapper: 'bg-amber-50/20 font-sans text-stone-900',
      header: 'bg-stone-900 text-amber-100 py-6 border-b border-amber-800/40',
      hero: 'bg-stone-800 text-amber-50 py-16 px-4 text-center relative overflow-hidden',
      card: 'bg-white rounded-lg border border-amber-900/10 overflow-hidden shadow-sm hover:shadow-lg hover:border-amber-900/20 transition-all duration-300',
      badge: 'bg-amber-700 text-amber-50 text-xs px-2.5 py-1 rounded-md font-medium',
      button: 'bg-amber-800 text-white hover:bg-amber-900 rounded-md transition-colors py-2 px-4 font-semibold text-sm',
      secondaryButton: 'bg-stone-100 text-amber-900 hover:bg-stone-200 rounded-md py-2 px-4 text-sm font-medium border border-amber-900/10',
      categoryActive: 'bg-amber-800 text-white px-4 py-1.5 rounded-full text-sm font-medium',
      categoryInactive: 'text-amber-900/60 hover:bg-amber-50 hover:text-amber-950 px-4 py-1.5 rounded-full text-sm transition-all',
      footer: 'bg-stone-900 text-stone-400 py-12'
    },
    colors: {
      primary: '#92400e',
      secondary: '#fafaf9',
      accent: '#d97706'
    }
  },
  Paris: {
    name: 'Estilo París',
    description: 'Glamour, romanticismo y tonos rosados suaves con crema y tipografías amables y elegantes.',
    classes: {
      wrapper: 'bg-pink-50/10 font-sans text-rose-950',
      header: 'bg-rose-100/80 text-rose-900 py-6 border-b border-rose-200 backdrop-blur-sm',
      hero: 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-900 py-16 px-4 text-center',
      card: 'bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300',
      badge: 'bg-rose-400 text-white text-xs px-2.5 py-1 rounded-full font-medium',
      button: 'bg-rose-500 text-white hover:bg-rose-600 rounded-full transition-colors py-2.5 px-5 font-semibold text-sm shadow-md shadow-rose-200',
      secondaryButton: 'bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-full py-2 px-4 text-sm font-medium',
      categoryActive: 'border-b-2 border-rose-500 text-rose-600 font-semibold py-2 px-1',
      categoryInactive: 'text-rose-400 hover:text-rose-600 py-2 px-1',
      footer: 'bg-rose-950 text-rose-200 py-12'
    },
    colors: {
      primary: '#ec4899',
      secondary: '#fff1f2',
      accent: '#f43f5e'
    }
  },
  London: {
    name: 'Estilo Londres',
    description: 'Estilo tradicional británico con un toque de modernidad. Azul real, burdeos y gris estructurado.',
    classes: {
      wrapper: 'bg-slate-50 font-sans text-slate-900',
      header: 'bg-slate-900 text-white py-6 border-b border-slate-700',
      hero: 'bg-slate-800 text-white py-16 px-4 text-center',
      card: 'bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300',
      badge: 'bg-sky-700 text-white text-xs px-2.5 py-1 rounded-sm font-medium uppercase tracking-wide',
      button: 'bg-slate-900 text-white hover:bg-slate-800 rounded-sm transition-colors py-2 px-4 uppercase tracking-wide font-medium text-xs',
      secondaryButton: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 rounded-sm py-2 px-4 text-xs font-medium',
      categoryActive: 'bg-slate-900 text-white px-4 py-1.5 rounded-sm text-xs font-medium uppercase tracking-wide',
      categoryInactive: 'text-slate-500 hover:text-slate-900 px-4 py-1.5 text-xs font-medium uppercase tracking-wide',
      footer: 'bg-slate-900 text-slate-400 py-12'
    },
    colors: {
      primary: '#0f172a',
      secondary: '#f8fafc',
      accent: '#0369a1'
    }
  },
  Tokyo: {
    name: 'Estilo Tokio',
    description: 'Moda minimalista de vanguardia, futurista e impregnada de tonos neon sutiles y diseño cyber.',
    classes: {
      wrapper: 'bg-zinc-950 font-mono text-zinc-200',
      header: 'bg-black text-cyan-400 py-6 border-b border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      hero: 'bg-zinc-900 text-cyan-100 py-16 px-4 text-center border-b border-zinc-800',
      card: 'bg-zinc-900 rounded-none border border-zinc-800 overflow-hidden hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300',
      badge: 'bg-cyan-500 text-black text-xs px-2.5 py-1 font-bold rounded-none uppercase tracking-widest',
      button: 'bg-cyan-500 text-black hover:bg-cyan-400 rounded-none transition-colors py-2 px-4 font-bold uppercase text-xs tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.2)]',
      secondaryButton: 'bg-zinc-800 text-cyan-400 border border-zinc-700 hover:bg-zinc-700 rounded-none py-2 px-4 text-xs',
      categoryActive: 'text-cyan-400 border-b-2 border-cyan-400 py-2 font-bold tracking-widest',
      categoryInactive: 'text-zinc-500 hover:text-cyan-400 py-2 transition-colors',
      footer: 'bg-black text-zinc-600 py-12 border-t border-zinc-900'
    },
    colors: {
      primary: '#06b6d4',
      secondary: '#09090b',
      accent: '#ec4899'
    }
  }
};

// Local storage management helpers
export function getSavedState() {
  if (typeof window === 'undefined') {
    return {
      tenants: INITIAL_TENANTS,
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      collaborators: INITIAL_COLLABORATORS,
      comments: INITIAL_COMMENTS,
      adminSettings: INITIAL_ADMIN_SETTINGS
    };
  }

  const loadOrSet = <T>(key: string, initial: T): T => {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
  };

  return {
    tenants: loadOrSet('shoes_tenants', INITIAL_TENANTS),
    products: loadOrSet('shoes_products', INITIAL_PRODUCTS),
    orders: loadOrSet('shoes_orders', INITIAL_ORDERS),
    collaborators: loadOrSet('shoes_collaborators', INITIAL_COLLABORATORS),
    comments: loadOrSet('shoes_comments', INITIAL_COMMENTS),
    adminSettings: loadOrSet('shoes_admin_settings', INITIAL_ADMIN_SETTINGS)
  };
}

export function saveState(data: {
  tenants: Tenant[];
  products: Product[];
  orders: Order[];
  collaborators: Collaborator[];
  comments: Comment[];
  adminSettings: AdminSettings;
}) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('shoes_tenants', JSON.stringify(data.tenants));
  localStorage.setItem('shoes_products', JSON.stringify(data.products));
  localStorage.setItem('shoes_orders', JSON.stringify(data.orders));
  localStorage.setItem('shoes_collaborators', JSON.stringify(data.collaborators));
  localStorage.setItem('shoes_comments', JSON.stringify(data.comments));
  localStorage.setItem('shoes_admin_settings', JSON.stringify(data.adminSettings));
}
