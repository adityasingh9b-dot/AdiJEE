export interface User {
  id: number;
  name: string;
  role: 'admin' | 'student';
  phone: string;
  password?: string;
}

export interface Banner {
  id: number;
  image_url: string;
  title: string;
}

export interface Announcement {
  id: number;
  content: string;
  created_at: string;
}

export interface ContentItem {
  id: number;
  title: string;
  type: 'note' | 'practice_sheet';
  file_url: string;
  student_id: number | null;
  created_at: string;
}

export interface Payment {
  id: number;
  student_id: number;
  student_name?: string;
  amount: number;
  screenshot_url: string;
  status: 'pending' | 'approved';
  created_at: string;
}

export interface LiveClass {
  id: number;
  meeting_id: string;
  is_active: number;
  created_at: string;
}
