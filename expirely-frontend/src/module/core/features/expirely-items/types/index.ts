// ----------------------------------------------------------------------
// Expirely Items module — household inventory expiry tracking.
// ----------------------------------------------------------------------

export type ItemStatus = 'active' | 'consumed' | 'wasted';

export type ItemSource = 'ai_photo' | 'manual';

export type ExpirelyItem = {
  id: string;
  nama_produk: string;
  kategori: string | null;
  expiry_date: string;
  is_estimated: boolean;
  status: ItemStatus;
  source: ItemSource;
  created_at: string;
  updated_at: string;
};

export type CreateItemPayload = {
  nama_produk: string;
  kategori?: string | null;
  expiry_date: string;
  is_estimated?: boolean;
};

export type UpdateItemPayload = {
  nama_produk?: string;
  kategori?: string | null;
  expiry_date?: string;
  is_estimated?: boolean;
};

export type CreateFromPhotoPayload = {
  photo_base64: string;
  mime_type: string;
};

export type Recommendation = {
  item_id: string;
  nama_produk: string;
  rekomendasi: string;
};

export type QuotaInfo = {
  date: string;
  recognition_used: number;
  recognition_limit: number;
  recommendation_used: number;
  recommendation_limit: number;
};

// Shelf-life categories for fresh items
export const SHELF_LIFE_CATEGORIES = [
  'buah_segar',
  'sayur_hijau',
  'sayur_umbi',
  'roti_tanpa_pengawet',
  'telur_lepas',
  'daging_segar',
  'daging_beku',
  'ikan_segar',
  'susu_segar_non_uht',
  'keju_segar',
] as const;

export type ShelfLifeCategory = (typeof SHELF_LIFE_CATEGORIES)[number];
