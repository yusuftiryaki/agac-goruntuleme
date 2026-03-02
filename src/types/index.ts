import type { Timestamp } from 'firebase/firestore';

export type TreeStatus = 'pending' | 'processing' | 'completed';

export type Tree = {
  id: string;
  video_url: string;
  model_url?: string;
  status: TreeStatus;
  timestamp: Timestamp;
  tags?: string[];
};
