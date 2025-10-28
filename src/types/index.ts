export interface User {
  id: number;
  username: string;
  email: string;
  is_manager: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  username: string;
  check_in_time: string;
  check_out_time: string | null;
  tiredness_score: number;
  s3_image_url_check_in: string | null;
  s3_image_url_check_out: string | null;
  latitude: number | null;
  longitude: number | null;
  is_checked_in: boolean;
  created_at: string;
}

export interface AttendanceStats {
  total_records: number;
  average_tiredness: number;
  tiredness_distribution: {
    'low (0-0.3)': number;
    'medium (0.3-0.7)': number;
    'high (0.7-1.0)': number;
  };
  daily_stats: Array<{
    date: string;
    count: number;
    avg_tiredness: number;
  }>;
}

