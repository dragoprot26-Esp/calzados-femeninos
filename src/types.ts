/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CustomColorConfig {
  primary: string;
  background: string;
  text: string;
  accent: string;
  headerBg: string;
  footerBg: string;
}

export type ThemePreset = 'NewYork' | 'Milan' | 'Paris' | 'London' | 'Tokyo';

export interface TenantTheme {
  preset: ThemePreset;
  primaryColor: string;
  textColor: string;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  fontFamily: 'sans' | 'serif' | 'mono';
  logoUrl?: string;
  bannerUrl?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  description: string;
  address: string;
  locationUrl: string;
  phone: string;
  prefix: string; // e.g., "+549"
  language: 'es' | 'en';
  categories: string[];
  theme: TenantTheme;
  // Background music fields
  bgMusicEnabled?: boolean;
  bgMusicUrl?: string;
  bgMusicTitle?: string;
  // Section visibility & features toggles
  showPrendas?: boolean;
  showOtros?: boolean;
  shippingEnabled?: boolean;
}

export interface CustomField {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  images: string[]; // 1 to 5 image URLs
  autoSlide: boolean;
  description: string;
  price: number;
  category: string;
  customFields: CustomField[];
  productType?: 'calzados' | 'prendas' | 'otros';
  sizes?: string[];
}

export interface Order {
  id: string;
  tenantId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  productIds: { productId: string; quantity: number }[];
  total: number;
  status: 'pending' | 'accepted' | 'delivered';
  withdrawalCode: string;
  shippingType?: 'delivery' | 'pickup';
  deliveryAddress?: string;
  createdAt: string; // ISO string
}

export interface Collaborator {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  username: string;
  password?: string; // stored plainly in simulation
  isAdmin2: boolean;
  avatarUrl?: string;
  active: boolean;
  sessionActive?: boolean;
  lastLoginAt?: string;
}

export interface Comment {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  clientName: string;
  content: string;
  email?: string;
  phone?: string;
  status: 'pending' | 'approved';
  isSuggestion: boolean; // true if suggestion, false if comment on product
  reply?: string;
  createdAt: string;
}

export interface AdminSettings {
  adminTextColor: string;
  adminMode: 'light' | 'medium' | 'dark';
}
