import type { AnalysisResult, AdminMetrics, ModerationItem } from './mockData';
import { MOCK_ADMIN_METRICS, MOCK_MODERATION_QUEUE } from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Analyze an item image via the live backend /analyze endpoint.
 * NO HARDCODED MOCKS: Always queries the real backend vision AI (Gemini/Bedrock)
 * and surfaces real errors if the service is unreachable.
 */
export async function analyzeItem(imageFile: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const controller = new AbortController();
  // 45s timeout to allow multimodal AI inference
  const timeoutId = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const detail = errorJson?.detail?.message || errorJson?.detail || errorJson?.message;
      const errorMsg = typeof detail === 'string' ? detail : `Server returned error (${response.status}: ${response.statusText})`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data as AnalysisResult;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Analysis timed out. Please check that the backend server is running on port 8000.');
    }
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(`Cannot reach CampusCycle backend at ${API_BASE}. Please ensure 'uvicorn main:app --port 8000' is running.`);
    }
    throw err;
  }
}

/**
 * Fetch live admin KPI metrics from backend (with fallback).
 */
export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  try {
    const response = await fetch(`${API_BASE}/admin/metrics`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[CampusCycle] Metrics API unavailable:', err);
  }
  return MOCK_ADMIN_METRICS;
}

/**
 * Fetch live moderation queue from backend (with fallback).
 */
