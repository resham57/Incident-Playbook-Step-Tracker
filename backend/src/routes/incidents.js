import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateIncident, validateArtifact } from '../middleware/validators.js';
import dgraphClient from '../config/database.js';
import logger from '../config/logger.js';
import upload from '../config/upload.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/incidents - List all incidents
router.get('/', asyncHandler(async (req, res) => {
  const query = `
    query {
      incidents(func: type(Incident), orderdesc: created_at) {
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
        }
        playbook {
          uid
          name
        }
      }
    }
  `;

  const txn = dgraphClient.newTxn({ readOnly: true });
  try {
    const response = await txn.query(query);
    const incidents = response.data.incidents || [];

    logger.info(`Retrieved ${incidents.length} incidents`);

    res.json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } finally {
    await txn.discard();
  }
}));

// GET /api/incidents/:id - Get single incident
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    {
      incident(func: uid(${id})) @filter(type(Incident)) {
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
          updated_at
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
        }
      }
    }
  `;

  const txn = dgraphClient.newTxn({ readOnly: true });
  try {
    const response = await txn.query(query);
    const incident = response.data.incident?.[0];

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    logger.info(`Retrieved incident: ${id}`);

    res.json({
      success: true,
      data: incident
    });
  } finally {
    await txn.discard();
  }
}));

// POST /api/incidents - Create new incident
router.post('/', asyncHandler(async (req, res) => {
  const incidentData = req.body;

  // Validate incident data
  validateIncident(incidentData);

  // Prepare incident object
  const incident = {
    'dgraph.type': 'Incident',
    title: incidentData.title,
    description: incidentData.description || '',
    severity: incidentData.severity,
    tlp: incidentData.tlp,
    status: incidentData.status || 'Open',
    files: incidentData.files || [],
    references: incidentData.references || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Add assigned user if provided
  if (incidentData.assigned_to) {
    incident.assigned_to = { uid: incidentData.assigned_to };
  }

  // Add playbook if provided
  if (incidentData.playbook) {
    incident.playbook = { uid: incidentData.playbook };
  }

  // Add artifacts if provided
  if (incidentData.artifacts && Array.isArray(incidentData.artifacts)) {
    incident.artifacts = incidentData.artifacts.map(artifact => {
      validateArtifact(artifact);
      return {
        'dgraph.type': 'Artifact',
        value: artifact.value,
        artifact_type: artifact.artifact_type,
        status: artifact.status,
        kind: artifact.kind,
        notes: artifact.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  }

  const txn = dgraphClient.newTxn();
  try {
    const response = await txn.mutate({ setJson: incident });
    await txn.commit();

    const uid = Object.values(response.data.uids)[0];
    logger.info(`Created incident: ${uid}`);

    res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      data: { uid, ...incident }
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// PUT /api/incidents/:id - Update incident
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Validate if severity, tlp, or status are being updated
  if (updates.severity || updates.tlp || updates.status) {
    validateIncident({
      title: 'temp',
      severity: updates.severity || 'Medium',
      tlp: updates.tlp || 'Amber',
      status: updates.status || 'Open',
      ...updates
    });
  }

  // Prepare update object
  const incident = {
    uid: id,
    updated_at: new Date().toISOString()
  };

  // Add fields that are being updated
  if (updates.title) incident.title = updates.title;
  if (updates.description) incident.description = updates.description;
  if (updates.severity) incident.severity = updates.severity;
  if (updates.tlp) incident.tlp = updates.tlp;
  if (updates.status) incident.status = updates.status;
  if (updates.files) incident.files = updates.files;
  if (updates.references) incident.references = updates.references;
  if (updates.assigned_to) incident.assigned_to = { uid: updates.assigned_to };
  if (updates.playbook) incident.playbook = { uid: updates.playbook };

  // Handle closed_at timestamp
  if (updates.status === 'Closed' || updates.status === 'Resolved') {
    incident.closed_at = new Date().toISOString();
  }

  const txn = dgraphClient.newTxn();
  try {
    await txn.mutate({ setJson: incident });
    await txn.commit();

    logger.info(`Updated incident: ${id}`);

    res.json({
      success: true,
      message: 'Incident updated successfully',
      data: incident
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// DELETE /api/incidents/:id - Delete incident
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const txn = dgraphClient.newTxn();
  try {
    await txn.mutate({ deleteJson: { uid: id } });
    await txn.commit();

    logger.info(`Deleted incident: ${id}`);

    res.json({
      success: true,
      message: 'Incident deleted successfully'
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// POST /api/incidents/:id/artifacts - Add artifact to incident
router.post('/:id/artifacts', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const artifactData = req.body;

  // Validate artifact data
  validateArtifact(artifactData);

  // Create artifact object
  const artifact = {
    'dgraph.type': 'Artifact',
    value: artifactData.value,
    artifact_type: artifactData.artifact_type,
    status: artifactData.status,
    kind: artifactData.kind,
    notes: artifactData.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    incident: { uid: id }
  };

  const txn = dgraphClient.newTxn();
  try {
    // Create the artifact
    const response = await txn.mutate({ setJson: artifact });
    const artifactUid = Object.values(response.data.uids)[0];

    // Link artifact to incident
    const linkMutation = {
      uid: id,
      artifacts: [{ uid: artifactUid }]
    };
    await txn.mutate({ setJson: linkMutation });

    await txn.commit();

    logger.info(`Created artifact: ${artifactUid} for incident: ${id}`);

    res.status(201).json({
      success: true,
      message: 'Artifact created successfully',
      data: { uid: artifactUid, ...artifact }
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// POST /api/incidents/:id/references - Add reference to incident
router.post('/:id/references', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, link } = req.body;

  if (!title || !link) {
    return res.status(400).json({
      success: false,
      error: 'Title and link are required'
    });
  }

  // Create reference object
  const reference = {
    'dgraph.type': 'Reference',
    title,
    link,
    created_at: new Date().toISOString(),
    incident: { uid: id }
  };

  const txn = dgraphClient.newTxn();
  try {
    // Create the reference
    const response = await txn.mutate({ setJson: reference });
    const referenceUid = Object.values(response.data.uids)[0];

    // Link reference to incident
    const linkMutation = {
      uid: id,
      references: [{ uid: referenceUid }]
    };
    await txn.mutate({ setJson: linkMutation });

    await txn.commit();

    logger.info(`Created reference: ${referenceUid} for incident: ${id}`);

    res.status(201).json({
      success: true,
      message: 'Reference created successfully',
      data: { uid: referenceUid, ...reference }
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// POST /api/incidents/:id/files - Upload file to incident
router.post('/:id/files', upload.single('file'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  // Fetch current incident to get existing files
  const query = `
    {
      incident(func: uid(${id})) @filter(type(Incident)) {
        uid
        files
      }
    }
  `;

  const txn = dgraphClient.newTxn();
  try {
    const response = await txn.query(query);
    const incident = response.data.incident?.[0];

    if (!incident) {
      await txn.discard();
      // Delete uploaded file if incident not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    const files = incident.files || [];
    // Store file metadata as JSON string
    const fileMetadata = JSON.stringify({
      filename: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    });
    files.push(fileMetadata);

    // Update incident with new file
    const updateMutation = {
      uid: id,
      files,
      updated_at: new Date().toISOString()
    };

    await txn.mutate({ setJson: updateMutation });
    await txn.commit();

    logger.info(`Uploaded file ${req.file.filename} to incident: ${id}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: JSON.parse(fileMetadata),
        files
      }
    });
  } catch (error) {
    await txn.discard();
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
}));

