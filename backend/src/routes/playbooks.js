import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validatePlaybook } from '../middleware/validators.js';
import dgraphClient from '../config/database.js';
import logger from '../config/logger.js';
import upload from '../config/upload.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/playbooks - List all playbooks
router.get('/', asyncHandler(async (req, res) => {
  const query = `
    query {
      playbooks(func: type(PlaybookTemplate), orderdesc: created_at) {
        uid
        name
        description
        estimated_duration
        is_active
        flow_diagram_url
        created_at
        updated_at
        steps {
          uid
          step_number
          title
          description
          action_items
          expected_outcome
          estimated_time
          prerequisites
        }
      }
    }
  `;

  const txn = dgraphClient.newTxn({ readOnly: true });
  try {
    const response = await txn.query(query);
    const playbooks = response.data.playbooks || [];

    logger.info(`Retrieved ${playbooks.length} playbooks`);

    res.json({
      success: true,
      count: playbooks.length,
      data: playbooks
    });
  } finally {
    await txn.discard();
  }
}));

// GET /api/playbooks/diagrams/:filename - Serve flow diagram image
// IMPORTANT: This route must come BEFORE /:id route to avoid "diagrams" being treated as an ID
router.get('/diagrams/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const uploadsDir = path.join(__dirname, '../../uploads');
  const filePath = path.join(uploadsDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  // Send the file
  res.sendFile(filePath);
}));

// GET /api/playbooks/:id - Get single playbook
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    {
      playbook(func: uid(${id})) @filter(type(PlaybookTemplate)) {
        uid
        name
        description
        estimated_duration
        is_active
        flow_diagram_url
        created_at
        updated_at
        steps {
          uid
          step_number
          title
          description
          action_items
          expected_outcome
          estimated_time
          prerequisites
        }
      }
    }
  `;

  const txn = dgraphClient.newTxn({ readOnly: true });
  try {
    const response = await txn.query(query);
    const playbook = response.data.playbook?.[0];

    if (!playbook) {
      return res.status(404).json({
        success: false,
        error: 'Playbook not found'
      });
    }

    logger.info(`Retrieved playbook: ${id}`);

    res.json({
      success: true,
      data: playbook
    });
  } finally {
    await txn.discard();
  }
}));

// POST /api/playbooks - Create new playbook
router.post('/', asyncHandler(async (req, res) => {
  const playbookData = req.body;

  // Validate playbook data
  validatePlaybook(playbookData);

  // Prepare playbook object
  const playbook = {
    'dgraph.type': 'PlaybookTemplate',
    name: playbookData.name,
    description: playbookData.description,
    estimated_duration: playbookData.estimated_duration || '',
    is_active: playbookData.is_active !== undefined ? playbookData.is_active : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Add steps if provided
  if (playbookData.steps && Array.isArray(playbookData.steps)) {
    playbook.steps = playbookData.steps.map((step, index) => ({
      'dgraph.type': 'PlaybookStep',
      step_number: step.step_number || index + 1,
      title: step.title,
      description: step.description || '',
      action_items: step.action_items || [],
      expected_outcome: step.expected_outcome || '',
      estimated_time: step.estimated_time || '',
      prerequisites: step.prerequisites || []
    }));
  }

  const txn = dgraphClient.newTxn();
  try {
    const response = await txn.mutate({ setJson: playbook });
    await txn.commit();

    const uid = Object.values(response.data.uids)[0];
    logger.info(`Created playbook: ${uid}`);

    res.status(201).json({
      success: true,
      message: 'Playbook created successfully',
      data: { uid, ...playbook }
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// PUT /api/playbooks/:id - Update playbook
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Prepare update object
  const playbook = {
    uid: id,
    updated_at: new Date().toISOString()
  };

  // Add fields that are being updated
  if (updates.name) playbook.name = updates.name;
  if (updates.description) playbook.description = updates.description;
  if (updates.estimated_duration) playbook.estimated_duration = updates.estimated_duration;
  if (updates.is_active !== undefined) playbook.is_active = updates.is_active;
  if (updates.flow_diagram_url !== undefined) playbook.flow_diagram_url = updates.flow_diagram_url;

  const txn = dgraphClient.newTxn();
  try {
    await txn.mutate({ setJson: playbook });
    await txn.commit();

    logger.info(`Updated playbook: ${id}`);

    res.json({
      success: true,
      message: 'Playbook updated successfully',
      data: playbook
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// DELETE /api/playbooks/:id - Delete playbook
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const txn = dgraphClient.newTxn();
  try {
    await txn.mutate({ deleteJson: { uid: id } });
    await txn.commit();

    logger.info(`Deleted playbook: ${id}`);

    res.json({
      success: true,
      message: 'Playbook deleted successfully'
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// POST /api/playbooks/:id/upload-diagram - Upload flow diagram for a playbook
router.post('/:id/upload-diagram', upload.single('diagram'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  logger.info(`File uploaded: ${req.file.filename}, Path: ${req.file.path}`);

  // Construct the URL for the uploaded file
  const fileUrl = `/api/playbooks/diagrams/${req.file.filename}`;

  // Update the playbook with the flow diagram URL
  const txn = dgraphClient.newTxn();
  try {
    const playbook = {
      uid: id,
      flow_diagram_url: fileUrl,
      updated_at: new Date().toISOString()
    };

    await txn.mutate({ setJson: playbook });
    await txn.commit();

    logger.info(`Uploaded flow diagram for playbook: ${id}`);

    res.json({
      success: true,
      message: 'Flow diagram uploaded successfully',
      data: {
        flow_diagram_url: fileUrl
      }
    });
  } catch (error) {
    await txn.discard();
    // Delete the uploaded file if database update fails
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        logger.info(`Deleted uploaded file after error: ${req.file.path}`);
      } catch (unlinkError) {
        logger.error(`Failed to delete file: ${unlinkError.message}`);
      }
    }
    logger.error(`Error uploading diagram: ${error.message}`);
    throw error;
  }
}));

// DELETE /api/playbooks/:id/diagram - Delete flow diagram
router.delete('/:id/diagram', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First, get the current playbook to find the diagram URL
  const query = `
    {
      playbook(func: uid(${id})) @filter(type(PlaybookTemplate)) {
        uid
        flow_diagram_url
      }
    }
  `;

  const txnRead = dgraphClient.newTxn({ readOnly: true });
  try {
    const response = await txnRead.query(query);
    const playbook = response.data.playbook?.[0];

    if (!playbook) {
      return res.status(404).json({
        success: false,
        error: 'Playbook not found'
      });
    }

    // Delete the file if it exists
    if (playbook.flow_diagram_url) {
      const filename = path.basename(playbook.flow_diagram_url);
      const uploadsDir = path.join(__dirname, '../../uploads');
      const filePath = path.join(uploadsDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update the playbook to remove the flow_diagram_url
    const txn = dgraphClient.newTxn();
    try {
      const update = {
        uid: id,
        flow_diagram_url: null,
        updated_at: new Date().toISOString()
      };

      await txn.mutate({ setJson: update });
      await txn.commit();

      logger.info(`Deleted flow diagram for playbook: ${id}`);

      res.json({
        success: true,
        message: 'Flow diagram deleted successfully'
      });
    } catch (error) {
      await txn.discard();
      throw error;
    }
  } finally {
    await txnRead.discard();
  }
}));

export default router;
