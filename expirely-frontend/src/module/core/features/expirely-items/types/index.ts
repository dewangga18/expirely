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
  spoilage_assessment?: SpoilageAssessment;
  estimate_basis?: EstimateBasis;
};

export type EstimateBasis = {
  category: string;
  estimate_days: number;
  source_url: string;
  safety_disclaimer: string;
};

export type StorageLocation =
  | 'room_temperature'
  | 'refrigerator'
  | 'freezer'
  | 'pantry'
  | 'unknown';

export type SpoilageAssessment = {
  risk_level: 'low' | 'moderate' | 'high';
  visual_condition: 'normal' | 'watch' | 'discard' | 'unclear';
  storage_location: StorageLocation;
  recommendation: string;
  safety_disclaimer: string;
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
  storage_location: StorageLocation;
};

export type PhotoBatchResult = {
  items: ExpirelyItem[];
  total: number;
};

export type UsageIdeaItem = {
  id: string;
  nama_produk: string;
};

export type UsageIdea = {
  title: string;
  description: string;
  items: UsageIdeaItem[];
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
