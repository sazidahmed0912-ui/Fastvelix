import { create } from 'zustand';
import { api } from '@/utils/api';

export type TopLevelCategory = 'FASHION' | 'CAKES_AND_BAKES';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
  isEmailVerified: boolean;
}

export interface CakeConfiguration {
  size?: string;
  flavour?: string;
  style?: string;
  colour?: string;
  message?: string;
  photoUrl?: string;
  topper?: string;
  decoration?: string;
  deliveryDate?: string;
  deliverySlot?: string;
  additionalNotes?: string;
  customPrice?: number;
}

export interface CartItem {
  _id?: string;
  productId: any;
  sellerId: string;
  title: string;
  thumbnail: string;
  topLevelCategory: TopLevelCategory;
  sku: string;
  size?: string;
  color?: string;
  flavour?: string;
  weight?: string;
  isEggless?: boolean;
  cakeConfiguration?: CakeConfiguration;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
  couponDiscount: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  grandTotal: number;
}

export interface WishlistItem {
  productId: {
    _id: string;
    title: string;
    thumbnail: string;
    salePrice: number;
    basePrice: number;
    discount: number;
    ratings: { average: number; count: number };
    status: string;
    slug: string;
  };
  addedAt: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  deepLink?: string;
  createdAt: string;
}

interface StoreState {
  user: User | null;
  category: TopLevelCategory;
  cart: Cart | null;
  wishlist: WishlistItem[];
  notifications: NotificationItem[];
  unreadNotifications: number;
  isLoadingUser: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setCategory: (category: TopLevelCategory) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Cart Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, sku: string, quantity: number, cakeConfiguration?: CakeConfiguration) => Promise<void>;
  updateCartQty: (sku: string, quantity: number) => Promise<void>;
  removeFromCart: (sku: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Wishlist Actions
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  
  // Notification Actions
  fetchNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  category: 'FASHION', // Default context
  cart: null,
  wishlist: [],
  notifications: [],
  unreadNotifications: 0,
  isLoadingUser: true,

  setUser: (user) => set({ user }),
  
  setCategory: (category) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('fv_category', category);
    }
    set({ category });
  },

  fetchUser: async () => {
    set({ isLoadingUser: true });
    try {
      const data = await api.get<{ success: boolean; user: User }>('/auth/me');
      if (data.success) {
        set({ user: data.user });
        get().fetchCart().catch(() => {});
        get().fetchWishlist().catch(() => {});
        get().fetchNotifications().catch(() => {});
        // Silently update user's geolocation in background (from Fzokart)
        api.put('/users/location', {}).catch(() => {});
      }
    } catch {
      set({ user: null });
    } finally {
      set({ isLoadingUser: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null, cart: null, wishlist: [], notifications: [], unreadNotifications: 0 });
    }
  },

  // ─── Cart ────────────────────────────────────────────────────────────────
  fetchCart: async () => {
    try {
      const data = await api.get<{ success: boolean; cart: Cart }>('/cart');
      if (data.success) set({ cart: data.cart });
    } catch {}
  },

  addToCart: async (productId, sku, quantity, cakeConfiguration) => {
    const data = await api.post<{ success: boolean; cart: Cart }>('/cart/add', {
      productId,
      sku,
      quantity,
      cakeConfiguration,
    });
    if (data.success) set({ cart: data.cart });
  },

  updateCartQty: async (sku, quantity) => {
    const data = await api.put<{ success: boolean; cart: Cart }>(`/cart/item/${sku}`, {
      quantity,
    });
    if (data.success) set({ cart: data.cart });
  },

  removeFromCart: async (sku) => {
    const data = await api.delete<{ success: boolean; cart: Cart }>(`/cart/item/${sku}`);
    if (data.success) set({ cart: data.cart });
  },

  applyCoupon: async (code) => {
    const data = await api.post<{ success: boolean; cart: Cart }>('/cart/coupon', { code });
    if (data.success) set({ cart: data.cart });
  },

  removeCoupon: async () => {
    const data = await api.delete<{ success: boolean; cart: Cart }>('/cart/coupon');
    if (data.success) set({ cart: data.cart });
  },

  clearCart: async () => {
    const data = await api.delete<{ success: boolean }>('/cart');
    if (data.success) set({ cart: null });
  },

  // ─── Wishlist ────────────────────────────────────────────────────────────
  fetchWishlist: async () => {
    try {
      const data = await api.get<{ success: boolean; wishlist: { items: WishlistItem[] } }>('/wishlist');
      if (data.success) set({ wishlist: data.wishlist.items });
    } catch {}
  },

  toggleWishlist: async (productId) => {
    const data = await api.post<{ success: boolean; action: 'added' | 'removed' }>('/wishlist/toggle', {
      productId,
    });
    if (data.success) {
      get().fetchWishlist().catch(() => {});
    }
  },

  // ─── Notifications ───────────────────────────────────────────────────────
  fetchNotifications: async () => {
    try {
      const data = await api.get<{ success: boolean; notifications: NotificationItem[]; unreadCount: number }>('/notifications');
      if (data.success) {
        set({
          notifications: data.notifications,
          unreadNotifications: data.unreadCount,
        });
      }
    } catch {}
  },

  markNotificationsRead: async () => {
    const data = await api.put<{ success: boolean }>('/notifications/read-all');
    if (data.success) {
      set({ unreadNotifications: 0 });
      get().fetchNotifications().catch(() => {});
    }
  },
}));
