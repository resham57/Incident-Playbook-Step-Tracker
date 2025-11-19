# Dgraph Database Documentation
## Incident Playbook Step Tracker

---

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Type Definitions](#type-definitions)
4. [Relationships & Graph Structure](#relationships--graph-structure)
5. [Manual Schema Creation](#manual-schema-creation)
6. [Data Operations](#data-operations)
7. [Query Examples](#query-examples)
8. [Best Practices](#best-practices)

---

## Overview

This application uses **Dgraph**, a distributed graph database that stores data as a graph with nodes (entities) and edges (relationships). The database is designed to manage security incident response workflows, including incidents, users, artifacts, playbooks, references, and files.

### Key Features:
- **Graph-based relationships** between incidents, users, artifacts, and playbooks
- **Full-text search** on titles, descriptions, and artifact values
- **Reverse edges** for efficient bidirectional queries
- **Type system** for data validation and structure

---

## Database Schema

### Predicates (Attributes)

Predicates define the properties that nodes can have. They are the "edges" in the graph.

#### Common Predicates

| Predicate | Type | Indices | Description |
|-----------|------|---------|-------------|
| `name` | `string` | `term`, `fulltext` | Entity name (users, playbooks) |
| `email` | `string` | `exact`, `@upsert` | User email (unique) |
| `title` | `string` | `term`, `fulltext` | Incident/step title |
| `description` | `string` | - | Detailed description |
| `created_at` | `datetime` | `hour` | Creation timestamp |
| `updated_at` | `datetime` | - | Last update timestamp |
| `is_active` | `bool` | `bool` | Active status flag |

#### User Predicates

```graphql
name: string @index(term, fulltext) .
email: string @index(exact) @upsert .
role: string @index(exact) .
department: string @index(term) .
is_active: bool @index(bool) .
created_at: datetime @index(hour) .
updated_at: datetime .
```

**Stored Data:**
- User profile information
- Security team member details
- Role-based access information

#### Incident Predicates

```graphql
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
created_at: datetime @index(hour) .
updated_at: datetime .
```

**Stored Data:**
- Security incident information
- TLP (Traffic Light Protocol) classification
- Severity levels (High, Medium, Low)
- Status tracking (Open, InProgress, Resolved, Closed)
- File metadata (JSON strings with upload info)

#### Artifact Predicates

```graphql
value: string @index(term, fulltext) .
artifact_type: string @index(exact) .
kind: string @index(exact) .
incident: uid @reverse .
notes: string .
status: string @index(exact) .
created_at: datetime @index(hour) .
updated_at: datetime .
```

**Stored Data:**
- IOCs (Indicators of Compromise): IPs, domains, hashes, URLs, emails
- Asset information
- Artifact status (malicious, clean, unknown)

#### Playbook Predicates

```graphql
name: string @index(term, fulltext) .
description: string .
incident_types: [string] @index(term) .
severity_levels: [string] .
estimated_duration: string .
steps: [uid] @reverse .
is_active: bool @index(bool) .
created_at: datetime @index(hour) .
updated_at: datetime .
```

**Stored Data:**
- Incident response procedures
- Step-by-step playbooks
- Applicable incident types and severities

#### Reference Predicates

```graphql
title: string @index(term, fulltext) .
link: string .
incident: uid @reverse .
created_at: datetime .
```

**Stored Data:**
- External documentation links
- Related tickets/alerts
- MITRE ATT&CK references
- Policy documentation

#### Playbook Step Predicates

```graphql
step_number: int @index(int) .
title: string @index(term, fulltext) .
description: string .
action_items: [string] .
expected_outcome: string .
estimated_time: string .
prerequisites: [string] .
playbook: uid .
```

**Stored Data:**
- Sequential response steps
- Action items and expected outcomes
- Time estimates for each step

---

## Type Definitions

Types define the structure of nodes in the graph.

### User Type

```graphql
type User {
  name
  email
  role
  department
  is_active
  created_at
  updated_at
}
```

**Purpose:** Represents security team members
**Roles:**
- `incident_commander` - Leads incident response
- `analyst` - Investigates and analyzes incidents
- `technical_lead` - Provides technical expertise

### Incident Type

```graphql
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
```

**Purpose:** Core entity representing security incidents
**Severity Levels:** High, Medium, Low
**TLP Levels:** Red, Amber, Green, White
**Status Values:** Open, InProgress, Resolved, Closed

### Artifact Type

```graphql
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
```

**Purpose:** IOCs and assets related to incidents
**Artifact Types:** ip, domain, hash, url, email
**Kinds:** ioc (Indicator of Compromise), asset

### PlaybookTemplate Type

```graphql
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
```

**Purpose:** Standardized incident response procedures

### PlaybookStep Type

```graphql
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
```

**Purpose:** Individual steps within a playbook

### Reference Type

```graphql
type Reference {
  title
  link
  incident
  created_at
}
```

**Purpose:** External references and documentation links

### File Type

```graphql
type File {
  filename
  url
  file_type
  uploaded_at
  incident
}
```

**Purpose:** File metadata (actual files stored on filesystem)

---

## Relationships & Graph Structure

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ assigned_to (reverse)
       │
       ▼
┌─────────────┐      artifacts      ┌─────────────┐
│  Incident   │◄────────────────────│  Artifact   │
└──────┬──────┘                     └─────────────┘
       │
       ├─────► references ────────► Reference
       │
       ├─────► related_tickets ───► Incident (self-reference)
       │
       └─────► playbook ───────────► PlaybookTemplate
                                     │
                                     └─────► steps ────► PlaybookStep
```

### Relationship Types

#### One-to-Many Relationships

1. **User → Incidents**
   - One user can be assigned to many incidents
   - `User.uid ← Incident.assigned_to`
   - Reverse edge: `Incident.assigned_to @reverse`

2. **Incident → Artifacts**
   - One incident can have many artifacts
   - `Incident.uid ← Artifact.incident`
   - Reverse edge: `Incident.artifacts @reverse`

3. **Incident → References**
   - One incident can have many references
   - `Incident.uid ← Reference.incident`
   - Reverse edge: `Incident.references @reverse`

4. **PlaybookTemplate → Steps**
   - One playbook has many steps
   - `PlaybookTemplate.uid ← PlaybookStep.playbook`
   - Reverse edge: `PlaybookTemplate.steps @reverse`

#### Many-to-Many Relationships

1. **Incident → Related Tickets**
   - Incidents can reference other incidents
   - Bidirectional relationship
   - `Incident.related_tickets @reverse`

#### One-to-One Relationships

1. **Incident → Playbook**
   - Each incident can have one playbook assigned
   - `Incident.playbook → PlaybookTemplate.uid`

---

## Manual Schema Creation

### Step 1: Access Dgraph Ratel UI

Open your browser and navigate to:
```
http://localhost:8000
```

### Step 2: Set Schema Endpoint

In Ratel, set the connection to:
```
http://localhost:8080
```

### Step 3: Apply Schema

Go to the **Schema** tab and paste the complete schema:

```graphql
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
```

Click **Apply Schema** button.

---

## Data Operations

### Creating Data (Mutations)

#### 1. Create a User

```graphql
{
  set {
    _:user1 <dgraph.type> "User" .
    _:user1 <name> "Alice Johnson" .
    _:user1 <email> "alice@company.com" .
    _:user1 <role> "incident_commander" .
    _:user1 <department> "Security Operations" .
    _:user1 <is_active> "true"^^<xs:boolean> .
    _:user1 <created_at> "2024-01-15T10:00:00Z"^^<xs:dateTime> .
    _:user1 <updated_at> "2024-01-15T10:00:00Z"^^<xs:dateTime> .
  }
}
```

**JSON Format (Recommended):**

```json
{
  "set": [
    {
      "dgraph.type": "User",
      "name": "Alice Johnson",
      "email": "alice@company.com",
      "role": "incident_commander",
      "department": "Security Operations",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### 2. Create an Incident with Artifacts

```json
{
  "set": [
    {
      "dgraph.type": "Incident",
      "title": "Suspected Ransomware Attack",
      "description": "Files encrypted on server FS-01",
      "severity": "High",
      "tlp": "Red",
      "status": "InProgress",
      "assigned_to": {
        "uid": "0x1"
      },
      "files": [],
      "created_at": "2024-01-15T14:30:00Z",
      "updated_at": "2024-01-15T14:30:00Z",
      "artifacts": [
        {
          "dgraph.type": "Artifact",
          "value": "192.168.1.105",
          "artifact_type": "ip",
          "status": "malicious",
          "kind": "ioc",
          "notes": "C2 server communication detected",
          "created_at": "2024-01-15T14:30:00Z",
          "updated_at": "2024-01-15T14:30:00Z"
        }
      ],
      "references": [
        {
          "dgraph.type": "Reference",
          "title": "Internal Ticket TICKET-2024-001",
          "link": "https://helpdesk.company.com/tickets/2024-001",
          "created_at": "2024-01-15T14:30:00Z"
        }
      ]
    }
  ]
}
```

#### 3. Create a Playbook with Steps

```json
{
  "set": [
    {
      "dgraph.type": "PlaybookTemplate",
      "name": "Ransomware Response",
      "description": "Complete playbook for handling ransomware incidents",
      "incident_types": ["malware", "ransomware", "data_breach"],
      "severity_levels": ["High", "Medium"],
      "estimated_duration": "4-8 hours",
      "is_active": true,
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-10T09:00:00Z",
      "steps": [
        {
          "dgraph.type": "PlaybookStep",
          "step_number": 1,
          "title": "Initial Assessment",
          "description": "Assess scope and impact",
          "action_items": ["Identify affected systems", "Document initial findings"],
          "expected_outcome": "Complete inventory of affected systems",
          "estimated_time": "30 minutes"
        },
        {
          "dgraph.type": "PlaybookStep",
          "step_number": 2,
          "title": "Containment",
          "description": "Isolate affected systems",
          "action_items": ["Disconnect network", "Disable user accounts"],
          "expected_outcome": "Systems isolated from network",
          "estimated_time": "1 hour"
        }
      ]
    }
  ]
}
```

#### 4. Update Data

```json
{
  "set": [
    {
      "uid": "0x2",
      "status": "Resolved",
      "closed_at": "2024-01-16T10:00:00Z",
      "updated_at": "2024-01-16T10:00:00Z"
    }
  ]
}
```

#### 5. Link Related Tickets

```json
{
  "set": [
    {
      "uid": "0x2",
      "related_tickets": [
        {
          "uid": "0x5"
        }
      ]
    }
  ]
}
```

#### 6. Delete Data

```json
{
  "delete": [
    {
      "uid": "0x3"
    }
  ]
}
```

---

## Query Examples

### Basic Queries

#### 1. Get All Users

```graphql
{
  users(func: type(User)) {
    uid
    name
    email
    role
    department
    is_active
    created_at
  }
}
```

#### 2. Get All Incidents

```graphql
{
  incidents(func: type(Incident), orderdesc: created_at) {
    uid
    title
    description
    severity
    tlp
    status
    created_at
    assigned_to {
      uid
      name
      email
      role
    }
  }
}
```

#### 3. Get Single Incident with All Relations

```graphql
{
  incident(func: uid(0x2)) @filter(type(Incident)) {
    uid
    title
    description
    severity
    tlp
    status
    files
    created_at
    updated_at
    closed_at
    assigned_to {
      uid
      name
      email
      role
      department
    }
    artifacts {
      uid
      value
      artifact_type
      status
      kind
      notes
      created_at
    }
    references {
      uid
      title
      link
      created_at
    }
    related_tickets {
      uid
      title
      status
      severity
      created_at
    }
    playbook {
      uid
      name
      description
      incident_types
      estimated_duration
      steps {
        uid
        step_number
        title
        description
        estimated_time
      }
    }
  }
}
```

### Advanced Queries

#### 4. Search Incidents by Title

```graphql
{
  incidents(func: allofterms(title, "ransomware")) {
    uid
    title
    severity
    status
    created_at
  }
}
```

#### 5. Filter by Severity

```graphql
{
  incidents(func: eq(severity, "High")) {
    uid
    title
    severity
    status
    assigned_to {
      name
    }
  }
}
```

#### 6. Get User's Assigned Incidents

```graphql
{
  user(func: uid(0x1)) {
    name
    email
    ~assigned_to {
      uid
      title
      severity
      status
      created_at
    }
  }
}
```

**Note:** `~assigned_to` is a reverse edge lookup.

#### 7. Find Malicious Artifacts

```graphql
{
  artifacts(func: eq(status, "malicious")) {
    uid
    value
    artifact_type
    kind
    incident {
      uid
      title
      severity
    }
  }
}
```

#### 8. Get Active Playbooks

```graphql
{
  playbooks(func: eq(is_active, true)) @filter(type(PlaybookTemplate)) {
    uid
    name
    description
    incident_types
    severity_levels
    estimated_duration
    steps {
      step_number
      title
      estimated_time
    }
  }
}
```

#### 9. Complex Filter: Open High-Severity Incidents

```graphql
{
  incidents(func: type(Incident))
    @filter(eq(status, "Open") AND eq(severity, "High")) {
    uid
    title
    description
    created_at
    assigned_to {
      name
      email
    }
    artifacts {
      value
      artifact_type
      status
    }
  }
}
```

#### 10. Aggregate Queries

```graphql
{
  # Count incidents by status
  open: var(func: type(Incident)) @filter(eq(status, "Open")) {
    count(uid)
  }

  inProgress: var(func: type(Incident)) @filter(eq(status, "InProgress")) {
    count(uid)
  }

  resolved: var(func: type(Incident)) @filter(eq(status, "Resolved")) {
    count(uid)
  }

  stats() {
    openCount: sum(val(open))
    inProgressCount: sum(val(inProgress))
    resolvedCount: sum(val(resolved))
  }
}
```

---

## Best Practices

### 1. Schema Design

- **Use types** for all entities to ensure data consistency
- **Add indices** on frequently queried predicates
- **Use reverse edges** (`@reverse`) for bidirectional relationships
- **Use `@upsert`** on unique fields like email

### 2. Data Modeling

- **Store files as metadata strings** (JSON) rather than binary data
- **Use uid references** for relationships, not string references
- **Keep denormalization minimal** - leverage graph traversal instead
- **Use datetime types** for timestamps, not strings

### 3. Querying

- **Filter by type** first: `func: type(Incident)`
- **Use specific indices**:
  - `eq()` for exact matches
  - `allofterms()` for full-text search
  - `ge()`, `le()` for range queries
- **Limit results** with `first: N` for pagination
- **Use variables** for complex aggregations

### 4. Performance

- **Batch mutations** when inserting multiple entities
- **Use transactions** for related data operations
- **Index commonly filtered predicates**
- **Avoid deep nesting** in queries (limit to 3-4 levels)

### 5. Security

- **Validate TLP levels** before sharing data
- **Use role-based access** in application layer
- **Audit critical operations** (create, delete incidents)
- **Backup regularly** using Dgraph export

---

## Common Operations via HTTP API

### Creating Data via cURL

```bash
curl -X POST http://localhost:8080/mutate?commitNow=true \
  -H "Content-Type: application/json" \
  -d '{
    "set": [
      {
        "dgraph.type": "User",
        "name": "Bob Smith",
        "email": "bob@company.com",
        "role": "analyst",
        "is_active": true
      }
    ]
  }'
```

### Querying via cURL

```bash
curl -X POST http://localhost:8080/query \
  -H "Content-Type: application/graphql+-" \
  -d '{
    users(func: type(User)) {
      uid
      name
      email
    }
  }'
```

---

## Troubleshooting

### Issue: Schema not applying
**Solution:** Check for syntax errors, ensure server is running on port 8080

### Issue: Query returns no results
**Solution:**
- Verify data exists with type: `func: type(TypeName)`
- Check if indices are applied for search predicates
- Ensure UIDs are correct in filter queries

### Issue: Reverse edge not working
**Solution:** Ensure `@reverse` directive is in schema and data was created after applying schema

### Issue: Upsert conflict
**Solution:** Use `@upsert` on predicates that should be unique (like email)

---

## References

- **Dgraph Documentation:** https://dgraph.io/docs/
- **GraphQL+- Query Language:** https://dgraph.io/docs/query-language/
- **DQL (Dgraph Query Language):** https://dgraph.io/docs/dql/
- **Ratel Dashboard:** http://localhost:8000

---

## Appendix: Quick Reference

### Data Types
- `string` - Text data
- `int` - Integer numbers
- `float` - Floating point numbers
- `bool` - Boolean (true/false)
- `datetime` - ISO 8601 timestamps
- `uid` - Node reference
- `[type]` - Array of type

### Index Types
- `exact` - Exact string match
- `term` - Term matching (tokenized)
- `fulltext` - Full-text search
- `int`, `float` - Numeric indices
- `bool` - Boolean index
- `hour`, `day`, `month`, `year` - Datetime indices

### Common Functions
- `eq(predicate, value)` - Equals
- `allofterms(predicate, "text")` - All terms match
- `anyofterms(predicate, "text")` - Any term matches
- `ge(predicate, value)` - Greater than or equal
- `le(predicate, value)` - Less than or equal
- `has(predicate)` - Predicate exists
- `type(TypeName)` - Filter by type

---

**Document Version:** 1.0
**Last Updated:** 2024-11-18
**Database Version:** Dgraph v23.0+
