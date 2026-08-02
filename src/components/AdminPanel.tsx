/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Tenant,
  Product,
  Order,
  Collaborator,
  Comment,
  AdminSettings,
  CustomField,
  ThemePreset
} from '../types';
import { PRESETS } from '../data/mockData';
import {
  Shield,
  LayoutDashboard,
  Tag,
  ShoppingBag,
  Users,
  MessageSquare,
  MessageCircle,
  Palette,
  Settings,
  X,
  LogOut,
  Download,
  Trash2,
  Plus,
  Minus,
  Edit2,
  Check,
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  Phone,
  Mail,
  UserCheck,
  Image,
  RefreshCw,
  Sliders,
  Sparkles,
  Eye,
  Upload,
  QrCode,
  Printer,
  Share2,
  Copy,
  ExternalLink,
  Music,
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Disc,
  Shirt,
  Package,
  Truck,
  MapPin,
  Store,
  Database,
  User
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  tenants?: Tenant[];
  onSelectTenant?: (tenant: Tenant) => void;
  onCreateTenant?: (name: string, slug: string) => void;
  products: Product[];
  orders: Order[];
  collaborators: Collaborator[];
  comments: Comment[];
  adminSettings: AdminSettings;

  // State mutations
  onUpdateTenant: (updated: Tenant) => void;
  onAddProduct: (product: Omit<Product, 'id' | 'tenantId'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrder: (order: Order) => void;
  onClearDeliveredOrders: () => void;
  onAddCollaborator: (collab: Omit<Collaborator, 'id' | 'tenantId' | 'active'>) => void;
  onUpdateCollaborator: (collab: Collaborator) => void;
  onDeleteCollaborator: (id: string) => void;
  onUpdateComment: (comment: Comment) => void;
  onUpdateAdminSettings: (settings: AdminSettings) => void;
  onRestoreBackup?: (backupData: any) => void;
  onResetData?: () => void;

  // Molde CyC: login real contra la nube
  cloudLogin?: (role: 'admin' | 'collaborator', code: string, user: string, pass: string) => Promise<{ ok: boolean; msg?: string }>;
  cloudBioLogin?: () => Promise<{ ok: boolean; role?: 'admin' | 'collaborator'; msg?: string }>;
  registrarBio?: (user: string, role: 'admin' | 'collaborator') => Promise<boolean>;
  bioAvail?: boolean;
  startAuthenticated?: boolean;   // recarga estando logueado → entra directo al panel
  onLogout?: () => void;          // "Salir": cierra sesión de nube y sale del panel
}

export default function AdminPanel({
  isOpen,
  onClose,
  tenant,
  tenants = [],
  onSelectTenant,
  onCreateTenant,
  products,
  orders,
  collaborators,
  comments,
  adminSettings,
  onUpdateTenant,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrder,
  onClearDeliveredOrders,
  onAddCollaborator,
  onUpdateCollaborator,
  onDeleteCollaborator,
  onUpdateComment,
  onUpdateAdminSettings,
  onRestoreBackup,
  onResetData,
  cloudLogin,
  cloudBioLogin,
  registrarBio,
  bioAvail = false,
  startAuthenticated = false,
  onLogout
}: AdminPanelProps) {
  // Auth flow states
  const [isAuthenticated, setIsAuthenticated] = useState(startAuthenticated);
  const [authRole, setAuthRole] = useState<'admin' | 'collaborator'>('admin');
  const [licenseKey, setLicenseKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeCollaborator, setActiveCollaborator] = useState<Collaborator | null>(null);
  const [loginError, setLoginError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [rememberBio, setRememberBio] = useState(false);

  // Backup & Restore states
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);
  const [backupErrorMsg, setBackupErrorMsg] = useState<string | null>(null);

  // Biometrics login flow simulation
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [biometricApproved, setBiometricApproved] = useState(false);

  // Collaboration Access simulation prompt
  const [collabRequestPending, setCollabRequestPending] = useState<Collaborator | null>(null);

  // Active Admin tab selection
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'prendas' | 'otros' | 'orders' | 'collaborators' | 'comments' | 'theme' | 'music' | 'adminSettings'>('dashboard');

  // Excel / CSV Export local filters
  const [exportFilter, setExportFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');

  // Product addition / editing states
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodImages, setProdImages] = useState<string[]>(['']);
  const [prodAutoSlide, setProdAutoSlide] = useState(false);
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState(1000);
  const [prodCategory, setProdCategory] = useState('');
  const [prodFields, setProdFields] = useState<CustomField[]>([]);
  const [prodSizes, setProdSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [prodType, setProdType] = useState<'calzados' | 'prendas' | 'otros'>('calzados');
  const [newCatName, setNewCatName] = useState('');

  // Collaborator editing states
  const [isEditingCollab, setIsEditingCollab] = useState<Collaborator | null>(null);
  const [showAddCollabForm, setShowAddCollabForm] = useState(false);
  const [collabName, setCollabName] = useState('');
  const [collabPhone, setCollabPhone] = useState('');
  const [collabUsername, setCollabUsername] = useState('');
  const [collabPassword, setCollabPassword] = useState('');
  const [collabIsAdmin2, setCollabIsAdmin2] = useState(false);
  const [collabAvatar, setCollabAvatar] = useState('');

  // Sugerencia email/whatsapp modal state
  const [replyingComment, setReplyingComment] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');

  // QR & Public URL Sharing states
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customQrText, setCustomQrText] = useState(
    '¡Escanéa este código QR con la cámara de tu celular para ver nuestro catálogo exclusivo de productos y hacer tu pedido!'
  );

  // Molde CyC: el link/QR público apunta a la página del local por ?codigo=licencia.
  const publicTenantUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?codigo=${encodeURIComponent(tenant.id)}`
    : `?codigo=${tenant.id}`;

  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicTenantUrl)}`;

  const handleShareOrCopyLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tenant.name,
          text: `¡Mira el catálogo exclusivo de ${tenant.name}!`,
          url: publicTenantUrl
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(publicTenantUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      alert(`Copia este enlace: ${publicTenantUrl}`);
    }
  };

  const handleDownloadQr = () => {
    const a = document.createElement('a');
    a.href = qrCodeImageUrl;
    a.download = `QR-${tenant.slug}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintFlyer = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoHtml = tenant.logo && (tenant.logo.startsWith('http') || tenant.logo.startsWith('data:image'))
      ? `<img src="${tenant.logo}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; margin: 0 auto 10px auto; display: block; border: 3px solid #f472b6;" />`
      : `<div style="font-size: 50px; margin-bottom: 10px;">${tenant.logo || '🌸'}</div>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Cartel QR - ${tenant.name}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: #f8fafc;
            color: #0f172a;
            box-sizing: border-box;
          }
          .poster {
            width: 100%;
            max-width: 600px;
            padding: 45px 35px;
            background: #ffffff;
            border: 10px solid #db2777;
            border-radius: 36px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            box-sizing: border-box;
          }
          .store-name {
            font-size: 36px;
            font-weight: 900;
            color: #9d174d;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin: 10px 0 6px 0;
          }
          .store-tagline {
            font-size: 15px;
            color: #475569;
            margin: 0 0 28px 0;
            font-weight: 500;
            line-height: 1.4;
          }
          .qr-container {
            background: #fdf2f8;
            border: 3px dashed #f472b6;
            padding: 24px;
            border-radius: 28px;
            display: inline-block;
            margin-bottom: 24px;
          }
          .qr-container img {
            width: 250px;
            height: 250px;
            display: block;
            margin: 0 auto;
          }
          .qr-text {
            font-size: 17px;
            font-weight: 700;
            color: #1e293b;
            max-width: 480px;
            margin: 0 auto 24px auto;
            line-height: 1.5;
          }
          .footer-info {
            border-top: 2px solid #f1f5f9;
            padding-top: 18px;
            font-size: 13px;
            color: #64748b;
            font-weight: 600;
            line-height: 1.6;
          }
          @media print {
            body { background: white; padding: 0; }
            .poster { border-width: 8px; box-shadow: none; margin: 0 auto; }
          }
        </style>
      </head>
      <body>
        <div class="poster">
          ${logoHtml}
          <h1 class="store-name">${tenant.name}</h1>
          ${tenant.description ? `<p class="store-tagline">${tenant.description}</p>` : ''}
          
          <div class="qr-container">
            <img src="${qrCodeImageUrl}" alt="Código QR ${tenant.name}" />
          </div>

          <p class="qr-text">${customQrText || '¡Escanéa este código QR con la cámara de tu celular para ver nuestro catálogo exclusivo de productos y hacer tu pedido!'}</p>

          <div class="footer-info">
            ${tenant.address ? `📍 Dirección: ${tenant.address}<br/>` : ''}
            ${tenant.phone ? `📱 WhatsApp: ${tenant.phone}<br/>` : ''}
            🌐 Catálogo Online: <strong>${publicTenantUrl}</strong>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Auto-set category when product form opens
  useEffect(() => {
    if (tenant.categories && tenant.categories.length > 0) {
      setProdCategory(tenant.categories[1] || tenant.categories[0] || '');
    }
  }, [tenant.categories]);

  if (!isOpen) return null;

  // Filter tenant-specific collections
  const tenantProducts = products.filter(p => p.tenantId === tenant.id);
  const tenantOrders = orders.filter(o => o.tenantId === tenant.id);
  const tenantCollaborators = collaborators.filter(c => c.tenantId === tenant.id);
  const tenantComments = comments.filter(c => c.tenantId === tenant.id);

  // Notification badge counts
  const pendingOrdersCount = tenantOrders.filter(o => o.status !== 'delivered').length;
  const pendingCommentsCount = tenantComments.filter(c => c.status === 'pending' || (c.isSuggestion && !c.reply)).length;

  // Login REAL contra la nube (molde CyC): valida la licencia en Supabase,
  // crea/reutiliza la cuenta segura del dueño/colaborador e hidrata la tienda.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudLogin) return;
    setLoginError('');
    setIsBusy(true);
    const r = await cloudLogin(authRole, licenseKey, username, password);
    setIsBusy(false);
    if (!r.ok) { setLoginError(r.msg || 'No se pudo ingresar.'); return; }
    if (authRole === 'admin') {
      setIsAuthenticated(true);
      setActiveTab('dashboard');
    } else {
      const found = tenantCollaborators.find(c => c.username.toLowerCase() === username.trim().toLowerCase());
      setActiveCollaborator(found || null);
      setIsAuthenticated(true);
      setActiveTab('products');
    }
    if (rememberBio && bioAvail && registrarBio) {
      try { await registrarBio(username.trim(), authRole); } catch (err) { /* noop */ }
    }
  };

  // Ingreso biométrico real (WebAuthn): reabre con la sesión guardada.
  const handleBiometricLogin = async () => {
    if (!cloudBioLogin) return;
    setLoginError('');
    setIsBiometricScanning(true);
    const r = await cloudBioLogin();
    setIsBiometricScanning(false);
    if (!r.ok) { setLoginError(r.msg || 'No se pudo verificar la biometría.'); return; }
    if (r.role === 'collaborator') {
      setActiveCollaborator(tenantCollaborators[0] || null);
      setIsAuthenticated(true);
      setActiveTab('products');
    } else {
      setIsAuthenticated(true);
      setActiveTab('dashboard');
    }
  };

  // Approve collaborator entry simulation
  const handleAcceptCollaboratorEntry = () => {
    if (collabRequestPending) {
      setActiveCollaborator(collabRequestPending);
      setIsAuthenticated(true);
      setActiveTab('products'); // Collaborators only see Products and Orders
      setCollabRequestPending(null);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout(); // cierra sesión de nube + limpia el recordatorio
    setIsAuthenticated(false);
    setActiveCollaborator(null);
    setLicenseKey('');
    setUsername('');
    setPassword('');
  };

  // Sales Math helpers
  const processedDeliveries = tenantOrders.filter(o => o.status === 'delivered');
  const salesTotal = processedDeliveries.reduce((sum, o) => sum + o.total, 0);

  // Divide sales by ranges (Daily, Weekly, Monthly, Yearly)
  const getSalesSummary = () => {
    const now = new Date();
    const oneDay = 24 * 3600 * 1000;

    const daily = processedDeliveries.filter(o => {
      const d = new Date(o.createdAt);
      return now.getTime() - d.getTime() <= oneDay;
    }).reduce((sum, o) => sum + o.total, 0);

    const weekly = processedDeliveries.filter(o => {
      const d = new Date(o.createdAt);
      return now.getTime() - d.getTime() <= oneDay * 7;
    }).reduce((sum, o) => sum + o.total, 0);

    const monthly = processedDeliveries.filter(o => {
      const d = new Date(o.createdAt);
      return now.getTime() - d.getTime() <= oneDay * 30;
    }).reduce((sum, o) => sum + o.total, 0);

    const yearly = processedDeliveries.filter(o => {
      const d = new Date(o.createdAt);
      return now.getTime() - d.getTime() <= oneDay * 365;
    }).reduce((sum, o) => sum + o.total, 0);

    return { daily, weekly, monthly, yearly };
  };

  const salesSummary = getSalesSummary();

  // Excel / CSV File builder simulation
  const handleExportCSV = () => {
    const now = new Date();
    const oneDay = 24 * 3600 * 1000;

    let filtered = [...processedDeliveries];
    if (exportFilter === 'weekly') {
      filtered = processedDeliveries.filter(o => now.getTime() - new Date(o.createdAt).getTime() <= oneDay * 7);
    } else if (exportFilter === 'monthly') {
      filtered = processedDeliveries.filter(o => now.getTime() - new Date(o.createdAt).getTime() <= oneDay * 30);
    } else if (exportFilter === 'yearly') {
      filtered = processedDeliveries.filter(o => now.getTime() - new Date(o.createdAt).getTime() <= oneDay * 365);
    }

    // CSV structure
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID Pedido,Cliente,Celular,Email,Total,Fecha,Codigo Retiro\n';

    filtered.forEach(o => {
      csvContent += `${o.id},"${o.clientName}","${o.clientPhone}","${o.clientEmail || ''}",${o.total},"${new Date(o.createdAt).toLocaleDateString()}",${o.withdrawalCode}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ventas_${tenant.slug}_${exportFilter}_${now.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Full Database / Tenant Backup Handlers
  const handleExportBackup = () => {
    try {
      const fullBackup = {
        app: 'TiendaBoutique',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        data: {
          tenants: tenants && tenants.length > 0 ? tenants : [tenant],
          products,
          orders,
          collaborators,
          comments,
          adminSettings
        }
      };

      const jsonStr = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `Copia_Seguridad_${tenant.slug}_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupSuccessMsg('¡Copia de seguridad descargada exitosamente en formato JSON!');
      setBackupErrorMsg(null);
      setTimeout(() => setBackupSuccessMsg(null), 5000);
    } catch (err: any) {
      setBackupErrorMsg('Error al generar la copia de seguridad: ' + err.message);
      setBackupSuccessMsg(null);
    }
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('Archivo vacío o ilegible.');
        const parsed = JSON.parse(text);

        const restoredData = parsed.data || parsed;

        if (!restoredData.tenants || !Array.isArray(restoredData.tenants)) {
          throw new Error('El archivo no contiene un formato de datos de tienda válido.');
        }

        if (onRestoreBackup) {
          onRestoreBackup(restoredData);
          setBackupSuccessMsg('¡Copia de seguridad restaurada con éxito! Todos los productos y datos fueron actualizados.');
          setBackupErrorMsg(null);
          setTimeout(() => setBackupSuccessMsg(null), 5000);
        } else {
          if (restoredData.tenants && restoredData.tenants[0]) {
            onUpdateTenant(restoredData.tenants[0]);
          }
          setBackupSuccessMsg('¡Datos de la tienda cargados exitosamente!');
          setBackupErrorMsg(null);
        }
      } catch (err: any) {
        setBackupErrorMsg(`Error al restaurar: ${err.message || 'Formato JSON inválido'}`);
        setBackupSuccessMsg(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Product crud actions
  const handleOpenAddProduct = (typeOverride?: 'calzados' | 'prendas' | 'otros') => {
    setIsEditingProduct(null);
    const targetType = typeOverride || (activeTab === 'prendas' ? 'prendas' : activeTab === 'otros' ? 'otros' : 'calzados');
    setProdType(targetType);
    setProdName('');
    setProdImages(['']);
    setProdAutoSlide(false);
    setProdDesc('');
    setProdPrice(9500);
    setProdCategory(tenant.categories.filter(c => c !== 'Todos')[0] || 'General');
    setProdFields([]);
    setProdSizes([]);
    setCustomSizeInput('');
    setShowAddProductForm(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setIsEditingProduct(p);
    setProdType(p.productType || 'calzados');
    setProdName(p.name);
    setProdImages(p.images.length > 0 ? p.images : ['']);
    setProdAutoSlide(p.autoSlide);
    setProdDesc(p.description);
    setProdPrice(p.price);
    setProdCategory(p.category || tenant.categories.filter(c => c !== 'Todos')[0] || 'General');
    setProdFields(p.customFields || []);
    setProdSizes(p.sizes || []);
    setCustomSizeInput('');
    setShowAddProductForm(true);
  };

  const handleToggleSize = (sizeStr: string) => {
    if (prodSizes.includes(sizeStr)) {
      setProdSizes(prodSizes.filter(s => s !== sizeStr));
    } else {
      setProdSizes([...prodSizes, sizeStr]);
    }
  };

  const handleAddCustomSize = () => {
    const val = customSizeInput.trim().toUpperCase();
    if (!val) return;
    if (!prodSizes.includes(val)) {
      setProdSizes([...prodSizes, val]);
    }
    setCustomSizeInput('');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanImages = prodImages.filter(img => img.trim() !== '');
    if (cleanImages.length === 0) {
      alert('Debe agregar al menos 1 enlace de imagen');
      return;
    }

    const payload = {
      name: prodName.trim(),
      images: cleanImages.slice(0, 5), // strict maximum of 5 images
      autoSlide: prodAutoSlide,
      description: prodDesc.trim(),
      price: Number(prodPrice),
      category: prodCategory || 'General',
      customFields: prodFields,
      productType: prodType,
      sizes: prodSizes
    };

    if (isEditingProduct) {
      onUpdateProduct({
        ...isEditingProduct,
        ...payload
      });
    } else {
      onAddProduct(payload);
    }

    setShowAddProductForm(false);
  };

  const handleAddImageField = () => {
    if (prodImages.length >= 5) return;
    setProdImages([...prodImages, '']);
  };

  const handleRemoveImageField = (idx: number) => {
    const updated = prodImages.filter((_, i) => i !== idx);
    setProdImages(updated.length === 0 ? [''] : updated);
  };

  const handleAddCustomField = () => {
    setProdFields([...prodFields, { label: '', value: '' }]);
  };

  const handleRemoveCustomField = (idx: number) => {
    setProdFields(prodFields.filter((_, i) => i !== idx));
  };

  // Categories mutator
  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (tenant.categories.includes(name)) {
      alert('La categoría ya existe');
      return;
    }
    const updatedCategories = [...tenant.categories, name];
    onUpdateTenant({
      ...tenant,
      categories: updatedCategories
    });
    setNewCatName('');
    setProdCategory(name);
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (catToRemove === 'Todos') return;
    const updatedCategories = tenant.categories.filter(c => c !== catToRemove);
    onUpdateTenant({
      ...tenant,
      categories: updatedCategories
    });
  };

  // Collaborator actions
  const handleOpenAddCollab = () => {
    setIsEditingCollab(null);
    setCollabName('');
    setCollabPhone('');
    setCollabUsername('');
    setCollabPassword('');
    setCollabIsAdmin2(false);
    setCollabAvatar('');
    setShowAddCollabForm(true);
  };

  const handleOpenEditCollab = (c: Collaborator) => {
    setIsEditingCollab(c);
    setCollabName(c.name);
    setCollabPhone(c.phone);
    setCollabUsername(c.username);
    setCollabPassword(c.password || '');
    setCollabIsAdmin2(c.isAdmin2);
    setCollabAvatar(c.avatarUrl || '');
    setShowAddCollabForm(true);
  };

  const handleSaveCollab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabName.trim() || !collabUsername.trim()) return;

    const payload = {
      name: collabName.trim(),
      phone: collabPhone.trim(),
      username: collabUsername.trim(),
      password: collabPassword || '123',
      isAdmin2: collabIsAdmin2,
      avatarUrl: collabAvatar.trim() || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'
    };

    if (isEditingCollab) {
      onUpdateCollaborator({
        ...isEditingCollab,
        ...payload
      });
    } else {
      onAddCollaborator(payload);
    }
    setShowAddCollabForm(false);
  };

  // Cerrar sesión a distancia de un colaborador
  const handleLogoutCollabRemotely = (collab: Collaborator) => {
    onUpdateCollaborator({
      ...collab,
      sessionActive: false
    });
    setBackupSuccessMsg(`Se ha cerrado la sesión a distancia de ${collab.name}. Deberá ingresar sus credenciales para acceder nuevamente.`);
    setBackupErrorMsg(null);
    setTimeout(() => setBackupSuccessMsg(null), 5000);
  };

  const handleReactivateCollabSession = (collab: Collaborator) => {
    onUpdateCollaborator({
      ...collab,
      sessionActive: true,
      lastLoginAt: new Date().toISOString()
    });
    setBackupSuccessMsg(`Se ha reactivado la sesión y el acceso del colaborador ${collab.name}.`);
    setBackupErrorMsg(null);
    setTimeout(() => setBackupSuccessMsg(null), 5000);
  };

  // Sugerencia actions
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingComment || !replyText.trim()) return;

    onUpdateComment({
      ...replyingComment,
      reply: replyText.trim()
    });

    // Simulate sending mail/whatsapp window open
    const targetBody = `Hola ${replyingComment.clientName}, respondiendo a tu sugerencia en ${tenant.name}: "${replyText.trim()}"`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(targetBody)}`;
    window.open(whatsappUrl, '_blank');

    setReplyingComment(null);
    setReplyText('');
  };

  // Public theme change
  const handlePresetSelect = (presetKey: ThemePreset) => {
    const selectedPreset = PRESETS[presetKey];
    onUpdateTenant({
      ...tenant,
      theme: {
        ...tenant.theme,
        preset: presetKey,
        primaryColor: selectedPreset.colors.primary,
        fontFamily: presetKey === 'NewYork' ? 'serif' : presetKey === 'Tokyo' ? 'mono' : 'sans'
      }
    });
  };

  const currentPresetInfo = PRESETS[tenant.theme.preset] || PRESETS.NewYork;

  // Determine dark / medium / light themes for administrator visual
  const adminPanelClasses = {
    light: 'bg-white text-slate-800 border-slate-200',
    medium: 'bg-slate-100 text-slate-900 border-slate-300',
    dark: 'bg-slate-900 text-slate-100 border-slate-800'
  }[adminSettings.adminMode || 'light'];

  const adminTextColor = adminSettings.adminTextColor || '#1e293b';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      {/* Container principal de Admin */}
      <div
        className={`w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-all duration-300 ${adminPanelClasses}`}
        style={{ color: adminTextColor }}
      >
        {/* TOP BAR ADMINISTRATIVA */}
        <div className="p-3.5 bg-slate-950 text-white flex flex-row items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 shrink-0">
            <Shield className="w-5 h-5 text-rose-500 animate-pulse fill-rose-500/15" />
            <div>
              <span className="font-bold text-xs tracking-wider uppercase bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded">
                Panel {authRole === 'admin' ? 'Dueño Inquilino' : 'Colaborador'}
              </span>
              <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                <span>{tenant.name}</span>
                {activeCollaborator && (
                  <span className="text-[10px] text-pink-300 font-normal">({activeCollaborator.name})</span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated && (
              <button
                id="btn-admin-view-store"
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                title="Volver a la tienda sin cerrar sesión"
              >
                <Eye className="w-4 h-4 text-pink-300" />
              </button>
            )}

            {isAuthenticated && (
              <button
                id="btn-admin-logout"
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 bg-red-950/80 hover:bg-red-900 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs text-red-200 transition-colors cursor-pointer"
                title="Cerrar sesión de administrador"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}

            <button
              id="btn-admin-close"
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-700"
              title="Cerrar panel"
            >
              <X className="w-5 h-5" />
              <span className="text-xs font-semibold hidden md:inline">Cerrar</span>
            </button>
          </div>
        </div>

        {/* 1. SECCIÓN DE INGRESO (Autenticación / Licencia) */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800/10 bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto">
            {/* Formulario de credenciales */}
            <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center max-w-lg mx-auto">
              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-black tracking-tight text-slate-900">Validación de Licencia Comercial</h3>
                <p className="text-xs text-slate-500">
                  Para habilitar la tienda, ingrese su licencia comercial única y verifique sus credenciales.
                </p>
              </div>

              {/* Selector de Rol */}
              <div className="flex gap-2 p-1 bg-slate-200 rounded-xl mb-4">
                <button
                  id="btn-role-admin"
                  type="button"
                  onClick={() => setAuthRole('admin')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authRole === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dueño (Inquilino Admin)
                </button>
                <button
                  id="btn-role-collab"
                  type="button"
                  onClick={() => setAuthRole('collaborator')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authRole === 'collaborator' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Colaborador Autorizado
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Licencia de Comercio *</label>
                  <input
                    id="input-lic-key"
                    type="text"
                    required
                    placeholder="Ej: CALF-1234-2026-XXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-rose-500 text-slate-900 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuario</label>
                    <input
                      id="input-auth-username"
                      type="text"
                      required
                      placeholder={authRole === 'admin' ? 'admin' : 'caro.calzados'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full text-sm bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-rose-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña</label>
                    <input
                      id="input-auth-password"
                      type="password"
                      required
                      placeholder="123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-sm bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-rose-500 text-slate-900"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-center font-medium">
                    {loginError}
                  </div>
                )}

                {bioAvail && (
                  <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer select-none">
                    <input type="checkbox" checked={rememberBio} onChange={(e) => setRememberBio(e.target.checked)} className="accent-rose-500" />
                    Recordar con huella/rostro en este equipo
                  </label>
                )}

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider disabled:opacity-60"
                >
                  {isBusy ? 'Ingresando…' : 'Ingresar al Panel'}
                </button>
              </form>
            </div>

            {/* Simulación Biométrica */}
            <div className="flex-1 p-6 sm:p-10 flex flex-col items-center justify-center bg-slate-150 text-slate-800 text-center space-y-6">
              <div className="space-y-1">
                <Fingerprint className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
                <h4 className="font-black text-sm tracking-wide uppercase">Acceso Biométrico</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Ingresá con la huella o Face ID de este dispositivo (tenés que haberlo activado antes con "Recordar" al iniciar sesión).
                </p>
              </div>

              <button
                id="btn-biometric-auth"
                type="button"
                onClick={handleBiometricLogin}
                className="px-6 py-3 bg-white text-slate-900 rounded-2xl hover:bg-slate-100 shadow-md border border-slate-200 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer"
              >
                {isBiometricScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-rose-500 animate-spin" />
                    <span>Escaneando sensor biométrico...</span>
                  </>
                ) : biometricApproved ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>¡Biometría Aceptada!</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 text-rose-500" />
                    <span>Ingresar con Huella / Face ID</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* 2. PANEL ADMINISTRATIVO PRINCIPAL AUTENTICADO */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* COLLABORATOR APPROVAL NOTICE IN PANEL (Simula que el dueño ve solicitudes) */}
            {collabRequestPending && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900 border border-pink-500/40 rounded-2xl p-4 shadow-2xl z-50 flex items-center gap-4 text-white w-[90%] max-w-md animate-slideDown">
                <div className="bg-pink-500/20 p-2 rounded-xl">
                  <UserCheck className="w-5 h-5 text-pink-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-[10px] text-pink-300 font-bold uppercase tracking-wider">Aviso de Ingreso</span>
                  <p className="text-xs font-bold leading-tight">{collabRequestPending.name} solicita acceso</p>
                  <p className="text-[10px] text-slate-400">¿Habilitar sesión temporal de colaborador?</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    id="btn-deny-collab-entry"
                    onClick={() => setCollabRequestPending(null)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-semibold"
                  >
                    Denegar
                  </button>
                  <button
                    id="btn-approve-collab-entry"
                    onClick={handleAcceptCollaboratorEntry}
                    className="px-2.5 py-1 bg-pink-500 hover:bg-pink-600 rounded text-[10px] font-bold text-white shadow-sm"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            )}

            {/* SIDE BAR / PESTAÑAS */}
            <div className="w-full md:w-56 bg-slate-950 border-r border-slate-800 text-slate-400 text-xs py-4 flex md:flex-col gap-1 md:gap-2 px-2 overflow-x-auto md:overflow-y-auto shrink-0 no-scrollbar">
              {/* Solo Admin / Admin 2 ve Dashboard */}
              {(!activeCollaborator || activeCollaborator.isAdmin2) && (
                <button
                  id="tab-dashboard"
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 font-bold transition-all ${
                    activeTab === 'dashboard' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
              )}

              {/* Todos ven Calzados */}
              <button
                id="tab-products"
                onClick={() => setActiveTab('products')}
                className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 font-bold transition-all cursor-pointer ${
                  activeTab === 'products' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Calzados</span>
              </button>

              {/* Todos ven Prendas */}
              <button
                id="tab-prendas"
                onClick={() => setActiveTab('prendas')}
                className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 font-bold transition-all cursor-pointer ${
                  activeTab === 'prendas' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Shirt className="w-4 h-4" />
                <span>Prendas</span>
              </button>

              {/* Todos ven Otros Productos */}
              <button
                id="tab-otros"
                onClick={() => setActiveTab('otros')}
                className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 font-bold transition-all cursor-pointer ${
                  activeTab === 'otros' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Otros Productos</span>
              </button>

              {/* Todos ven Pedidos */}
              <button
                id="tab-orders"
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between gap-2.5 font-bold transition-all ${
                  activeTab === 'orders' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Pedidos / Encargos</span>
                </div>
                {pendingOrdersCount > 0 && (
                  <span
                    id="badge-pending-orders"
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-xs transition-transform transform scale-100 ${
                      activeTab === 'orders' ? 'bg-white text-rose-600' : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              {/* Solo Admin ve Colaboradores */}
              {!activeCollaborator && (
                <button
                  id="tab-collaborators"
                  onClick={() => setActiveTab('collaborators')}
                  className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 font-bold transition-all ${
                    activeTab === 'collaborators' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Colaboradores</span>
                </button>
              )}

              {/* Solo Admin / Admin 2 ve Comentarios */}
              {(!activeCollaborator || activeCollaborator.isAdmin2) && (
                <button
                  id="tab-comments"
                  onClick={() => setActiveTab('comments')}
                  className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between gap-2.5 font-bold transition-all ${
                    activeTab === 'comments' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>Sugerencias/Opinión</span>
                  </div>
                  {pendingCommentsCount > 0 && (
                    <span
                      id="badge-pending-comments"
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-xs transition-transform transform scale-100 ${
                        activeTab === 'comments' ? 'bg-white text-rose-600' : 'bg-amber-500 text-white animate-pulse'
                      }`}
                    >
                      {pendingCommentsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Solo Admin ve Personalizar Tema */}
              {!activeCollaborator && (
                <button
                  id="tab-theme"
                  onClick={() => setActiveTab('theme')}
                  className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 font-bold transition-all ${
                    activeTab === 'theme' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Tema Página Pública</span>
                </button>
              )}

              {/* Música de Página */}
              {(!activeCollaborator || activeCollaborator.isAdmin2) && (
                <button
                  id="tab-music"
                  onClick={() => setActiveTab('music')}
                  className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 font-bold transition-all ${
                    activeTab === 'music' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span>Música de Página</span>
                </button>
              )}

              {/* Solo Admin ve Admin Settings */}
              {!activeCollaborator && (
                <button
                  id="tab-admin-settings"
                  onClick={() => setActiveTab('adminSettings')}
                  className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 font-bold transition-all ${
                    activeTab === 'adminSettings' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Configuración Admin</span>
                </button>
              )}

              {/* Reduced panel collaborator credential settings image switcher */}
              {activeCollaborator && (
                <div className="pt-4 border-t border-slate-800 text-slate-500 px-3 space-y-2 mt-auto">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tu Credencial</span>
                  <div className="flex items-center gap-2">
                    <img
                      src={activeCollaborator.avatarUrl || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <span className="block text-slate-300 font-bold leading-none">{activeCollaborator.name}</span>
                      <button
                        id="btn-collab-change-avatar"
                        onClick={() => {
                          const newUrl = prompt('Ingrese nueva URL de imagen para su credencial:', activeCollaborator.avatarUrl || '');
                          if (newUrl !== null) {
                            onUpdateCollaborator({
                              ...activeCollaborator,
                              avatarUrl: newUrl
                            });
                            setActiveCollaborator({
                              ...activeCollaborator,
                              avatarUrl: newUrl
                            });
                          }
                        }}
                        className="text-[9px] text-pink-400 hover:underline"
                      >
                        Cambiar foto
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TAB CONTENT WRAPPER */}
            <div className="flex-1 p-5 overflow-y-auto no-scrollbar bg-slate-50 text-slate-800">
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Control de Entregas y Reservas</h3>
                      <p className="text-xs text-slate-500">Métricas reales de ventas cobradas y retiradas en tienda.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
                      <select
                        id="select-export-range"
                        value={exportFilter}
                        onChange={(e: any) => setExportFilter(e.target.value)}
                        className="text-xs bg-transparent focus:outline-none border-none py-1 px-2 font-bold text-slate-700"
                      >
                        <option value="all">Todas las Ventas</option>
                        <option value="weekly">Última Semana</option>
                        <option value="monthly">Último Mes</option>
                        <option value="yearly">Último Año</option>
                      </select>
                      <button
                        id="btn-export-listado"
                        onClick={handleExportCSV}
                        className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Bajar Listado</span>
                      </button>
                    </div>
                  </div>

                  {/* Tarjetas de Métricas */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregas Hoy</span>
                      <span className="block text-xl font-black text-slate-900">
                        ${salesSummary.daily.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregas Semana</span>
                      <span className="block text-xl font-black text-rose-600">
                        ${salesSummary.weekly.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregas Mes</span>
                      <span className="block text-xl font-black text-indigo-600">
                        ${salesSummary.monthly.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregas Año</span>
                      <span className="block text-xl font-black text-green-600">
                        ${salesSummary.yearly.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Acciones del Historial de Dashboard */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Listado de Ventas Entregadas</h4>
                        <p className="text-[11px] text-slate-400">Total acumulado en caja: ${salesTotal.toLocaleString('es-AR')}</p>
                      </div>

                      <button
                        id="btn-clear-deliveries"
                        onClick={() => {
                          if (confirm('¿Está seguro de vaciar todo el registro de entregas procesadas?')) {
                            onClearDeliveredOrders();
                          }
                        }}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Vaciar todas las Entregas</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100">
                            <th className="pb-2">ID</th>
                            <th className="pb-2">Cliente</th>
                            <th className="pb-2">Entrega</th>
                            <th className="pb-2">Contacto</th>
                            <th className="pb-2 text-right">Monto</th>
                            <th className="pb-2 text-right">Código</th>
                            <th className="pb-2 text-right">Fecha Cobro</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {processedDeliveries.length > 0 ? (
                            processedDeliveries.map(o => (
                              <tr key={o.id} className="text-slate-700">
                                <td className="py-2.5 font-mono">{o.id}</td>
                                <td className="py-2.5 font-bold">{o.clientName}</td>
                                <td className="py-2.5">
                                  {o.shippingType === 'delivery' ? (
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5" title={o.deliveryAddress}>
                                      <Truck className="w-3 h-3 text-amber-700" />
                                      Envío
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                                      <Store className="w-3 h-3 text-slate-500" />
                                      Retiro
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 text-slate-500">{o.clientPhone}</td>
                                <td className="py-2.5 text-right font-bold text-slate-900">${o.total.toLocaleString('es-AR')}</td>
                                <td className="py-2.5 text-right font-mono text-pink-600 font-bold">{o.withdrawalCode}</td>
                                <td className="py-2.5 text-right text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-6 text-slate-400 italic">No hay entregas procesadas todavía.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CALZADOS */}
              {activeTab === 'products' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Catálogo de Calzados</h3>
                      <p className="text-xs text-slate-500">Gestione los zapatos, zapatillas, botas, sandalias y sus categorías.</p>
                    </div>

                    <button
                      id="btn-admin-add-product"
                      onClick={() => handleOpenAddProduct('calzados')}
                      className="flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wide shadow-md shadow-rose-200 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Calzado</span>
                    </button>
                  </div>

                  {/* FORMULARIO DE AGREGAR / EDITAR PRODUCTO */}
                  {showAddProductForm && (
                    <div className="bg-white p-5 rounded-2xl border-2 border-pink-100 shadow-lg space-y-4 animate-slideDown">
                      <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {isEditingProduct
                          ? `Editar ${prodType === 'prendas' ? 'Prenda' : prodType === 'otros' ? 'Producto' : 'Calzado'}: ${isEditingProduct.name}`
                          : `Ingresar Nuevo/a ${prodType === 'prendas' ? 'Prenda' : prodType === 'otros' ? 'Producto' : 'Calzado'}`}
                      </h4>

                      <form onSubmit={handleSaveProduct} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Izquierda */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Producto / Modelo *</label>
                              <input
                                type="text"
                                required
                                placeholder={prodType === 'prendas' ? "Ej. Vestido Midi Lino Noche" : prodType === 'otros' ? "Ej. Cartera Tote Leather" : "Ej. Sandalias París Glitter"}
                                value={prodName}
                                onChange={(e) => setProdName(e.target.value)}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detalle / Descripción *</label>
                              <textarea
                                required
                                rows={2}
                                placeholder="Detalla la confección, material, corte, terminaciones..."
                                value={prodDesc}
                                onChange={(e) => setProdDesc(e.target.value)}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio ($) *</label>
                                <input
                                  type="number"
                                  required
                                  value={prodPrice}
                                  onChange={(e) => setProdPrice(Number(e.target.value))}
                                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría *</label>
                                <select
                                  value={prodCategory}
                                  onChange={(e) => setProdCategory(e.target.value)}
                                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 font-semibold"
                                >
                                  {tenant.categories.filter(c => c !== 'Todos').map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* AGREGAR / BORRAR CATEGORÍAS (+ / -) */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Administrar Categorías (+ / -)
                              </label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Nueva categoría"
                                  value={newCatName}
                                  onChange={(e) => setNewCatName(e.target.value)}
                                  className="flex-1 text-[11px] bg-white border border-slate-200 rounded p-1"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCategory}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-bold cursor-pointer"
                                  title="Añadir categoría"
                                >
                                  +
                                </button>
                              </div>

                              {tenant.categories.length > 1 && (
                                <div className="flex flex-wrap gap-1 pt-1.5">
                                  {tenant.categories.filter(c => c !== 'Todos').map(cat => (
                                    <span
                                      key={cat}
                                      className="inline-flex items-center gap-1 bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-600"
                                    >
                                      <span>{cat}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCategory(cat)}
                                        className="text-red-500 hover:text-red-700 font-black cursor-pointer"
                                        title="Borrar categoría"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* SELECTOR DE TALLA / TALLES */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-slate-700 uppercase">
                                  Selector de Talla / Talles (Opcional)
                                </label>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {prodSizes.length > 0 ? `${prodSizes.length} seleccionadas` : 'Sin seleccionar'}
                                </span>
                              </div>

                              {/* Chips predefinidos según el tipo de producto */}
                              <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                                  Sugerencias de Talle:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {(prodType === 'prendas'
                                    ? ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única']
                                    : prodType === 'calzados'
                                    ? ['35', '36', '37', '38', '39', '40', '41', '42']
                                    : ['S', 'M', 'L', 'Única', 'Estándar']
                                  ).map((presetSize) => {
                                    const isSelected = prodSizes.includes(presetSize);
                                    return (
                                      <button
                                        key={presetSize}
                                        type="button"
                                        onClick={() => handleToggleSize(presetSize)}
                                        className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                        }`}
                                      >
                                        {presetSize} {isSelected && '✓'}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Input para talle personalizado */}
                              <div className="flex gap-1.5 pt-1">
                                <input
                                  type="text"
                                  placeholder="Otro talle (ej. 44, XL)..."
                                  value={customSizeInput}
                                  onChange={(e) => setCustomSizeInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCustomSize();
                                    }
                                  }}
                                  className="flex-1 text-[11px] bg-white border border-slate-200 rounded p-1 text-slate-900"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCustomSize}
                                  className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer"
                                >
                                  + Añadir
                                </button>
                              </div>

                              {/* Badges de talles seleccionados */}
                              {prodSizes.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200">
                                  {prodSizes.map((sz) => (
                                    <span
                                      key={sz}
                                      className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded"
                                    >
                                      <span>{sz}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSize(sz)}
                                        className="text-rose-500 hover:text-rose-800 font-extrabold cursor-pointer"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}

                              <p className="text-[10px] text-slate-400 italic">
                                * Si no selecciona ninguna talla, la opción de talla no aparecerá en la página pública para este producto.
                              </p>
                            </div>
                          </div>

                          {/* Derecha - Imágenes (hasta 5) y campos adicionales */}
                          <div className="space-y-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2.5">
                              <div className="flex justify-between items-center flex-wrap gap-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase">Fotos del Producto (1 a 5) *</label>
                                <div className="flex items-center gap-1.5">
                                  {/* Botón subir imágenes desde PC / Móvil */}
                                  <label
                                    id="btn-upload-prod-images"
                                    className="cursor-pointer bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Subir desde PC/Móvil</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          const fileList = e.target.files;
                                          for (let i = 0; i < fileList.length; i++) {
                                            const file = fileList[i];
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              const result = event.target?.result as string;
                                              if (result) {
                                                setProdImages(prev => {
                                                  const nonEmpties = prev.filter(img => img.trim() !== '');
                                                  if (nonEmpties.length < 5) {
                                                    return [...nonEmpties, result];
                                                  }
                                                  return prev;
                                                });
                                              }
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                          e.target.value = '';
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={handleAddImageField}
                                    disabled={prodImages.length >= 5}
                                    className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2 py-1 rounded-lg border border-slate-300 disabled:opacity-50 cursor-pointer"
                                  >
                                    + Agregar URL
                                  </button>
                                </div>
                              </div>

                              {/* LISTA Y VISTA PREVIA DE IMÁGENES CARGADAS */}
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-slate-900 no-scrollbar">
                                {prodImages.map((imgUrl, index) => (
                                  <div key={index} className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                                    <span className="text-[10px] text-slate-400 font-bold font-mono w-4 shrink-0">#{index + 1}</span>

                                    {/* Miniatura previa */}
                                    {imgUrl.trim() ? (
                                      <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                                        <img src={imgUrl} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded border border-dashed border-slate-300 flex items-center justify-center shrink-0 text-slate-300 text-[9px] font-bold">
                                        Vacio
                                      </div>
                                    )}

                                    <input
                                      type="text"
                                      required={index === 0}
                                      placeholder="https://... o foto subida desde dispositivo"
                                      value={imgUrl}
                                      onChange={(e) => {
                                        const updated = [...prodImages];
                                        updated[index] = e.target.value;
                                        setProdImages(updated);
                                      }}
                                      className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded p-1 focus:outline-none"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImageField(index)}
                                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer shrink-0"
                                      title="Eliminar foto"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* PASAR IMÁGENES AUTOMÁTICAMENTE (Cajita con tilde) */}
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-slate-950">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    id="checkbox-auto-slide"
                                    checked={prodAutoSlide}
                                    onChange={(e) => setProdAutoSlide(e.target.checked)}
                                    className="w-4 h-4 rounded text-pink-500 border-slate-300 focus:ring-pink-400 cursor-pointer"
                                  />
                                  <label htmlFor="checkbox-auto-slide" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Pasar fotos automáticamente (Carrusel)
                                  </label>
                                </div>
                                <span className="text-[9px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full font-bold">Recomendado</span>
                              </div>
                            </div>

                            {/* FICHA TÉCNICA / CAMPOS ADICIONALES (+ / -) */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Más Campos / Ficha Técnica (+)</label>
                                <button
                                  type="button"
                                  onClick={handleAddCustomField}
                                  className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
                                >
                                  + Añadir Campo
                                </button>
                              </div>

                              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-slate-900 no-scrollbar">
                                {prodFields.map((field, idx) => (
                                  <div key={idx} className="flex gap-1.5 items-center">
                                    <input
                                      type="text"
                                      placeholder="Ej. Material, Origen"
                                      value={field.label}
                                      onChange={(e) => {
                                        const updated = [...prodFields];
                                        updated[idx].label = e.target.value;
                                        setProdFields(updated);
                                      }}
                                      className="w-1/3 text-[11px] bg-white border border-slate-200 rounded p-1"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Ej. Cuero vacuno, Importado"
                                      value={field.value}
                                      onChange={(e) => {
                                        const updated = [...prodFields];
                                        updated[idx].value = e.target.value;
                                        setProdFields(updated);
                                      }}
                                      className="flex-1 text-[11px] bg-white border border-slate-200 rounded p-1"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomField(idx)}
                                      className="text-red-400 hover:text-red-600 cursor-pointer"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowAddProductForm(false)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            id="btn-admin-submit-product"
                            type="submit"
                            className="px-5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                          >
                            {isEditingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* LISTADO DE CALZADOS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tenantProducts.filter(p => !p.productType || p.productType === 'calzados').map(p => (
                      <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex gap-3 relative group">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 relative">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=100'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {p.images.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded">
                              +{p.images.length - 1}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-bold text-rose-500 uppercase">{p.category}</span>
                              {p.sizes && p.sizes.length > 0 && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                  Talles: {p.sizes.join(', ')}
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{p.name}</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{p.description}</p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="font-bold text-xs text-slate-900">${p.price.toLocaleString('es-AR')}</span>

                            <div className="flex gap-1.5">
                              <button
                                id={`btn-edit-prod-${p.id}`}
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-500 transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-prod-${p.id}`}
                                onClick={() => {
                                  if (confirm(`¿Seguro que deseas eliminar ${p.name}?`)) {
                                    onDeleteProduct(p.id);
                                  }
                                }}
                                className="p-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2b: PRENDAS */}
              {activeTab === 'prendas' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Opción con cajita y tilde para visibilidad pública */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-pink-100 text-pink-600 rounded-xl">
                        <Shirt className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Pestaña "Prendas" en la Página Pública</h4>
                        <p className="text-xs text-slate-500">Mantiene visible u oculta la sección de Prendas en el catálogo web público.</p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        id="checkbox-show-prendas-public"
                        checked={tenant.showPrendas !== false}
                        onChange={(e) => onUpdateTenant({ ...tenant, showPrendas: e.target.checked })}
                        className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {tenant.showPrendas !== false ? 'Mostrar en página pública ✓' : 'Oculto en página pública'}
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Catálogo de Prendas & Vestimenta</h3>
                      <p className="text-xs text-slate-500">Gestione ropa, vestidos, blusas, sacos y seleccione sus talles disponibles.</p>
                    </div>

                    <button
                      id="btn-admin-add-prenda"
                      onClick={() => handleOpenAddProduct('prendas')}
                      className="flex items-center justify-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wide shadow-md shadow-pink-200 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Prenda</span>
                    </button>
                  </div>

                  {/* FORMULARIO DE AGREGAR / EDITAR PRENDA */}
                  {showAddProductForm && (
                    <div className="bg-white p-5 rounded-2xl border-2 border-pink-100 shadow-lg space-y-4 animate-slideDown">
                      <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-500" />
                        {isEditingProduct ? `Editar Prenda: ${isEditingProduct.name}` : 'Ingresar Nueva Prenda'}
                      </h4>

                      <form onSubmit={handleSaveProduct} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Izquierda */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre de la Prenda *</label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. Vestido Midi Lino Noche"
                                value={prodName}
                                onChange={(e) => setProdName(e.target.value)}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detalle / Descripción *</label>
                              <textarea
                                required
                                rows={2}
                                placeholder="Detalla la tela, caída, cuello, lavado..."
                                value={prodDesc}
                                onChange={(e) => setProdDesc(e.target.value)}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio ($) *</label>
                                <input
                                  type="number"
                                  required
                                  value={prodPrice}
                                  onChange={(e) => setProdPrice(Number(e.target.value))}
                                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría *</label>
                                <select
                                  value={prodCategory}
                                  onChange={(e) => setProdCategory(e.target.value)}
                                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 font-semibold"
                                >
                                  {tenant.categories.filter(c => c !== 'Todos').map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* AGREGAR / BORRAR CATEGORÍAS (+ / -) */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Administrar Categorías (+ / -)
                              </label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Nueva categoría"
                                  value={newCatName}
                                  onChange={(e) => setNewCatName(e.target.value)}
                                  className="flex-1 text-[11px] bg-white border border-slate-200 rounded p-1"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCategory}
                                  className="bg-pink-600 hover:bg-pink-700 text-white px-2 py-1 rounded text-xs font-bold cursor-pointer"
                                  title="Añadir categoría"
                                >
                                  +
                                </button>
                              </div>

                              {tenant.categories.length > 1 && (
                                <div className="flex flex-wrap gap-1 pt-1.5">
                                  {tenant.categories.filter(c => c !== 'Todos').map(cat => (
                                    <span
                                      key={cat}
                                      className="inline-flex items-center gap-1 bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-600"
                                    >
                                      <span>{cat}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCategory(cat)}
                                        className="text-red-500 hover:text-red-700 font-black cursor-pointer"
                                        title="Borrar categoría"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* SELECTOR DE TALLA DE PRENDAS */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-slate-700 uppercase">
                                  Selector de Talla / Talles (Opcional)
                                </label>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {prodSizes.length > 0 ? `${prodSizes.length} seleccionadas` : 'Sin seleccionar'}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                                  Talles de prendas sugeridos:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'].map((presetSize) => {
                                    const isSelected = prodSizes.includes(presetSize);
                                    return (
                                      <button
                                        key={presetSize}
                                        type="button"
                                        onClick={() => handleToggleSize(presetSize)}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                        }`}
                                      >
                                        {presetSize} {isSelected && '✓'}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Custom size */}
                              <div className="flex gap-1.5 pt-1">
                                <input
                                  type="text"
                                  placeholder="Otro talle de prenda..."
                                  value={customSizeInput}
                                  onChange={(e) => setCustomSizeInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCustomSize();
                                    }
                                  }}
                                  className="flex-1 text-[11px] bg-white border border-slate-200 rounded p-1 text-slate-900"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCustomSize}
                                  className="bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer"
                                >
                                  + Añadir
                                </button>
                              </div>

                              {prodSizes.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200">
                                  {prodSizes.map((sz) => (
                                    <span
                                      key={sz}
                                      className="inline-flex items-center gap-1 bg-pink-50 border border-pink-200 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded"
                                    >
                                      <span>{sz}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSize(sz)}
                                        className="text-pink-500 hover:text-pink-800 font-extrabold cursor-pointer"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}

                              <p className="text-[10px] text-slate-400 italic">
                                * Si no selecciona ninguna talla, la opción de talla no aparecerá en la página pública.
                              </p>
                            </div>
                          </div>

                          {/* Derecha - Imágenes (hasta 5) y campos adicionales */}
                          <div className="space-y-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2.5">
                              <div className="flex justify-between items-center flex-wrap gap-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase">Fotos de la Prenda (1 a 5) *</label>
                                <div className="flex items-center gap-1.5">
                                  <label
                                    id="btn-upload-prenda-images"
                                    className="cursor-pointer bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Subir desde PC/Móvil</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          const fileList = e.target.files;
                                          for (let i = 0; i < fileList.length; i++) {
                                            const file = fileList[i];
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              const result = event.target?.result as string;
                                              if (result) {
                                                setProdImages(prev => {
                                                  const nonEmpties = prev.filter(img => img.trim() !== '');
                                                  if (nonEmpties.length < 5) {
                                                    return [...nonEmpties, result];
                                                  }
                                                  return prev;
                                                });
                                              }
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                          e.target.value = '';
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={handleAddImageField}
                                    disabled={prodImages.length >= 5}
                                    className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2 py-1 rounded-lg border border-slate-300 disabled:opacity-50 cursor-pointer"
                                  >
                                    + Agregar URL
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-slate-900 no-scrollbar">
                                {prodImages.map((imgUrl, index) => (
                                  <div key={index} className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                                    <span className="text-[10px] text-slate-400 font-bold font-mono w-4 shrink-0">#{index + 1}</span>

                                    {imgUrl.trim() ? (
                                      <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                                        <img src={imgUrl} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded border border-dashed border-slate-300 flex items-center justify-center shrink-0 text-slate-300 text-[9px] font-bold">
                                        Vacio
                                      </div>
                                    )}

                                    <input
                                      type="text"
                                      required={index === 0}
                                      placeholder="https://... o foto subida"
                                      value={imgUrl}
                                      onChange={(e) => {
                                        const updated = [...prodImages];
                                        updated[index] = e.target.value;
                                        setProdImages(updated);
                                      }}
                                      className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded p-1 focus:outline-none"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImageField(index)}
                                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer shrink-0"
                                      title="Eliminar foto"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-slate-950">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    id="checkbox-auto-slide-prenda"
                                    checked={prodAutoSlide}
                                    onChange={(e) => setProdAutoSlide(e.target.checked)}
                                    className="w-4 h-4 rounded text-pink-500 border-slate-300 focus:ring-pink-400 cursor-pointer"
                                  />
                                  <label htmlFor="checkbox-auto-slide-prenda" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Pasar fotos automáticamente (Carrusel)
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* CAMPOS ADICIONALES (+ / -) */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Más Campos / Ficha Técnica (+)</label>
                                <button
                                  type="button"
                                  onClick={handleAddCustomField}
                                  className="text-[10px] bg-pink-600 hover:bg-pink-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
                                >
                                  + Añadir Campo
                                </button>
                              </div>

                              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-slate-900 no-scrollbar">
                                {prodFields.map((field, idx) => (
                                  <div key={idx} className="flex gap-1.5 items-center">
                                    <input
                                      type="text"
                                      placeholder="Ej. Tela, Cuidado"
                                      value={field.label}
                                      onChange={(e) => {
                                        const updated = [...prodFields];
                                        updated[idx].label = e.target.value;
                                        setProdFields(updated);
                                      }}
                                      className="w-1/3 text-[11px] bg-white border border-slate-200 rounded p-1"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Ej. 100% Algodón, Lavado a mano"
                                      value={field.value}
                                      onChange={(e) => {
                                        const updated = [...prodFields];
                                        updated[idx].value = e.target.value;
                                        setProdFields(updated);
                                      }}
                                      className="flex-1 text-[11px] bg-white border border-slate-200 rounded p-1"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomField(idx)}
                                      className="text-red-400 hover:text-red-600 cursor-pointer"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowAddProductForm(false)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            id="btn-admin-submit-prenda"
                            type="submit"
                            className="px-5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                          >
                            {isEditingProduct ? 'Actualizar Prenda' : 'Guardar Prenda'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* LISTADO DE PRENDAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tenantProducts.filter(p => p.productType === 'prendas').map(p => (
                      <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex gap-3 relative group">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 relative">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {p.images.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded">
                              +{p.images.length - 1}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-bold text-pink-600 uppercase">{p.category}</span>
                              {p.sizes && p.sizes.length > 0 && (
                                <span className="text-[9px] bg-pink-50 text-pink-700 font-bold px-1.5 py-0.5 rounded">
                                  Talles: {p.sizes.join(', ')}
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{p.name}</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{p.description}</p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="font-bold text-xs text-slate-900">${p.price.toLocaleString('es-AR')}</span>

                            <div className="flex gap-1.5">
                              <button
                                id={`btn-edit-prenda-${p.id}`}
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1 bg-slate-100 hover:bg-pink-50 hover:text-pink-600 rounded text-slate-500 transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-prenda-${p.id}`}
                                onClick={() => {
                                  if (confirm(`¿Seguro que deseas eliminar la prenda ${p.name}?`)) {
                                    onDeleteProduct(p.id);
                                  }
                                }}
                                className="p-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2c: OTROS PRODUCTOS */}
              {activeTab === 'otros' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Opción con cajita y tilde para visibilidad pública */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Pestaña "Otros Productos" en la Página Pública</h4>
                        <p className="text-xs text-slate-500">Mantiene visible u oculta la sección de Otros Productos en el catálogo web público.</p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        id="checkbox-show-otros-public"
                        checked={tenant.showOtros !== false}
                        onChange={(e) => onUpdateTenant({ ...tenant, showOtros: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {tenant.showOtros !== false ? 'Mostrar en página pública ✓' : 'Oculto en página pública'}
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Catálogo de Otros Productos</h3>
                      <p className="text-xs text-slate-500">Gestione carteras, bolsos, accesorios, joyería y variedad de productos.</p>
                    </div>

                    <button
                      id="btn-admin-add-otros"
                      onClick={() => handleOpenAddProduct('otros')}
                      className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wide shadow-md shadow-indigo-200 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Producto</span>
                    </button>
                  </div>

                  {/* FORMULARIO DE AGREGAR / EDITAR OTRO PRODUCTO */}
                  {showAddProductForm && (
                    <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-lg space-y-4 animate-slideDown">
                      <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        {isEditingProduct ? `Editar Producto: ${isEditingProduct.name}` : 'Ingresar Nuevo Producto'}
                      </h4>

                      <form onSubmit={handleSaveProduct} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Izquierda */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Producto *</label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. Cartera Tote Leather Rose"
                                value={prodName}
                                onChange={(e) => setProdName(e.target.value)}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detalle / Descripción *</label>
                              <textarea
                                required
                                rows={2}
                                placeholder="Detalla dimensiones, compartimentos, material..."
                                value={prodDesc}
                                onChange={(e) => setProdDesc(e.target.value)}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio ($) *</label>
                                <input
                                  type="number"
                                  required
                                  value={prodPrice}
                                  onChange={(e) => setProdPrice(Number(e.target.value))}
                                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría *</label>
                                <select
                                  value={prodCategory}
                                  onChange={(e) => setProdCategory(e.target.value)}
                                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-900 font-semibold"
                                >
                                  {tenant.categories.filter(c => c !== 'Todos').map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* AGREGAR / BORRAR CATEGORÍAS (+ / -) */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Administrar Categorías (+ / -)
                              </label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Nueva categoría"
                                  value={newCatName}
                                  onChange={(e) => setNewCatName(e.target.value)}
                                  className="flex-1 text-[11px] bg-white border border-slate-200 rounded p-1"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCategory}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-bold cursor-pointer"
                                  title="Añadir categoría"
                                >
                                  +
                                </button>
                              </div>

                              {tenant.categories.length > 1 && (
                                <div className="flex flex-wrap gap-1 pt-1.5">
                                  {tenant.categories.filter(c => c !== 'Todos').map(cat => (
                                    <span
                                      key={cat}
                                      className="inline-flex items-center gap-1 bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-600"
                                    >
                                      <span>{cat}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCategory(cat)}
                                        className="text-red-500 hover:text-red-700 font-black cursor-pointer"
                                        title="Borrar categoría"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* SELECTOR DE TALLA O TAMAÑO */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-slate-700 uppercase">
                                  Selector de Talla / Medida (Opcional)
                                </label>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {prodSizes.length > 0 ? `${prodSizes.length} seleccionadas` : 'Sin seleccionar'}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                                  Medidas sugeridas:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {['S', 'M', 'L', 'Única', 'Estándar'].map((presetSize) => {
                                    const isSelected = prodSizes.includes(presetSize);
                                    return (
                                      <button
                                        key={presetSize}
                                        type="button"
                                        onClick={() => handleToggleSize(presetSize)}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                        }`}
                                      >
                                        {presetSize} {isSelected && '✓'}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex gap-1.5 pt-1">
                                <input
                                  type="text"
                                  placeholder="Otra medida (ej. Grande, 30cm)..."
                                  value={customSizeInput}
                                  onChange={(e) => setCustomSizeInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCustomSize();
                                    }
                                  }}
                                  className="flex-1 text-[11px] bg-white border border-slate-200 rounded p-1 text-slate-900"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCustomSize}
                                  className="bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer"
                                >
                                  + Añadir
                                </button>
                              </div>

                              {prodSizes.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200">
                                  {prodSizes.map((sz) => (
                                    <span
                                      key={sz}
                                      className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded"
                                    >
                                      <span>{sz}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSize(sz)}
                                        className="text-indigo-500 hover:text-indigo-800 font-extrabold cursor-pointer"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}

                              <p className="text-[10px] text-slate-400 italic">
                                * Si no selecciona ninguna talla, la opción de talla no aparecerá en la página pública.
                              </p>
                            </div>
                          </div>

                          {/* Derecha - Imágenes (hasta 5) y campos adicionales */}
                          <div className="space-y-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2.5">
                              <div className="flex justify-between items-center flex-wrap gap-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase">Fotos del Producto (1 a 5) *</label>
                                <div className="flex items-center gap-1.5">
                                  <label
                                    id="btn-upload-otros-images"
                                    className="cursor-pointer bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Subir desde PC/Móvil</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          const fileList = e.target.files;
                                          for (let i = 0; i < fileList.length; i++) {
                                            const file = fileList[i];
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              const result = event.target?.result as string;
                                              if (result) {
                                                setProdImages(prev => {
                                                  const nonEmpties = prev.filter(img => img.trim() !== '');
                                                  if (nonEmpties.length < 5) {
                                                    return [...nonEmpties, result];
                                                  }
                                                  return prev;
                                                });
                                              }
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                          e.target.value = '';
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={handleAddImageField}
                                    disabled={prodImages.length >= 5}
                                    className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2 py-1 rounded-lg border border-slate-300 disabled:opacity-50 cursor-pointer"
                                  >
                                    + Agregar URL
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-slate-900 no-scrollbar">
                                {prodImages.map((imgUrl, index) => (
                                  <div key={index} className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                                    <span className="text-[10px] text-slate-400 font-bold font-mono w-4 shrink-0">#{index + 1}</span>

                                    {imgUrl.trim() ? (
                                      <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                                        <img src={imgUrl} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded border border-dashed border-slate-300 flex items-center justify-center shrink-0 text-slate-300 text-[9px] font-bold">
                                        Vacio
                                      </div>
                                    )}

                                    <input
                                      type="text"
                                      required={index === 0}
                                      placeholder="https://... o foto subida"
                                      value={imgUrl}
                                      onChange={(e) => {
                                        const updated = [...prodImages];
                                        updated[index] = e.target.value;
                                        setProdImages(updated);
                                      }}
                                      className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded p-1 focus:outline-none"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImageField(index)}
                                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer shrink-0"
                                      title="Eliminar foto"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-slate-950">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    id="checkbox-auto-slide-otros"
                                    checked={prodAutoSlide}
                                    onChange={(e) => setProdAutoSlide(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-500 border-slate-300 focus:ring-indigo-400 cursor-pointer"
                                  />
                                  <label htmlFor="checkbox-auto-slide-otros" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Pasar fotos automáticamente (Carrusel)
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* CAMPOS ADICIONALES (+ / -) */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Más Campos / Ficha Técnica (+)</label>
                                <button
                                  type="button"
                                  onClick={handleAddCustomField}
                                  className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
                                >
                                  + Añadir Campo
                                </button>
                              </div>

                              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-slate-900 no-scrollbar">
                                {prodFields.map((field, idx) => (
                                  <div key={idx} className="flex gap-1.5 items-center">
                                    <input
                                      type="text"
                                      placeholder="Ej. Dimensiones, Cierre"
                                      value={field.label}
                                      onChange={(e) => {
                                        const updated = [...prodFields];
                                        updated[idx].label = e.target.value;
                                        setProdFields(updated);
                                      }}
                                      className="w-1/3 text-[11px] bg-white border border-slate-200 rounded p-1"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Ej. 30 x 20 cm, Cierre metálico"
                                      value={field.value}
                                      onChange={(e) => {
                                        const updated = [...prodFields];
                                        updated[idx].value = e.target.value;
                                        setProdFields(updated);
                                      }}
                                      className="flex-1 text-[11px] bg-white border border-slate-200 rounded p-1"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomField(idx)}
                                      className="text-red-400 hover:text-red-600 cursor-pointer"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowAddProductForm(false)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            id="btn-admin-submit-otros"
                            type="submit"
                            className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                          >
                            {isEditingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* LISTADO DE OTROS PRODUCTOS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tenantProducts.filter(p => p.productType === 'otros').map(p => (
                      <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex gap-3 relative group">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 relative">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {p.images.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded">
                              +{p.images.length - 1}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-bold text-indigo-600 uppercase">{p.category}</span>
                              {p.sizes && p.sizes.length > 0 && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                                  Talles: {p.sizes.join(', ')}
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{p.name}</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{p.description}</p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="font-bold text-xs text-slate-900">${p.price.toLocaleString('es-AR')}</span>

                            <div className="flex gap-1.5">
                              <button
                                id={`btn-edit-otros-${p.id}`}
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-500 transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-otros-${p.id}`}
                                onClick={() => {
                                  if (confirm(`¿Seguro que deseas eliminar ${p.name}?`)) {
                                    onDeleteProduct(p.id);
                                  }
                                }}
                                className="p-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PEDIDOS */}
              {activeTab === 'orders' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Opción en cajita con tilde para envíos a domicilio */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Envíos a Domicilio</h4>
                        <p className="text-xs text-slate-500">
                          Habilita o deshabilita la opción de envío a domicilio en la canastita para los clientes.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        id="checkbox-shipping-enabled"
                        checked={tenant.shippingEnabled !== false}
                        onChange={(e) => onUpdateTenant({ ...tenant, shippingEnabled: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {tenant.shippingEnabled !== false ? 'Habilitar envíos a domicilio ✓' : 'Envíos deshabilitados'}
                      </span>
                    </label>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900">Reservas y Encargos Pendientes</h3>
                    <p className="text-xs text-slate-500">
                      Revise los encargos ingresados por la web pública, acepte los encargos y procese su entrega.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {tenantOrders.filter(o => o.status !== 'delivered').length > 0 ? (
                      tenantOrders.filter(o => o.status !== 'delivered').map(o => (
                        <div key={o.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                                {o.withdrawalCode}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                o.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {o.status === 'pending' ? 'Pendiente' : 'Aceptado'}
                              </span>
                              {o.shippingType === 'delivery' ? (
                                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-amber-700" />
                                  Envío a Domicilio
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Store className="w-3 h-3 text-slate-500" />
                                  Retiro en Local
                                </span>
                              )}
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-slate-800">{o.clientName}</h4>
                              <div className="flex gap-3 text-[11px] text-slate-500">
                                <span className="flex items-center gap-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {tenant.prefix} {o.clientPhone}
                                </span>
                                {o.clientEmail && (
                                  <span className="flex items-center gap-0.5">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    {o.clientEmail}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Dirección de Entrega si aplica */}
                            {o.shippingType === 'delivery' && o.deliveryAddress && (
                              <div className="text-xs font-medium text-slate-800 bg-amber-50/80 p-2 rounded-xl border border-amber-200/80 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span><strong>Dirección de Entrega:</strong> {o.deliveryAddress}</span>
                              </div>
                            )}

                            {/* Resumen de items */}
                            <div className="text-[11px] bg-slate-50 p-2 rounded-xl text-slate-600 inline-block font-medium">
                              Reservado: {o.productIds.map(pi => {
                                const prod = products.find(p => p.id === pi.productId);
                                return `${prod ? prod.name : 'Calzado'} (x${pi.quantity})`;
                              }).join(', ')}
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-end gap-2">
                            <span className="text-sm font-black text-rose-600">${o.total.toLocaleString('es-AR')}</span>

                            <div className="flex gap-1.5">
                              {o.status === 'pending' && (
                                <button
                                  id={`btn-accept-order-${o.id}`}
                                  onClick={() => onUpdateOrder({ ...o, status: 'accepted' })}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                >
                                  Aceptar Encargo
                                </button>
                              )}
                              {o.status === 'accepted' && (
                                <button
                                  id={`btn-deliver-order-${o.id}`}
                                  onClick={() => onUpdateOrder({ ...o, status: 'delivered', createdAt: new Date().toISOString() })}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                >
                                  Entregar / Cobrar
                                </button>
                              )}

                              <button
                                id={`btn-whatsapp-notify-${o.id}`}
                                onClick={() => {
                                  const isDelivery = o.shippingType === 'delivery';
                                  const text = isDelivery
                                    ? `¡Hola ${o.clientName}! Tu encargo con código *${o.withdrawalCode}* en ${tenant.name} ha sido *${o.status === 'pending' ? 'recibido y está siendo preparado' : 'aceptado'}*. Se enviará a domicilio en: ${o.deliveryAddress || 'la dirección registrada'}. Total: $${o.total.toLocaleString('es-AR')}.`
                                    : `¡Hola ${o.clientName}! Tu encargo con código de retiro *${o.withdrawalCode}* en ${tenant.name} ha sido *${o.status === 'pending' ? 'recibido y está siendo preparado' : 'aceptado y está listo para retiro'}*. Te esperamos en ${tenant.address}. Total: $${o.total.toLocaleString('es-AR')}.`;
                                  window.open(`https://api.whatsapp.com/send?phone=${tenant.prefix}${o.clientPhone}&text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors"
                                title="Notificar por WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4 fill-green-600/10" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 italic">
                        No hay reservas activas pendientes de cobro o entrega.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: COLABORADORES */}
              {activeTab === 'collaborators' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Equipo de Ventas (Colaboradores)</h3>
                      <p className="text-xs text-slate-500">Cree y configure accesos para sus vendedores de calzado en tienda física.</p>
                    </div>

                    <button
                      id="btn-admin-add-collab"
                      onClick={handleOpenAddCollab}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nuevo Colaborador</span>
                    </button>
                  </div>

                  {/* FORMULARIO DE CREAR / EDITAR COLABORADOR */}
                  {showAddCollabForm && (
                    <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-lg space-y-4 max-w-xl animate-slideDown">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        {isEditingCollab ? `Editar Colaborador: ${isEditingCollab.name}` : 'Registrar Nuevo Colaborador en Tienda'}
                      </h4>

                      <form onSubmit={handleSaveCollab} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Completo *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Lucía Martínez"
                              value={collabName}
                              onChange={(e) => setCollabName(e.target.value)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Celular / WhatsApp</label>
                            <input
                              type="text"
                              placeholder="Ej. 1134567890"
                              value={collabPhone}
                              onChange={(e) => setCollabPhone(e.target.value)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Avatar / Foto de Credencial</label>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {collabAvatar ? (
                                  <img src={collabAvatar} alt="Avatar preview" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <input
                                type="text"
                                placeholder="https://... o sube una foto"
                                value={collabAvatar}
                                onChange={(e) => setCollabAvatar(e.target.value)}
                                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                              />
                            </div>

                            <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all w-full shadow-xs">
                              <Upload className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Subir Foto Avatar (PC / Móvil)</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      setCollabAvatar(event.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }}
                                className="hidden"
                              />
                            </label>
                            <span className="block text-[10px] text-slate-400 mt-1">Selecciona una imagen de perfil desde tu celular o computadora.</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Usuario de Ingreso *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. lucia.calzados"
                              value={collabUsername}
                              onChange={(e) => setCollabUsername(e.target.value)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contraseña de Acceso *</label>
                            <input
                              type="password"
                              required
                              placeholder="123"
                              value={collabPassword}
                              onChange={(e) => setCollabPassword(e.target.value)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                            />
                          </div>

                          {/* ELEGIR COLABORADOR COMO ADMIN 2 (Cajita con tilde) */}
                          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100/50 flex items-center justify-between text-slate-900">
                            <div>
                              <span className="block text-xs font-bold text-amber-900">¿Asignar como Admin 2?</span>
                              <span className="text-[10px] text-amber-700">Tendrá acceso al Dashboard e informes.</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={collabIsAdmin2}
                              onChange={(e) => setCollabIsAdmin2(e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600 border-amber-300 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowAddCollabForm(false)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            id="btn-save-collab-submit"
                            type="submit"
                            className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
                          >
                            {isEditingCollab ? 'Actualizar Colaborador' : 'Guardar Colaborador'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* LISTADO DE COLABORADORES */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tenantCollaborators.map(c => {
                      const isSessionActive = c.sessionActive !== false;
                      return (
                        <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative flex flex-col justify-between">
                          <div className="flex items-start gap-3">
                            {/* Avatar con indicador de sesión en tiempo real */}
                            <div className="relative shrink-0">
                              <img
                                src={c.avatarUrl || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'}
                                alt={c.name}
                                className="w-12 h-12 rounded-full object-cover border border-slate-100"
                              />
                              <span
                                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                  isSessionActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                                title={isSessionActive ? 'Sesión Activa' : 'Sesión Cerrada'}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="font-bold text-xs text-slate-800 truncate">{c.name}</h4>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    id={`btn-edit-collab-${c.id}`}
                                    onClick={() => handleOpenEditCollab(c)}
                                    className="p-1 hover:bg-indigo-50 text-indigo-600 rounded transition-colors"
                                    title="Editar datos"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    id={`btn-delete-collab-${c.id}`}
                                    onClick={() => {
                                      if (confirm(`¿Seguro que deseas dar de baja a ${c.name}?`)) {
                                        onDeleteCollaborator(c.id);
                                      }
                                    }}
                                    className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors"
                                    title="Eliminar colaborador"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {c.isAdmin2 ? (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                    Admin 2
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                                    Colaborador
                                  </span>
                                )}

                                {isSessionActive ? (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Sesión Activa</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span>Sesión Cerrada</span>
                                  </span>
                                )}
                              </div>

                              <span className="block text-[10px] text-slate-400 mt-1 truncate">Usuario: <strong>{c.username}</strong></span>
                              <span className="block text-[10px] text-slate-400 truncate">Tel: {c.phone}</span>
                            </div>
                          </div>

                          {/* BOTÓN CERRAR SESIÓN A DISTANCIA / REACTIVAR */}
                          <div className="pt-2 border-t border-slate-100">
                            {isSessionActive ? (
                              <button
                                type="button"
                                id={`btn-logout-collab-${c.id}`}
                                onClick={() => handleLogoutCollabRemotely(c)}
                                className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              >
                                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                                <span>Cerrar Sesión a Distancia</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                id={`btn-reactivate-collab-${c.id}`}
                                onClick={() => handleReactivateCollabSession(c)}
                                className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 hover:text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Reactivar Sesión / Permitir Acceso</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: SUGERENCIAS Y COMENTARIOS */}
              {activeTab === 'comments' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Sugerencias, Comentarios y Moderación</h3>
                    <p className="text-xs text-slate-500">
                      Apruebe comentarios para mostrarlos en el catálogo público o responda sugerencias de manera privada.
                    </p>
                  </div>

                  {/* COMENTARIO REPLY FORM POPUP */}
                  {replyingComment && (
                    <div className="bg-white p-4 rounded-2xl border-2 border-rose-100 shadow-md space-y-3 max-w-md">
                      <h4 className="font-bold text-xs text-slate-900">Responder sugerencia a {replyingComment.clientName}</h4>
                      <form onSubmit={handleSendReply} className="space-y-2.5">
                        <textarea
                          required
                          rows={3}
                          placeholder="Escriba su respuesta comercial..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setReplyingComment(null)}
                            className="px-2.5 py-1 bg-slate-100 rounded hover:bg-slate-200"
                          >
                            Cancelar
                          </button>
                          <button
                            id="btn-submit-reply"
                            type="submit"
                            className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white rounded font-bold flex items-center gap-1"
                          >
                            <span>Responder por WhatsApp</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Opiniones de Productos catálogo */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-pink-500" />
                        <span>Opiniones del Catálogo Público</span>
                      </h4>

                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs no-scrollbar">
                        {tenantComments.filter(c => !c.isSuggestion).length > 0 ? (
                          tenantComments.filter(c => !c.isSuggestion).map(comment => (
                            <div key={comment.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 relative">
                              <div className="flex justify-between items-start mb-1.5">
                                <div>
                                  <span className="font-bold block text-slate-800">{comment.clientName}</span>
                                  <span className="text-[10px] text-rose-500 font-semibold uppercase">{comment.productName}</span>
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  comment.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {comment.status === 'approved' ? 'Público' : 'Moderación'}
                                </span>
                              </div>

                              <p className="text-slate-600 text-[11px] leading-relaxed italic mb-2">"{comment.content}"</p>

                              <div className="flex justify-end gap-2 border-t border-slate-100 pt-1.5">
                                {comment.status === 'pending' && (
                                  <button
                                    id={`btn-approve-comment-${comment.id}`}
                                    onClick={() => onUpdateComment({ ...comment, status: 'approved' })}
                                    className="text-[10px] bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2.5 rounded shadow-sm"
                                  >
                                    Aceptar y Publicar
                                  </button>
                                )}
                                <button
                                  id={`btn-delete-comment-${comment.id}`}
                                  onClick={() => onUpdateComment({ ...comment, status: 'pending' })} // reset to moderation
                                  className="text-[10px] text-slate-400 hover:text-slate-600"
                                >
                                  Desactivar
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-6 text-slate-400 italic">No hay comentarios en el catálogo.</p>
                        )}
                      </div>
                    </div>

                    {/* Sugerencias Privadas al Administrador */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Sugerencias Privadas (Buzón)</span>
                      </h4>

                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs no-scrollbar">
                        {tenantComments.filter(c => c.isSuggestion).length > 0 ? (
                          tenantComments.filter(c => c.isSuggestion).map(suggestion => (
                            <div key={suggestion.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100/80">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold block text-slate-800">{suggestion.clientName}</span>
                                <span className="text-[9px] text-slate-400">{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                              </div>

                              <p className="text-slate-600 text-[11px] leading-relaxed mb-2 bg-white p-2 rounded border border-slate-100">
                                {suggestion.content}
                              </p>

                              {suggestion.reply && (
                                <div className="bg-indigo-50 p-2 rounded text-[11px] text-indigo-950 border border-indigo-100 mb-2">
                                  <strong>Respuesta comercial:</strong> {suggestion.reply}
                                </div>
                              )}

                              <div className="flex justify-end pt-1.5 border-t border-slate-100">
                                <button
                                  id={`btn-reply-suggest-${suggestion.id}`}
                                  onClick={() => setReplyingComment(suggestion)}
                                  className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold py-1 px-2.5 rounded flex items-center gap-1"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>Responder / WhatsApp</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-6 text-slate-400 italic">El buzón de sugerencias privadas está vacío.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: TEMA DE PÁGINA PÚBLICA */}
              {activeTab === 'theme' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* SELECTOR DE TIENDAS / INQUILINOS CON BOTONES PILL (ESTILO IMAGEN ADJUNTA) */}
                  {tenants.length > 0 && (
                    <div className="bg-[#0c1322] p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            Gestión de Inquilinos y Tiendas
                          </span>
                          <h3 className="text-base font-black text-white">Selecciona la Tienda para Editar su Página Pública</h3>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          Tienda activa: <strong className="text-pink-400">{tenant.name}</strong>
                        </span>
                      </div>

                      {/* BOTONES TIPO PILL IDÉNTICOS A LA IMAGEN */}
                      <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 no-scrollbar">
                        {tenants.map(t => {
                          const isActive = t.id === tenant.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              id={`btn-admin-theme-pill-${t.id}`}
                              onClick={() => onSelectTenant && onSelectTenant(t)}
                              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                                isActive
                                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 ring-2 ring-pink-300 ring-offset-2 ring-offset-[#0c1322] border border-pink-400 scale-105'
                                  : 'bg-[#182238] hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-500'
                              }`}
                            >
                              <span className="text-sm">{t.logo || '🌸'}</span>
                              <span className="truncate max-w-[160px] tracking-wide" title={t.name}>{t.name}</span>
                              {isActive && <Check className="w-4 h-4 text-white stroke-[3] ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-black text-slate-900">Personalización de la Tienda ({tenant.name})</h3>
                    <p className="text-xs text-slate-500">Configure los textos, colores, tipografías y el estilo visual de la tienda pública de {tenant.name}.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Col 1: Información del Local */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                          <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">Información del Local</h4>
                            <p className="text-[11px] text-slate-500">Datos visibles de la tienda física y contacto.</p>
                          </div>
                        </div>

                        <div className="space-y-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Comercial de la Tienda</label>
                            <input
                              type="text"
                              value={tenant.name}
                              onChange={(e) => onUpdateTenant({ ...tenant, name: e.target.value })}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Eslogan / Copete Cabecera</label>
                            <textarea
                              rows={3}
                              value={tenant.description}
                              onChange={(e) => onUpdateTenant({ ...tenant, description: e.target.value })}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none transition-all resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección Física del Local</label>
                            <input
                              type="text"
                              value={tenant.address}
                              onChange={(e) => onUpdateTenant({ ...tenant, address: e.target.value })}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
                              <span>Enlace Ubicación / Google Maps (GPS)</span>
                              <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. https://maps.google.com/..."
                              value={tenant.locationUrl || ''}
                              onChange={(e) => onUpdateTenant({ ...tenant, locationUrl: e.target.value })}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
                            />
                            <span className="block text-[10px] text-slate-400 mt-1">
                              Los clientes abrirán este enlace al hacer clic en "Ubicación" en la cabecera.
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prefijo</label>
                              <input
                                type="text"
                                value={tenant.prefix}
                                onChange={(e) => onUpdateTenant({ ...tenant, prefix: e.target.value })}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Teléfono Móvil</label>
                              <input
                                type="text"
                                value={tenant.phone}
                                onChange={(e) => onUpdateTenant({ ...tenant, phone: e.target.value })}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Imagen de Cabecera y Logo */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">Logo y Banner Cabecera</h4>
                            <p className="text-[11px] text-slate-500">Imágenes de marca e identidad visual.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* LOGO DE LA TIENDA */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Logo o Icono de la Tienda</label>
                            <input
                              type="text"
                              placeholder="Ej. 🌸 o enlace https://..."
                              value={tenant.logo}
                              onChange={(e) => onUpdateTenant({ ...tenant, logo: e.target.value })}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
                            />
                            
                            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all w-full">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Subir Logo desde PC / Móvil</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const result = event.target?.result as string;
                                      if (result) {
                                        onUpdateTenant({ ...tenant, logo: result });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                    e.target.value = '';
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                            <span className="block text-[10px] text-slate-400">Puedes escribir un emoji o subir la imagen de tu logo.</span>
                          </div>

                          {/* BANNER / CABECERA */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Imagen de Fondo de Cabecera (Banner)</label>
                            <input
                              type="text"
                              value={tenant.banner}
                              onChange={(e) => onUpdateTenant({ ...tenant, banner: e.target.value })}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
                              placeholder="https://... o foto subida"
                            />

                            <label className="cursor-pointer bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all w-full">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Subir Banner desde PC / Móvil</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const result = event.target?.result as string;
                                      if (result) {
                                        onUpdateTenant({ ...tenant, banner: result });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                    e.target.value = '';
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                            <span className="block text-[10px] text-slate-400 leading-snug">
                              Carga la imagen de portada de la tienda desde tu PC o celular.
                            </span>
                          </div>

                          {/* VISTA PREVIA DEL BANNER */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 space-y-1">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Vista Previa Cabecera</span>
                            <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 relative bg-slate-900">
                              <img
                                src={tenant.banner}
                                alt="Header Background Preview"
                                className="w-full h-full object-cover opacity-80"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-2 text-center text-white space-y-1">
                                <div>
                                  <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 mx-auto flex items-center justify-center text-lg overflow-hidden">
                                    {tenant.logo && (tenant.logo.startsWith('http') || tenant.logo.startsWith('data:image')) ? (
                                      <img src={tenant.logo} alt="logo" className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{tenant.logo || '🌸'}</span>
                                    )}
                                  </div>
                                  <span className="font-bold text-xs block mt-1">{tenant.name}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Col 3: Estilos, Combinaciones y Tipografías */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                          <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">Estilo de Página Pública</h4>
                            <p className="text-[11px] text-slate-500">Presets visuales y tipografía.</p>
                          </div>
                        </div>

                        {/* 5 combinaciones de estilos configurados */}
                        <div className="space-y-2 text-slate-900">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Selecciona de 5 Estilos Definidos:</label>

                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs no-scrollbar">
                            {Object.keys(PRESETS).map((key) => {
                              const pKey = key as ThemePreset;
                              const pr = PRESETS[pKey];
                              const isSel = tenant.theme.preset === pKey;
                              return (
                                <button
                                  key={pKey}
                                  type="button"
                                  id={`btn-preset-${pKey}`}
                                  onClick={() => handlePresetSelect(pKey)}
                                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                                    isSel ? 'bg-pink-50 border-pink-500 shadow-xs' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-bold text-slate-800">{pr.name}</span>
                                    {isSel && <Check className="w-3.5 h-3.5 text-pink-600" />}
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-snug">{pr.description}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tamaños y Tipos de letras */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-slate-950">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tamaño de Letras</label>
                              <select
                                value={tenant.theme.fontSize}
                                onChange={(e: any) => onUpdateTenant({
                                  ...tenant,
                                  theme: { ...tenant.theme, fontSize: e.target.value }
                                })}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold focus:bg-white focus:border-rose-500 focus:outline-none"
                              >
                                <option value="sm">Pequeña</option>
                                <option value="base">Mediana (Normal)</option>
                                <option value="lg">Grande</option>
                                <option value="xl">Muy Grande</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estilo Tipografía</label>
                              <select
                                value={tenant.theme.fontFamily}
                                onChange={(e: any) => onUpdateTenant({
                                  ...tenant,
                                  theme: { ...tenant.theme, fontFamily: e.target.value }
                                })}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold focus:bg-white focus:border-rose-500 focus:outline-none"
                              >
                                <option value="sans">San-Serif (Moderna)</option>
                                <option value="serif">Serif (Elegante Clásica)</option>
                                <option value="mono">Monospace (Técnica / Cyber)</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Color Principal Ajustable</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={tenant.theme.primaryColor}
                                onChange={(e) => onUpdateTenant({
                                  ...tenant,
                                  theme: { ...tenant.theme, primaryColor: e.target.value }
                                })}
                                className="w-10 h-8 rounded-lg border border-slate-200 cursor-pointer"
                              />
                              <span className="text-xs font-mono font-bold text-slate-600">{tenant.theme.primaryColor}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN CÓDIGO QR Y DIFUSIÓN DE LA TIENDA */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <div className="inline-flex items-center gap-1.5 bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1">
                          <QrCode className="w-3.5 h-3.5 text-pink-400" />
                          <span>Difusión & Código QR</span>
                        </div>
                        <h4 className="text-lg font-black text-white">Código QR para Clientes e Impresión PDF</h4>
                        <p className="text-xs text-slate-400">
                          Usa este código QR para que tus clientes accedan directamente al catálogo público de <strong className="text-slate-200">{tenant.name}</strong>.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          id="btn-qr-view-modal"
                          onClick={() => setShowQrModal(true)}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-pink-400" />
                          <span>Ver QR Agrandado</span>
                        </button>

                        <button
                          type="button"
                          id="btn-qr-share-link"
                          onClick={handleShareOrCopyLink}
                          className="flex items-center gap-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-pink-400" />}
                          <span>{copiedLink ? '¡Link Copiado!' : 'Compartir / Copiar Link'}</span>
                        </button>

                        <button
                          type="button"
                          id="btn-qr-print-pdf"
                          onClick={handlePrintFlyer}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-pink-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-pink-100" />
                          <span>Imprimir Afiche / PDF</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      {/* Vista Previa QR */}
                      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-center space-y-3 flex flex-col items-center">
                        <div className="bg-white p-3 rounded-2xl shadow-md border-2 border-pink-400/40 relative group">
                          <img
                            src={qrCodeImageUrl}
                            alt={`QR ${tenant.name}`}
                            className="w-40 h-40 object-contain mx-auto"
                          />
                          <button
                            type="button"
                            onClick={() => setShowQrModal(true)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-xs font-bold rounded-2xl transition-opacity cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Agrandar</span>
                          </button>
                        </div>

                        <div className="flex gap-2 justify-center w-full">
                          <button
                            type="button"
                            id="btn-download-qr-img"
                            onClick={handleDownloadQr}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-pink-400" />
                            <span>Descargar QR</span>
                          </button>
                        </div>
                      </div>

                      {/* Texto Personalizado para el Afiche */}
                      <div className="md:col-span-2 space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                            Texto o mensaje que aparecerá debajo del QR en el afiche impreso
                          </label>
                          <textarea
                            rows={3}
                            value={customQrText}
                            onChange={(e) => setCustomQrText(e.target.value)}
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-pink-500 transition-colors"
                            placeholder="Escribe un mensaje para invitar a tus clientes a escanear..."
                          />
                          <span className="block text-[11px] text-slate-400 mt-1">
                            Este texto acompañará al nombre de tu tienda ({tenant.name}), tu logo, dirección y teléfono al momento de generar e imprimir el cartel PDF.
                          </span>
                        </div>

                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
                          <div className="truncate">
                            <span className="font-bold text-slate-200 block text-[11px] uppercase">Enlace público de esta boutique:</span>
                            <span className="font-mono text-pink-300 truncate block">{publicTenantUrl}</span>
                          </div>

                          <a
                            href={publicTenantUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-pink-400 rounded-lg transition-colors shrink-0"
                            title="Abrir página pública en otra pestaña"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MÚSICA DE PÁGINA / BACKGROUND MUSIC */}
              {activeTab === 'music' && (
                <div className="space-y-6 animate-fadeIn text-slate-900">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
                    <div>
                      <div className="inline-flex items-center gap-1.5 bg-pink-100 text-pink-700 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] uppercase mb-1">
                        <Music className="w-3.5 h-3.5" />
                        <span>Música de Ambiente Comercial</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">Música de Fondo para la Página Pública</h3>
                      <p className="text-xs text-slate-500">
                        Configura la canción de YouTube que se reproducirá en segundo plano en el sitio público de <strong className="text-slate-800">{tenant.name}</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="input-toggle-bgmusic"
                          checked={tenant.bgMusicEnabled ?? true}
                          onChange={(e) => onUpdateTenant({ ...tenant, bgMusicEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                        <span className="ml-2 text-xs font-bold text-slate-700 uppercase">
                          {tenant.bgMusicEnabled ?? true ? 'Música Habilitada' : 'Música Deshabilitada'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario de Configuración de Música */}
                    <div className="lg:col-span-2 space-y-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span>Configurar Enlace de YouTube</span>
                        <span className="text-[10px] text-pink-600 bg-pink-50 font-mono px-2 py-0.5 rounded">YouTube Audio Engine</span>
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Enlace o ID del Video de YouTube *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              id="input-bgmusic-url"
                              value={tenant.bgMusicUrl || ''}
                              onChange={(e) => onUpdateTenant({ ...tenant, bgMusicUrl: e.target.value })}
                              placeholder="Ej: https://www.youtube.com/watch?v=Dx5qFacd15s"
                              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-pink-500"
                            />
                            {tenant.bgMusicUrl && (
                              <button
                                type="button"
                                id="btn-clear-bgmusic-url"
                                onClick={() => onUpdateTenant({ ...tenant, bgMusicUrl: '' })}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                              >
                                Limpiar
                              </button>
                            )}
                          </div>
                          <span className="block text-[11px] text-slate-400 mt-1">
                            Acepta cualquier enlace directo de YouTube (watch?v=..., youtu.be/...) o ID de 11 caracteres.
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Título o Nombre de la Canción (Aparece en el parlantito)
                          </label>
                          <input
                            type="text"
                            id="input-bgmusic-title"
                            value={tenant.bgMusicTitle || ''}
                            onChange={(e) => onUpdateTenant({ ...tenant, bgMusicTitle: e.target.value })}
                            placeholder="Ej. Bossa Nova Chill & Boutique"
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-pink-500"
                          />
                        </div>

                        {/* Presets o Canciones Sugeridas con 1-Click */}
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            🎵 Canciones Recomendadas para Boutique y Tiendas (1-Clic)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { title: 'Bossa Nova Chill Store', url: 'https://www.youtube.com/watch?v=Dx5qFacd15s', icon: '🎷', tag: 'Agradable & Relajante' },
                              { title: 'Lofi Beats Fashion Study', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', icon: '☕', tag: 'Moderno & Suave' },
                              { title: 'Piano Instrumental Elegance', url: 'https://www.youtube.com/watch?v=2OEL4P1Rz04', icon: '🎹', tag: 'Lujo & Estilo' },
                              { title: 'Parisian French Lounge', url: 'https://www.youtube.com/watch?v=5qap5aO4i9A', icon: '🍷', tag: 'Chic & Sofisticado' },
                              { title: 'Guitarra Acústica Café', url: 'https://www.youtube.com/watch?v=1ZYbU82GVz4', icon: '🎸', tag: 'Cálido & Calmo' }
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                id={`btn-preset-music-${idx}`}
                                onClick={() => onUpdateTenant({
                                  ...tenant,
                                  bgMusicEnabled: true,
                                  bgMusicUrl: preset.url,
                                  bgMusicTitle: preset.title
                                })}
                                className={`text-left p-2.5 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer ${
                                  tenant.bgMusicUrl === preset.url
                                    ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-400/20'
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                                }`}
                              >
                                <span className="text-xl shrink-0">{preset.icon}</span>
                                <div className="truncate flex-1">
                                  <span className="font-bold text-xs text-slate-900 block truncate">{preset.title}</span>
                                  <span className="text-[10px] text-pink-600 font-medium">{preset.tag}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Previsualización del Parlantito */}
                    <div className="space-y-4">
                      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-pink-400">
                          <Radio className="w-4 h-4 animate-pulse" />
                          <h4 className="font-bold text-xs uppercase tracking-wider">Vista Previa del Parlantito</h4>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          Así se verá el botón flotante parlantito para tus clientes en la esquina de la pantalla pública:
                        </p>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex items-center gap-2.5 p-3 rounded-full bg-slate-900 border border-pink-500/50 shadow-md">
                            <Volume2 className="w-5 h-5 text-pink-400 animate-pulse" />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-white block truncate">
                                {tenant.bgMusicTitle || 'Música de Ambiente'}
                              </span>
                              <span className="text-[9px] text-slate-400 block">Clic para silenciar 🎵</span>
                            </div>
                          </div>

                          <span className="block text-[10px] text-center text-slate-400 italic">
                            Los clientes pueden silenciar o reactivar el volumen libremente en cualquier momento.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: CONFIGURACIÓN PANEL ADMIN */}
              {activeTab === 'adminSettings' && (
                <div className="space-y-6 animate-fadeIn text-slate-950">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Configuración & Copias de Seguridad</h3>
                    <p className="text-xs text-slate-500">Ajuste la comodidad de su espacio administrativo y gestione respaldos de datos.</p>
                  </div>

                  {/* BANNERS DE MENSAJES DE RESPALDO */}
                  {backupSuccessMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-slideDown">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{backupSuccessMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBackupSuccessMsg(null)}
                        className="text-emerald-600 hover:text-emerald-800 font-bold px-2 py-0.5 rounded cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {backupErrorMsg && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-slideDown">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>{backupErrorMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBackupErrorMsg(null)}
                        className="text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 rounded cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CARD 1: COPIA DE SEGURIDAD (RESPALDO Y RESTAURACIÓN) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">Copia de Seguridad (Backup)</h4>
                          <p className="text-[11px] text-slate-500">Exporta o restaura toda la información de la tienda.</p>
                        </div>
                      </div>

                      {/* Exportar Copia de Seguridad */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">1. Descargar Copia de Seguridad</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Genera un archivo ejecutable `.json` con todos tus productos ({products.length}), encargos ({orders.length}), colaboradores y ajustes del catálogo.
                          </p>
                        </div>

                        <button
                          type="button"
                          id="btn-export-backup-json"
                          onClick={handleExportBackup}
                          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-pink-400" />
                          <span>Descargar Copia de Seguridad (.JSON)</span>
                        </button>
                      </div>

                      {/* Importar / Restaurar Copia de Seguridad */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">2. Restaurar desde Copia de Seguridad</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Carga un archivo de copia de seguridad previamente descargado para restaurar el catálogo completo.
                          </p>
                        </div>

                        <label className="w-full py-2.5 px-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-pink-200 transition-all cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>Cargar / Restaurar Archivo Backup</span>
                          <input
                            type="file"
                            id="input-import-backup-json"
                            accept=".json"
                            onChange={handleImportBackupFile}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Restablecer a Valores Demo */}
                      {onResetData && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium">¿Deseas reiniciar al estado inicial de la demo?</span>
                          <button
                            type="button"
                            id="btn-reset-demo-data"
                            onClick={onResetData}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Restablecer Demo</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CARD 2: ESTÉTICA Y PERSONALIZACIÓN DEL PANEL ADMIN */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Estética del Administrador</h4>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Modo Visual del Panel</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['light', 'medium', 'dark'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              id={`btn-admin-mode-${mode}`}
                              onClick={() => onUpdateAdminSettings({ ...adminSettings, adminMode: mode })}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                                adminSettings.adminMode === mode
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {mode === 'light' && 'Claro'}
                              {mode === 'medium' && 'Gris / Medio'}
                              {mode === 'dark' && 'Oscuro'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color de las Letras del Panel</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={adminSettings.adminTextColor}
                            onChange={(e) => onUpdateAdminSettings({ ...adminSettings, adminTextColor: e.target.value })}
                            className="w-10 h-8 rounded border border-slate-200 cursor-pointer"
                          />
                          <span className="text-xs font-mono font-bold text-slate-600">{adminSettings.adminTextColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL DE QR AGRANDADO */}
        {showQrModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white text-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative border border-pink-100 text-center space-y-4">
              <button
                type="button"
                id="btn-close-qr-modal"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 pt-2">
                <div className="w-14 h-14 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto text-2xl overflow-hidden border-2 border-pink-200">
                  {tenant.logo && (tenant.logo.startsWith('http') || tenant.logo.startsWith('data:image')) ? (
                    <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{tenant.logo || '🌸'}</span>
                  )}
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{tenant.name}</h3>
                <p className="text-xs text-gray-500 font-medium">Escanea para acceder al catálogo público</p>
              </div>

              <div className="bg-pink-50 p-4 rounded-2xl border border-pink-200 inline-block shadow-inner">
                <img
                  src={qrCodeImageUrl}
                  alt={`Código QR ${tenant.name}`}
                  className="w-56 h-56 object-contain mx-auto"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handlePrintFlyer}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-pink-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Afiche PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Descargar Imagen QR</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