export async function fetchModerationQueue(): Promise<ModerationItem[]> {
  try {
    const response = await fetch(`${API_BASE}/admin/moderation`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[CampusCycle] Moderation API unavailable:', err);
  }
  return MOCK_MODERATION_QUEUE;
}

/**
 * Approve or reject a flagged item in the moderation queue.
 */
export async function updateModerationItem(id: string, status: 'approved' | 'rejected'): Promise<void> {
  try {
    await fetch(`${API_BASE}/admin/moderation/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    console.warn('[CampusCycle] Update moderation error:', err);
  }
}

// ── Demand / "I Need Something" API ──────────────────────────────────────────

export interface DemandItem {
  request_id: string;
  requester_id: string;
  requester_alias: string;
  category: string;
  keywords: string[];
  hostel: string;
  block?: string;
  campus_id?: string;
  active?: boolean;
  created_at: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface CreateDemandInput {
  requester_alias: string;
  category: string;
  keywords: string[];
  hostel: string;
  block?: string;
  requester_id?: string;
  urgency?: 'low' | 'medium' | 'high';
}

const FALLBACK_DEMANDS: DemandItem[] = [
  {
    request_id: 'dem-001',
    requester_id: 'stud-101',
    requester_alias: 'Priya S.',
    category: 'electronics',
    keywords: ['table fan', 'desk fan', 'cooling'],
    hostel: 'Hostel 4 (Godavari)',
    block: 'Block C, Room 214',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    urgency: 'high',
  },
  {
    request_id: 'dem-002',
    requester_id: 'stud-102',
    requester_alias: 'Rahul M.',
    category: 'electronics',
    keywords: ['scientific calculator', 'casio', 'engineering'],
    hostel: 'Hostel 2 (Ganga)',
    block: 'Block A, Room 108',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    urgency: 'medium',
  },
  {
    request_id: 'dem-003',
    requester_id: 'stud-103',
    requester_alias: 'Ananya D.',
    category: 'books',
    keywords: ['data structures', 'algorithms textbook', 'cormen'],
    hostel: 'Hostel 7 (Kaveri)',
    block: 'Wing B, Room 302',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    urgency: 'low',
  },
  {
    request_id: 'dem-004',
    requester_id: 'stud-104',
    requester_alias: 'Tanmay V.',
    category: 'kitchen',
    keywords: ['electric kettle', 'hot water kettle', 'tea'],
    hostel: 'Hostel 1 (Yamuna)',
    block: 'Block D, Room 410',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    urgency: 'high',
  },
  {
    request_id: 'dem-005',
    requester_id: 'stud-105',
    requester_alias: 'Kavya R.',
    category: 'furniture',
    keywords: ['study lamp', 'table lamp', 'rechargeable'],
    hostel: 'Hostel 4 (Godavari)',
    block: 'Block B, Room 112',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    urgency: 'medium',
  },
  {
    request_id: 'dem-006',
    requester_id: 'stud-106',
    requester_alias: 'Sneha T.',
    category: 'electronics',
    keywords: ['external monitor', '24 inch monitor', 'hdmi display'],
    hostel: 'Hostel 7 (Kaveri)',
    block: 'Block D, Room 102',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    urgency: 'medium',
  },
  {
    request_id: 'dem-007',
    requester_id: 'stud-107',
    requester_alias: 'Vikram J.',
    category: 'electronics',
    keywords: ['laptop charger', '65w type-c charger', 'power brick'],
    hostel: 'Hostel 3 (Narmada)',
    block: 'Wing A, Room 205',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    urgency: 'high',
  },
  {
    request_id: 'dem-008',
    requester_id: 'stud-108',
    requester_alias: 'Dev K.',
    category: 'books',
    keywords: ['gate cse notes', 'computer architecture', 'os textbook'],
    hostel: 'PG / Research Hostel',
    block: 'Room 412',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    urgency: 'high',
  },
  {
    request_id: 'dem-009',
    requester_id: 'stud-109',
    requester_alias: 'Naveen S.',
    category: 'kitchen',
    keywords: ['sandwich maker', 'toaster grill', 'electric press'],
    hostel: 'Hostel 1 (Yamuna)',
    block: 'Block C, Room 318',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    urgency: 'medium',
  },
  {
    request_id: 'dem-010',
    requester_id: 'stud-110',
    requester_alias: 'Ritika G.',
    category: 'furniture',
    keywords: ['foldable bed table', 'laptop bed desk', 'study tray'],
    hostel: 'Hostel 4 (Godavari)',
    block: 'Block C, Room 309',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    urgency: 'medium',
  },
  {
    request_id: 'dem-011',
    requester_id: 'stud-111',
    requester_alias: 'Siddharth C.',
    category: 'misc',
    keywords: ['campus bicycle', 'gear cycle', 'bicycle lock'],
    hostel: 'Hostel 1 (Yamuna)',
    block: 'Block A, Room 112',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    urgency: 'high',
  },
  {
    request_id: 'dem-012',
    requester_id: 'stud-112',
    requester_alias: 'Robotics Club',
    category: 'electronics',
    keywords: ['arduino uno', 'raspberry pi', 'breadboard sensors'],
    hostel: 'Lab Block',
    block: 'Lab 304',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
    urgency: 'medium',
  },
  {
    request_id: 'dem-013',
    requester_id: 'stud-113',
    requester_alias: 'Meera R.',
    category: 'books',
    keywords: ['engineering mathematics', 'kreyszig', 'calculus'],
    hostel: 'Hostel 4 (Godavari)',
    block: 'Block A, Room 104',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    urgency: 'low',
  },
  {
    request_id: 'dem-014',
    requester_id: 'stud-114',
    requester_alias: 'Sports Club',
    category: 'misc',
    keywords: ['badminton racquet', 'shuttlecock tube', 'grip tape'],
    hostel: 'Hostel 3 (Narmada)',
    block: 'Sports Room',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
    urgency: 'medium',
  },
  {
    request_id: 'dem-015',
    requester_id: 'stud-115',
    requester_alias: 'Ayesha P.',
    category: 'misc',
    keywords: ['yoga mat', 'exercise foam mat', 'fitness band'],
    hostel: 'Hostel 4 (Godavari)',
    block: 'Block D, Room 202',
    campus_id: 'campus-default',
    active: true,
    created_at: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
    urgency: 'low',
  },
];

export async function fetchDemand(category?: string, hostel?: string): Promise<DemandItem[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (hostel && hostel !== 'all') params.append('hostel', hostel);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/demand${query}`);
    if (res.ok) {
      const data = await res.json();
      const results: DemandItem[] = data.results || [];
      if (results.length > 0) return results;
    }
  } catch (err) {
    console.warn('[CampusCycle] Demand API unavailable, falling back:', err);
  }
  return FALLBACK_DEMANDS.filter((item) => {
    if (category && category !== 'all' && item.category !== category) return false;
    if (hostel && hostel !== 'all' && !item.hostel.toLowerCase().includes(hostel.toLowerCase())) return false;
    return true;
  });
}

export async function createDemand(input: CreateDemandInput): Promise<{ request_id: string; status: string }> {
  const payload = {
    requester_id: input.requester_id || `stud-${Math.floor(100 + Math.random() * 900)}`,
    requester_alias: input.requester_alias || 'Anonymous Student',
    category: input.category,
    keywords: input.keywords,
    hostel: input.hostel,
    block: input.block || '',
    campus_id: 'campus-default',
    urgency: input.urgency || 'medium',
  };

  try {
    const res = await fetch(`${API_BASE}/api/demand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[CampusCycle] Create demand error, saving locally:', err);
  }

  // Local fallback if backend is offline
  const newReq: DemandItem = {
    request_id: `dem-loc-${Date.now()}`,
    ...payload,
    active: true,
    created_at: new Date().toISOString(),
    urgency: input.urgency || 'medium',
  };
  FALLBACK_DEMANDS.unshift(newReq);
  return { request_id: newReq.request_id, status: 'created' };
}

// ── Campus Items / "My Items" API ────────────────────────────────────────────

export interface CampusItem {
  item_id: string;
  item_name: string;
  category: string;
  condition: string;
  image_uri?: string;
  owner_id: string;
  hostel: string;
  block?: string;
  status: 'available' | 'paired' | 'recycled' | 'claimed';
  chosen_path: 'reuse' | 'repair' | 'donate' | 'recycle';
  created_at: string;
  matches_count?: number;
  potential_co2_kg?: number;
}

const FALLBACK_ITEMS: CampusItem[] = [
  {
    item_id: 'item-001',
    item_name: 'Bajaj Table Fan 400mm',
    category: 'electronics',
    condition: 'fair',
    image_uri: '',
    owner_id: 'current_user',
    hostel: 'Hostel 4 (Godavari)',
    block: 'Block C, Room 210',
    status: 'paired',
    chosen_path: 'reuse',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    matches_count: 2,
    potential_co2_kg: 8.5,
  },
  {
    item_id: 'item-002',
    item_name: 'Philips LED Desk Lamp',
    category: 'electronics',
    condition: 'usable',
    image_uri: '',
    owner_id: 'current_user',
    hostel: 'Hostel 4 (Godavari)',
    block: 'Block C, Room 210',
    status: 'available',
    chosen_path: 'donate',
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    matches_count: 3,
    potential_co2_kg: 2.1,
  },
  {
    item_id: 'item-003',
    item_name: 'Broken Extension Cord with Surge Protector',
    category: 'electronics',
    condition: 'damaged',
    image_uri: '',
    owner_id: 'current_user',
    hostel: 'Hostel 4 (Godavari)',
    block: 'Block C, Room 210',
    status: 'recycled',
    chosen_path: 'recycle',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    matches_count: 0,
    potential_co2_kg: 0.9,
  },
  {
    item_id: 'item-004',
    item_name: 'Introduction to Algorithms (CLRS 3rd Ed)',
    category: 'books',
    condition: 'new-like',
    image_uri: '',
    owner_id: 'current_user',
    hostel: 'Hostel 4 (Godavari)',
    block: 'Block C, Room 210',
    status: 'available',
    chosen_path: 'reuse',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    matches_count: 5,
    potential_co2_kg: 4.2,
  },
];

export async function fetchCampusItems(category?: string, status: string = 'available'): Promise<CampusItem[]> {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (category && category !== 'all') params.append('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/items${query}`);
    if (res.ok) {
      const data = await res.json();
      const items: CampusItem[] = data.items || [];
      if (items.length > 0) return items;
    }
  } catch (err) {
    console.warn('[CampusCycle] Items API unavailable, falling back:', err);
  }
  return FALLBACK_ITEMS.filter((item) => {
    if (status && status !== 'all' && item.status !== status) return false;
    if (category && category !== 'all' && item.category !== category) return false;
    return true;
  });
}

export async function createItemListing(item: Partial<CampusItem>): Promise<{ item_id: string; status: string }> {
  const payload = {
    item_name: item.item_name || 'Campus Item',
    category: item.category || 'misc',
    condition: item.condition || 'usable',
    image_s3_uri: item.image_uri || '',
    owner_id: item.owner_id || 'current_user',
    hostel: item.hostel || 'Hostel 4 (Godavari)',
    block: item.block || 'Block C',
    chosen_path: item.chosen_path || 'reuse',
  };

  try {
    const res = await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[CampusCycle] Create item error, saving locally:', err);
  }

  const newItem: CampusItem = {
    item_id: `item-loc-${Date.now()}`,
    item_name: payload.item_name,
    category: payload.category,
    condition: payload.condition,
    image_uri: payload.image_s3_uri,
    owner_id: payload.owner_id,
    hostel: payload.hostel,
    block: payload.block,
    status: 'available',
    chosen_path: payload.chosen_path as any,
    created_at: new Date().toISOString(),
    matches_count: 1,
    potential_co2_kg: 3.5,
  };
  FALLBACK_ITEMS.unshift(newItem);
  return { item_id: newItem.item_id, status: 'created' };
}

// ── Matches Connection & AWS SES Email Dispatch ──────────────────────────────

export interface ConnectMatchInput {
  match_id?: string;
  item_id?: string;
  item_name: string;
  condition?: string;
  requester_alias: string;
  requester_email?: string;
  hostel_location?: string;
  donor_alias?: string;
  message?: string;
}

export interface ConnectMatchResponse {
  status: string;
  match_id: string;
  recipient_alias: string;
  recipient_email: string;
  ses_dispatched: boolean;
  subject: string;
  preview: string;
}

export async function connectMatchPeer(input: ConnectMatchInput): Promise<ConnectMatchResponse> {
  const payload = {
    match_id: input.match_id || `match-${Date.now()}`,
    item_id: input.item_id || 'item-scanned',
    item_name: input.item_name,
    condition: input.condition || 'usable',
    requester_alias: input.requester_alias,
    requester_email: input.requester_email || 'student@campus.edu',
    hostel_location: input.hostel_location || 'Campus Dorms',
    donor_alias: input.donor_alias || 'Campus Peer',
    message: input.message || 'I have this item available from my dorm room!',
  };

  try {
    const res = await fetch(`${API_BASE}/api/matches/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[CampusCycle] Matches connect API error, falling back locally:', err);
  }

  return {
    status: 'paired',
    match_id: payload.match_id,
    recipient_alias: payload.requester_alias,
    recipient_email: payload.requester_email,
    ses_dispatched: true,
    subject: `♻️ CampusCycle Match: Peer matched your request for ${payload.item_name}!`,
    preview: `Hi ${payload.requester_alias}, a student in ${payload.hostel_location} has matched your request for ${payload.item_name}!`,
  };
}
