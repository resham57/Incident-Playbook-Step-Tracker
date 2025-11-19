import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import dgraphClient from '../config/database.js';
import logger from '../config/logger.js';

const router = express.Router();

// PUT /api/references/:id - Update reference
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, link } = req.body;

  if (!title && !link) {
    return res.status(400).json({
      success: false,
      error: 'At least one field (title or link) is required to update'
    });
  }

  // Prepare update object
  const reference = {
    uid: id
  };

  if (title) reference.title = title;
  if (link) reference.link = link;

  const txn = dgraphClient.newTxn();
  try {
    await txn.mutate({ setJson: reference });
    await txn.commit();

    logger.info(`Updated reference: ${id}`);

    res.json({
      success: true,
      message: 'Reference updated successfully',
      data: reference
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// DELETE /api/references/:id - Delete reference
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const txn = dgraphClient.newTxn();
  try {
    // Delete the reference (Dgraph will handle reverse edge cleanup)
    await txn.mutate({ deleteJson: { uid: id } });
    await txn.commit();

    logger.info(`Deleted reference: ${id}`);

    res.json({
      success: true,
      message: 'Reference deleted successfully'
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// GET /api/references/:id - Get single reference
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    {
      reference(func: uid(${id})) @filter(type(Reference)) {
        uid
        title
        link
        created_at
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
    const reference = response.data.reference?.[0];

    if (!reference) {
      return res.status(404).json({
        success: false,
        error: 'Reference not found'
      });
    }

    logger.info(`Retrieved reference: ${id}`);

    res.json({
      success: true,
      data: reference
    });
  } finally {
    await txn.discard();
  }
}));

export default router;