// GET /api/incidents/:id/files/:filename - Download file
router.get('/:id/files/:filename', asyncHandler(async (req, res) => {
  const { id, filename } = req.params;

  // Verify incident exists and has this file
  const query = `
    {
      incident(func: uid(${id})) @filter(type(Incident)) {
        uid
        files
      }
    }
  `;

  const txn = dgraphClient.newTxn({ readOnly: true });
  try {
    const response = await txn.query(query);
    const incident = response.data.incident?.[0];

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Verify file belongs to this incident
    const fileExists = (incident.files || []).some(f => {
      try {
        const fileData = JSON.parse(f);
        return fileData.storedName === filename;
      } catch {
        return false;
      }
    });

    if (!fileExists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Serve the file
    const uploadsDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }

    // Get original filename from metadata
    let originalFilename = filename;
    (incident.files || []).forEach(f => {
      try {
        const fileData = JSON.parse(f);
        if (fileData.storedName === filename) {
          originalFilename = fileData.filename;
        }
      } catch {}
    });

    res.download(filePath, originalFilename);
  } finally {
    await txn.discard();
  }
}));

// DELETE /api/incidents/:id/files/:filename - Remove file from incident
router.delete('/:id/files/:filename', asyncHandler(async (req, res) => {
  const { id, filename } = req.params;

  // Fetch current incident to get existing files
  const query = `
    {
      incident(func: uid(${id})) @filter(type(Incident)) {
        uid
        files
      }
    }
  `;

  const txn = dgraphClient.newTxn();
  try {
    const response = await txn.query(query);
    const incident = response.data.incident?.[0];

    if (!incident) {
      await txn.discard();
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Find and remove the file from the array
    const files = (incident.files || []).filter(f => {
      try {
        const fileData = JSON.parse(f);
        return fileData.storedName !== filename;
      } catch {
        return true; // Keep non-JSON entries
      }
    });

    // Delete the physical file
    const uploadsDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update incident with remaining files
    const updateMutation = {
      uid: id,
      files,
      updated_at: new Date().toISOString()
    };

    await txn.mutate({ setJson: updateMutation });
    await txn.commit();

    logger.info(`Removed file ${filename} from incident: ${id}`);

    res.json({
      success: true,
      message: 'File removed successfully',
      data: { files }
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// POST /api/incidents/:id/related-tickets - Add related ticket to incident
router.post('/:id/related-tickets', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { relatedTicketId } = req.body;

  if (!relatedTicketId) {
    return res.status(400).json({
      success: false,
      error: 'Related ticket ID is required'
    });
  }

  // Verify both incidents exist
  const query = `
    {
      incident(func: uid(${id})) @filter(type(Incident)) {
        uid
      }
      relatedTicket(func: uid(${relatedTicketId})) @filter(type(Incident)) {
        uid
      }
    }
  `;

  const txn = dgraphClient.newTxn();
  try {
    const response = await txn.query(query);

    if (!response.data.incident?.[0]) {
      await txn.discard();
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    if (!response.data.relatedTicket?.[0]) {
      await txn.discard();
      return res.status(404).json({
        success: false,
        error: 'Related ticket not found'
      });
    }

    // Link related ticket to incident
    const linkMutation = {
      uid: id,
      related_tickets: [{ uid: relatedTicketId }],
      updated_at: new Date().toISOString()
    };

    await txn.mutate({ setJson: linkMutation });
    await txn.commit();

    logger.info(`Added related ticket ${relatedTicketId} to incident: ${id}`);

    res.json({
      success: true,
      message: 'Related ticket added successfully'
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// DELETE /api/incidents/:id/related-tickets/:ticketId - Remove related ticket from incident
router.delete('/:id/related-tickets/:ticketId', asyncHandler(async (req, res) => {
  const { id, ticketId } = req.params;

  const txn = dgraphClient.newTxn();
  try {
    // Remove the relationship
    const deleteMutation = {
      uid: id,
      related_tickets: [{ uid: ticketId }]
    };

    await txn.mutate({ deleteJson: deleteMutation });
    await txn.commit();

    logger.info(`Removed related ticket ${ticketId} from incident: ${id}`);

    res.json({
      success: true,
      message: 'Related ticket removed successfully'
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

export default router;
