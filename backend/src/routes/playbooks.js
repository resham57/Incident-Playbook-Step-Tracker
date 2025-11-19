import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validatePlaybook } from '../middleware/validators.js';
import dgraphClient from '../config/database.js';
import logger from '../config/logger.js';

const router = express.Router();

// GET /api/playbooks - List all playbooks
router.get('/', asyncHandler(async (req, res) => {
  const query = `
    query {
      playbooks(func: type(PlaybookTemplate), orderdesc: created_at) {
        uid
        name
        description
        incident_types
        severity_levels
        estimated_duration
        is_active
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

// GET /api/playbooks/:id - Get single playbook
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    {
      playbook(func: uid(${id})) @filter(type(PlaybookTemplate)) {
        uid
        name
        description
        incident_types
        severity_levels
        estimated_duration
        is_active
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
    incident_types: playbookData.incident_types || [],
    severity_levels: playbookData.severity_levels || [],
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
  if (updates.incident_types) playbook.incident_types = updates.incident_types;
  if (updates.severity_levels) playbook.severity_levels = updates.severity_levels;
  if (updates.estimated_duration) playbook.estimated_duration = updates.estimated_duration;
  if (updates.is_active !== undefined) playbook.is_active = updates.is_active;

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

export default router;
