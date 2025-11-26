// User types
export type UserRole = 'incident_commander' | 'analyst' | 'technical_lead'

export interface User {
  uid?: string
  name: string
  email: string
  role: UserRole
  department: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  assigned_incidents?: Incident[]
}

// Incident types
export type Severity = 'High' | 'Medium' | 'Low'
export type TLP = 'Red' | 'Amber' | 'Green' | 'White'
export type IncidentStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed'

export interface Reference {
  uid?: string
  title: string
  link: string
  incident?: string
  created_at?: string
}

export interface File {
  uid?: string
  filename: string
  url: string
  file_type?: string
  uploaded_at?: string
  incident?: string
}

export interface Incident {
  uid?: string
  title: string
  description: string
  severity: Severity
  tlp: TLP
  status: IncidentStatus
  assigned_to?: User
  artifacts?: Artifact[]
  files?: string[]
  references?: Reference[]
  related_tickets?: Incident[]
  playbook?: PlaybookTemplate
  created_at?: string
  updated_at?: string
  closed_at?: string
}

// Artifact types
export type ArtifactType = 'ip' | 'domain' | 'hash' | 'url' | 'email'
export type ArtifactStatus = 'malicious' | 'clean' | 'unknown'
export type ArtifactKind = 'asset' | 'ioc'

export interface Artifact {
  uid?: string
  value: string
  artifact_type: ArtifactType
  status: ArtifactStatus
  kind: ArtifactKind
  notes?: string
  incident?: string
  created_at?: string
  updated_at?: string
}

// Playbook types
export interface PlaybookStep {
  uid?: string
  step_number: number
  title: string
  description: string
  action_items?: string[]
  expected_outcome?: string
  estimated_time?: string
  prerequisites?: string[]
}

export interface PlaybookTemplate {
  uid?: string
  name: string
  description: string
  incident_types?: string[]
  severity_levels?: string[]
  estimated_duration?: string
  steps?: PlaybookStep[]
  is_active?: boolean
  flow_diagram_url?: string
  created_at?: string
  updated_at?: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  count?: number
  error?: string
  message?: string
}
