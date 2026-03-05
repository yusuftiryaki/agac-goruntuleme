import type { Timestamp } from 'firebase/firestore';

export type TreeStatus = 'pending' | 'processing' | 'completed';

export type TreeMeasurements = {
  height_m?: number;
  diameter_cm?: number;
  volume_m3?: number;
  fractal_score?: number;
  crown_diameter_m?: number;
  crown_surface_area_m2?: number;
  trunk_lean_deg?: number;
  crown_asymmetry_index?: number;
  crown_density_pts_m3?: number;
  crown_base_height_m?: number;
};

export type Tree = {
  id: string;
  video_url: string;
  model_url?: string;
  ply_url?: string;
  qr_code?: string;
  status: TreeStatus;
  timestamp: Timestamp;
  tags?: string[];
  measurements?: TreeMeasurements;
};
