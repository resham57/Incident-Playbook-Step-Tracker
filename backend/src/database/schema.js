export const schema = `
  # Predicate definitions
  name: string @index(term, fulltext) .
  email: string @index(exact) @upsert .
  role: string @index(exact) .
  department: string @index(term) .
  is_active: bool @index(bool) .
  created_at: datetime @index(hour) .
  updated_at: datetime .

  title: string @index(term, fulltext) .
  description: string .
  severity: string @index(exact) .
  tlp: string @index(exact) .
  status: string @index(exact) .
  assigned_to: uid @reverse .
  artifacts: [uid] @reverse .
  files: [string] .
  references: [uid] @reverse .
  related_tickets: [uid] @reverse .
  closed_at: datetime .
  playbook: uid .

  url: string .
  filename: string .
  uploaded_at: datetime .
  file_type: string .
  link: string .

  value: string @index(term, fulltext) .
  artifact_type: string @index(exact) .
  kind: string @index(exact) .
  incident: uid @reverse .
  notes: string .

  incident_types: [string] @index(term) .
  severity_levels: [string] .
  estimated_duration: string .
  steps: [uid] @reverse .

  step_number: int @index(int) .
  action_items: [string] .
  expected_outcome: string .
  estimated_time: string .
  prerequisites: [string] .

  # Type definitions
  type User {
    name
    email
    role
    department
    is_active
    created_at
    updated_at
  }

  type Incident {
    title
    description
    severity
    tlp
    status
    assigned_to
    artifacts
    files
    references
    related_tickets
    created_at
    updated_at
    closed_at
    playbook
  }

  type Artifact {
    value
    artifact_type
    status
    kind
    incident
    created_at
    updated_at
    notes
  }

  type PlaybookTemplate {
    name
    description
    incident_types
    severity_levels
    estimated_duration
    steps
    created_at
    updated_at
    is_active
  }

  type PlaybookStep {
    step_number
    title
    description
    action_items
    expected_outcome
    playbook
    estimated_time
    prerequisites
  }

  type Reference {
    title
    link
    incident
    created_at
  }

  type File {
    filename
    url
    file_type
    uploaded_at
    incident
  }
`;

export default schema;
