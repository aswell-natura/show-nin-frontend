export type Role = 'player' | 'manager' | 'dual'
export type ActiveMode = 'player' | 'manager'
export type CustomerRank = 'A' | 'B' | 'C'
export type CustomerStatus = 'lead' | 'proposing' | 'negotiating' | 'active' | 'dormant'
export type ProjectStatus = 'lead' | 'proposing' | 'negotiating' | 'closed'
export type TaskType = 'individual' | 'team'

export interface SidebarSettings {
  order: string[]
  is_fixed: boolean
}

export interface DashboardLayout {
  card_order: number[]
}

export interface Profile {
  id: string
  email: string
  name: string
  avatar: string
  role: Role
  manager_id: string | null
  sidebar_settings: SidebarSettings
  dashboard_layout: DashboardLayout
}

export interface Customer {
  id: string
  company_code?: string
  name: string
  industry: string[]
  business_number?: string
  rank: CustomerRank
  status?: CustomerStatus
  is_pinned: boolean
  last_accessed_at: string
  created_by: string
  email?: string
  address?: string
  phone?: string
  website?: string
  employee_count?: number
  labels?: string[]
  acquisition_source?: string
  note?: string
  contact_persons?: CustomerContact[]
}

export interface CustomerContact {
  name: string
  department?: string
  email?: string
}

export interface Project {
  id: string
  customer_id: string | null
  name: string
  status: ProjectStatus
  priority: 1 | 2 | 3
  amount: number
  user_id: string
  created_at: string
  updated_at: string
  close_date?: string
  source?: 'recording' | 'manual'
  labels?: string[]
  next_action_date?: string
  next_action?: string
  note?: string
  note_use_for_ai?: boolean
}

export interface ActivityContentJson {
  summary: string
  transcript?: string
  checklist?: { label: string; checked: boolean }[]
}

export interface Activity {
  id: string
  customer_id: string
  project_id: string | null
  user_id: string
  title: string
  type: 'call' | 'email' | 'visit' | 'meeting' | 'note'
  content_json: ActivityContentJson
  audio_url: string | null
  created_at: string
}

export interface Task {
  id: string
  customer_id: string
  project_id?: string | null
  user_id: string
  title: string
  summary?: string
  due_date: string
  is_completed: boolean
  progress_percent?: number
  progress_updated_at?: string
}

export interface Target {
  id: string
  type: TaskType
  user_id: string | null
  manager_id: string
  amount: number
  target_month: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export interface AudioMinute {
  id: string
  title: string
  customer_id: string | null
  project_id: string | null
  user_id: string
  recording_date: string
  start_time: string
  end_time: string
  audio_url: string | null
  summary: string
  transcript: string | null
  checklist: { label: string; checked: boolean }[]
  created_at: string
}

// ダッシュボードカード定義（フロントエンドハードコード）
export interface DashboardCardDef {
  id: number
  label: string
  role_visibility: 'player' | 'manager' | 'both'
  icon: string
  unit: string
  color: string
}

export interface ProjectDocument {
  id: string
  project_id: string
  name: string
  file_size: number
  uploaded_at: string
  uploaded_by: string // Profile ID of the uploader
  file_type: string
  use_for_ai?: boolean
}

export interface ProjectMemo {
  id: string
  project_id: string
  content: string
  created_at: string
  created_by: string
  use_for_ai?: boolean
}

