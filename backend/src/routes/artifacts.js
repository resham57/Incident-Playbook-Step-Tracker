import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateArtifact } from '../middleware/validators.js';
import dgraphClient from '../config/database.js';
import logger from '../config/logger.js';

const router = express.Router();

// PUT /api/artifacts/:id - Update artifact
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Validate artifact updates
  if (updates.value || updates.artifact_type || updates.status || updates.kind) {
    validateArtifact({
      value: updates.value || 'temp',
      artifact_type: updates.artifact_type || 'ip',
      status: updates.status || 'unknown',
      kind: updates.kind || 'ioc',
      ...updates
    });
  }

  // Prepare update object
  const artifact = {
    uid: id,
    updated_at: new Date().toISOString()
  };

  // Add fields that are being updated
  if (updates.value) artifact.value = updates.value;
  if (updates.artifact_type) artifact.artifact_type = updates.artifact_type;
  if (updates.status) artifact.status = updates.status;
  if (updates.kind) artifact.kind = updates.kind;
  if (updates.notes !== undefined) artifact.notes = updates.notes;

  const txn = dgraphClient.newTxn();
  try {
    await txn.mutate({ setJson: artifact });
    await txn.commit();

    logger.info(`Updated artifact: ${id}`);

    res.json({
      success: true,
      message: 'Artifact updated successfully',
      data: artifact
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// DELETE /api/artifacts/:id - Delete artifact
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const txn = dgraphClient.newTxn();
  try {
    // Delete the artifact (Dgraph will handle reverse edge cleanup)
    await txn.mutate({ deleteJson: { uid: id } });
    await txn.commit();

    logger.info(`Deleted artifact: ${id}`);

    res.json({
      success: true,
      message: 'Artifact deleted successfully'
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// GET /api/artifacts/:id - Get single artifact
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    {
      artifact(func: uid(${id})) @filter(type(Artifact)) {
        uid
        value
        artifact_type
        status
        kind
        notes
        created_at
        updated_at
        incident {
          uid
          title
        }
      }
    }
  `;

  const txn = dgraphClient.newTxn({ readOnly: true });
  try {
    const response = await txn.query(query);
    const artifact = response.data.artifact?.[0];

    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: 'Artifact not found'
      });
    }

    logger.info(`Retrieved artifact: ${id}`);

    res.json({
      success: true,
      data: artifact
    });
  } finally {
    await txn.discard();
  }
}));

export default router;
