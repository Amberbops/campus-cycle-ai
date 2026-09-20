// Mock data for CampusCycle AI

export interface AnalysisResult {
  id: string;
  itemName: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'hazardous' | 'unknown';
  recommendation: 'REUSE' | 'REPAIR' | 'RECYCLE' | 'DISPOSE' | 'MANUAL_REVIEW';
  confidence: number; // 0–1
  description: string;
  safetyNote?: string;
  tags: string[];
  matches: MatchItem[];
  imageUrl?: string;
}

export interface MatchItem {
  id: string;
  requestedBy: string;
  location: string;
  avatar: string;
  itemRequested: string;
  urgency: 'low' | 'medium' | 'high';
  postedAt: string;
  compatibilityScore: number; // 0–100
  email?: string;
}

export interface AdminMetrics {
  totalPending: number;
  flaggedHazardous: number;
  matchedToday: number;
  divertedThisWeek: number;
  totalDiverted: number;
  co2Saved: number; // kg
  itemsReused: number;
  itemsRecycled: number;
}

export interface ModerationItem {
  id: string;
  itemName: string;
  flagReason: string;
  submittedBy: string;
  submittedAt: string;
  imageUrl: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
}

// ── Mock Responses ──────────────────────────────────────────────────────────

export const MOCK_FAN_RESULT: AnalysisResult = {
  id: 'scan-001',
  itemName: 'Table Fan (Oscillating)',
  condition: 'fair',
  recommendation: 'REPAIR',
  confidence: 0.82,
  description:
    'The fan appears to be in fair condition with visible dust accumulation. The blade assembly looks intact but electrical functionality cannot be verified from the image alone.',
  safetyNote:
    'Electrical functionality cannot be verified from image. Recommend physical inspection before use.',
  tags: ['Electronics', 'Appliance', 'Fan', 'Repairable'],
  matches: [
    {
      id: 'match-001',
      requestedBy: 'Priya S.',
      location: 'Block C, Room 214',
      avatar: 'PS',
      itemRequested: 'Table fan or standing fan',
      urgency: 'high',
      postedAt: '2 hours ago',
      compatibilityScore: 94,
      email: 'ambersaluja2006@gmail.com',
    },
    {
      id: 'match-002',
      requestedBy: 'Rahul M.',
      location: 'Block A, Room 108',
      avatar: 'RM',
      itemRequested: 'Any working fan',
      urgency: 'medium',
      postedAt: '1 day ago',
      compatibilityScore: 87,
      email: 'rahul.b2@campus.edu',
    },
    {
      id: 'match-003',
      requestedBy: 'Hostel Maintenance',
      location: 'Admin Block',
      avatar: 'HM',
      itemRequested: 'Fans for common room',
      urgency: 'low',
      postedAt: '3 days ago',
      compatibilityScore: 71,
      email: 'hostel.maint@campus.edu',
    },
  ],
};

export const MOCK_CABLE_RESULT: AnalysisResult = {
  id: 'scan-002',
  itemName: 'HDMI Cable',
  condition: 'good',
  recommendation: 'REUSE',
  confidence: 0.95,
  description:
    'HDMI cable in good condition. No visible damage to the cable sheath or connectors. Estimated to be functional.',
  tags: ['Cable', 'Electronics', 'Peripheral'],
  matches: [
    {
      id: 'match-004',
      requestedBy: 'CS Lab (C-301)',
      location: 'Academic Block',
      avatar: 'CS',
      itemRequested: 'HDMI cables for lab setup',
      urgency: 'high',
      postedAt: '5 hours ago',
      compatibilityScore: 99,
    },
  ],
};

export const MOCK_HAZARD_RESULT: AnalysisResult = {
  id: 'scan-003',
  itemName: 'Unknown Chemical Container',
  condition: 'unknown',
  recommendation: 'MANUAL_REVIEW',
  confidence: 0.31,
  description:
    'Container contents cannot be identified from the image. Label is partially obscured. This item requires human review before any action.',
  safetyNote:
    'DO NOT attempt to open or move this container. Flag for authorized disposal team.',
  tags: ['Chemical', 'Hazardous', 'Unknown'],
  matches: [],
};

export const MOCK_CHAIR_RESULT: AnalysisResult = {
  id: 'scan-004',
  itemName: 'Study Chair',
  condition: 'poor',
  recommendation: 'RECYCLE',
  confidence: 0.78,
  description:
    'Chair shows significant wear — torn cushioning and a cracked armrest. Not suitable for direct reuse but materials are recyclable.',
  tags: ['Furniture', 'Chair', 'Recyclable'],
  matches: [],
};

export const ALL_MOCK_RESULTS = [
  MOCK_FAN_RESULT,
  MOCK_CABLE_RESULT,
  MOCK_HAZARD_RESULT,
  MOCK_CHAIR_RESULT,
];

export const MOCK_ADMIN_METRICS: AdminMetrics = {
  totalPending: 23,
  flaggedHazardous: 4,
  matchedToday: 11,
  divertedThisWeek: 67,
  totalDiverted: 1284,
  co2Saved: 342,
  itemsReused: 891,
  itemsRecycled: 393,
};

export const MOCK_MODERATION_QUEUE: ModerationItem[] = [
  {
    id: 'mod-001',
    itemName: 'Unknown Chemical Container',
    flagReason: 'Low confidence (31%) — Possible hazardous material',
    submittedBy: 'Arjun K. (Block D)',
    submittedAt: '10 min ago',
    imageUrl: '',
    confidence: 0.31,
    status: 'pending',
  },
  {
    id: 'mod-002',
    itemName: 'Old Paint Cans',
    flagReason: 'Hazardous material detected',
    submittedBy: 'Maintenance Dept.',
    submittedAt: '45 min ago',
    imageUrl: '',
    confidence: 0.44,
    status: 'pending',
  },
  {
    id: 'mod-003',
    itemName: 'Cracked Monitor',
    flagReason: 'Electronic waste — special handling required',
    submittedBy: 'Sneha P. (Block B)',
    submittedAt: '2 hrs ago',
    imageUrl: '',
    confidence: 0.88,
    status: 'pending',
  },
  {
    id: 'mod-004',
    itemName: 'Car Battery (Old)',
    flagReason: 'Hazardous material — lead-acid battery',
    submittedBy: 'Campus Security',
    submittedAt: '3 hrs ago',
    imageUrl: '',
    confidence: 0.91,
    status: 'approved',
  },
  {
    id: 'mod-005',
    itemName: 'Aerosol Cans',
    flagReason: 'Pressurized container — disposal protocol required',
    submittedBy: 'Lab Assistant',
    submittedAt: '5 hrs ago',
    imageUrl: '',
    confidence: 0.55,
    status: 'rejected',
  },
];

export const IMPACT_TICKER_ITEMS = [
  { label: 'Items Reused', value: '891', icon: '♻️' },
  { label: 'Items Recycled', value: '393', icon: '🔄' },
  { label: 'Matches Made', value: '1,284', icon: '🤝' },
  { label: 'CO₂ Saved', value: '342 kg', icon: '🌱' },
  { label: 'Students Helped', value: '2,041', icon: '🎓' },
  { label: 'Waste Diverted', value: '1,284 items', icon: '🗑️' },
];

export const DIVERSION_CHART_DATA = [
  { week: 'W1', items: 28 },
  { week: 'W2', items: 45 },
  { week: 'W3', items: 39 },
  { week: 'W4', items: 67 },
  { week: 'W5', items: 82 },
  { week: 'W6', items: 91 },
  { week: 'W7', items: 78 },
  { week: 'W8', items: 112 },
];
