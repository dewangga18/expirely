import type {
  QuotaInfo,
  ExpirelyItem,
  Recommendation,
  CreateItemPayload,
  UpdateItemPayload,
  CreateFromPhotoPayload,
} from '../types';

import axios from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data: T;
  message: string;
  status: number;
};

type Meta = { page: number; limit: number; total: number; total_pages: number };

type ItemListData = {
  items: ExpirelyItem[];
  total: number;
};

export type StatsData = {
  total_active: number;
  total_consumed: number;
  total_wasted: number;
  expiring_soon: number;
};

function unwrap<T>(response: { data: ApiEnvelope<T> }): T {
  return response.data.data;
}

export async function listItems(): Promise<{ data: ExpirelyItem[]; meta: Meta }> {
  const result = unwrap(await axios.get<ApiEnvelope<ItemListData>>('/core/v1/items'));
  return {
    data: result.items,
    meta: {
      page: 1,
      limit: result.items.length || 25,
      total: result.total,
      total_pages: 1,
    },
  };
}

export async function getItem(id: string): Promise<ExpirelyItem> {
  return unwrap(await axios.get<ApiEnvelope<ExpirelyItem>>(`/core/v1/items/${id}`));
}

export async function createItem(payload: CreateItemPayload): Promise<ExpirelyItem> {
  return unwrap(await axios.post<ApiEnvelope<ExpirelyItem>>('/core/v1/items', payload));
}

export async function createFromPhoto(payload: CreateFromPhotoPayload): Promise<ExpirelyItem> {
  return unwrap(await axios.post<ApiEnvelope<ExpirelyItem>>('/core/v1/items/photo', payload));
}

export async function updateItem(id: string, payload: UpdateItemPayload): Promise<ExpirelyItem> {
  return unwrap(await axios.patch<ApiEnvelope<ExpirelyItem>>(`/core/v1/items/${id}`, payload));
}

export async function updateStatus(
  id: string,
  status: 'active' | 'consumed' | 'wasted'
): Promise<ExpirelyItem> {
  return unwrap(
    await axios.patch<ApiEnvelope<ExpirelyItem>>(`/core/v1/items/${id}/status`, { status })
  );
}

export async function getRecommendations(
  items: { id: string; nama_produk: string }[]
): Promise<Recommendation[]> {
  const result = unwrap(
    await axios.post<ApiEnvelope<{ recommendations: Recommendation[] }>>('/core/v1/recommend', {
      items,
    })
  );
  return result.recommendations;
}

export async function getQuota(): Promise<QuotaInfo> {
  return unwrap(await axios.get<ApiEnvelope<QuotaInfo>>('/core/v1/quota'));
}

export async function claimRewardQuota(kind: 'recognition' | 'recommendation'): Promise<QuotaInfo> {
  return unwrap(await axios.post<ApiEnvelope<QuotaInfo>>('/core/v1/quota/reward', { kind }));
}

export async function getStats(): Promise<StatsData> {
  return unwrap(await axios.get<ApiEnvelope<StatsData>>('/core/v1/stats'));
}
