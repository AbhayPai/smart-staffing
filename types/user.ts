export type UserRole =
  | 'admin'
  | 'manager'
  | 'engineer'
  | 'designer'
  | 'analyst'
  | 'hr'
  | 'finance'
  | 'marketing'
  | 'other'

export type UserDepartment =
  | 'Engineering'
  | 'Design'
  | 'Product'
  | 'Marketing'
  | 'Sales'
  | 'Finance'
  | 'Human Resources'
  | 'Operations'
  | 'Legal'
  | 'Other'

export interface UserProfile {
  id: string
  email: string
  first_name: string
  middle_name?: string | null
  last_name: string
  department: UserDepartment
  role: UserRole
  created_at: string
  updated_at: string
}

export interface SignUpFormData {
  email: string
  password: string
  confirm: string
  first_name: string
  middle_name: string
  last_name: string
  department: UserDepartment | ''
  role: UserRole | ''
  agreed: boolean
}

export interface LoginFormData {
  email: string
  password: string
}
