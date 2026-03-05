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

export type BranchDetail = {
  angle_deg: number;
  azimuth_deg: number;
  length_m: number;
};

export type BranchAnalysis = {
  branch_count: number;
  avg_branch_angle_deg: number;
  min_branch_angle_deg: number;
  max_branch_angle_deg: number;
  branch_angle_std_deg: number;
  avg_branch_length_m: number;
  branch_symmetry_index: number;
  branching_density_per_m: number;
  health_notes: string[];
  quadrant_distribution: {
    N: number;
    E: number;
    S: number;
    W: number;
  };
  branch_details: BranchDetail[];
  polar_diagram_url?: string;
  skeleton_view_url?: string;
};

export type ColorAnalysis = {
  green_fraction: number;
  greenness_index: number;
  stress_ratio: number;
  color_homogeneity: number;
  trunk_leaf_ratio: number;
  health_score: number;
  dominant_color_rgb: number[];
  analyzed_frames: number;
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
  color_analysis?: ColorAnalysis;
  advanced_measurements?: string;
  branch_analysis?: BranchAnalysis;
};
