import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateUser } from '../middleware/validators.js';
import dgraphClient from '../config/database.js';
import logger from '../config/logger.js';

const router = express.Router();

// GET /api/users - List all users
router.get('/', asyncHandler(async (req, res) => {
  const query = `
    query {
      users(func: type(User), orderdesc: created_at) {
        uid
        name
        email
        role
        department
        is_active
        created_at
        updated_at
        assigned_incidents: ~assigned_to @filter(type(Incident)) {
          uid
          title
          severity
          status
        }
      }
    }
  `;

  const txn = dgraphClient.newTxn({ readOnly: true });
  try {
    const response = await txn.query(query);
    const users = response.data.users || [];

    logger.info(`Retrieved ${users.length} users`);

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } finally {
    await txn.discard();
  }
}));

// GET /api/users/:id - Get single user
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    {
      user(func: uid(${id})) @filter(type(User)) {
        uid
        name
        email
        role
        department
        is_active
        created_at
        updated_at
        assigned_incidents: ~assigned_to @filter(type(Incident)) {
          uid
          title
          description
          severity
          tlp
          status
          created_at
        }
      }
    }
  `;

  const txn = dgraphClient.newTxn({ readOnly: true });
  try {
    const response = await txn.query(query);
    const user = response.data.user?.[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`Retrieved user: ${id}`);

    res.json({
      success: true,
      data: user
    });
  } finally {
    await txn.discard();
  }
}));

// POST /api/users - Create new user
router.post('/', asyncHandler(async (req, res) => {
  const userData = req.body;

  // Validate user data
  validateUser(userData);

  // Prepare user object
  const user = {
    'dgraph.type': 'User',
    name: userData.name,
    email: userData.email,
    role: userData.role,
    department: userData.department || '',
    is_active: userData.is_active !== undefined ? userData.is_active : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const txn = dgraphClient.newTxn();
  try {
    const response = await txn.mutate({ setJson: user });
    await txn.commit();

    const uid = Object.values(response.data.uids)[0];
    logger.info(`Created user: ${uid}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { uid, ...user }
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// PUT /api/users/:id - Update user
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Prepare update object
  const user = {
    uid: id,
    updated_at: new Date().toISOString()
  };

  // Add fields that are being updated
  if (updates.name) user.name = updates.name;
  if (updates.email) user.email = updates.email;
  if (updates.role) user.role = updates.role;
  if (updates.department) user.department = updates.department;
  if (updates.is_active !== undefined) user.is_active = updates.is_active;

  const txn = dgraphClient.newTxn();
  try {
    await txn.mutate({ setJson: user });
    await txn.commit();

    logger.info(`Updated user: ${id}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

// DELETE /api/users/:id - Delete user
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const txn = dgraphClient.newTxn();
  try {
    await txn.mutate({ deleteJson: { uid: id } });
    await txn.commit();

    logger.info(`Deleted user: ${id}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    await txn.discard();
    throw error;
  }
}));

export default router;
