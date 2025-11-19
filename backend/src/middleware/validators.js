// Validation helper functions
export const validateIncident = (data) => {
  const errors = [];

  if (!data.title || data.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!data.severity || !['High', 'Medium', 'Low'].includes(data.severity)) {
    errors.push('Severity must be one of: High, Medium, Low');
  }

  if (!data.tlp || !['Red', 'Amber', 'Green', 'White'].includes(data.tlp)) {
    errors.push('TLP must be one of: Red, Amber, Green, White');
  }

  if (!data.status || !['Open', 'InProgress', 'Resolved', 'Closed'].includes(data.status)) {
    errors.push('Status must be one of: Open, InProgress, Resolved, Closed');
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(', '));
    error.name = 'ValidationError';
    throw error;
  }

  return true;
};

export const validateUser = (data) => {
  const errors = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!data.email || !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Valid email is required');
  }

  if (!data.role || !['incident_commander', 'analyst', 'technical_lead'].includes(data.role)) {
    errors.push('Role must be one of: incident_commander, analyst, technical_lead');
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(', '));
    error.name = 'ValidationError';
    throw error;
  }

  return true;
};

export const validatePlaybook = (data) => {
  const errors = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!data.description || data.description.trim() === '') {
    errors.push('Description is required');
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(', '));
    error.name = 'ValidationError';
    throw error;
  }

  return true;
};

export const validateArtifact = (data) => {
  const errors = [];

  if (!data.value || data.value.trim() === '') {
    errors.push('Value is required');
  }

  if (!data.artifact_type || !['ip', 'domain', 'hash', 'url', 'email'].includes(data.artifact_type)) {
    errors.push('Artifact type must be one of: ip, domain, hash, url, email');
  }

  if (!data.status || !['malicious', 'clean', 'unknown'].includes(data.status)) {
    errors.push('Status must be one of: malicious, clean, unknown');
  }

  if (!data.kind || !['asset', 'ioc'].includes(data.kind)) {
    errors.push('Kind must be one of: asset, ioc');
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(', '));
    error.name = 'ValidationError';
    throw error;
  }

  return true;
};
