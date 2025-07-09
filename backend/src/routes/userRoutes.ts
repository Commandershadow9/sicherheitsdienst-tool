import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth'; // Added authenticate import
// Optional: authorize for role-based access
// import { authorize } from '../middleware/auth';
// import { Role } from '@prisma/client'; // Use Prisma Role enum for authorize if needed

const router = Router();

// All routes below require authentication

// GET /api/users - Retrieve all employees
// Example: Only ADMIN and DISPATCHER may view all users
// router.get('/', authenticate, authorize('ADMIN', 'DISPATCHER'), asyncHandler(userController.getAllUsers));
router.get('/', authenticate, asyncHandler(userController.getAllUsers)); // For now only authentication

// POST /api/users - Create a new employee
// Example: Only ADMIN may create users
// router.post('/', authenticate, authorize('ADMIN'), asyncHandler(userController.createUser));
router.post('/', authenticate, asyncHandler(userController.createUser)); // For now only authentication

// GET /api/users/:id - Retrieve a specific employee
// Allows ADMIN to fetch any user or a user to get their own profile (additional logic in controller)
router.get('/:id', authenticate, asyncHandler(userController.getUserById));

// PUT /api/users/:id - Update an employee
// Similar to above, ADMIN can update any user while a user may only update themselves
router.put('/:id', authenticate, asyncHandler(userController.updateUser));

// DELETE /api/users/:id - Deactivate an employee (soft delete)
// Example: Only ADMIN may deactivate users
// router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(userController.deactivateUser));
router.delete('/:id', authenticate, asyncHandler(userController.deactivateUser)); // For now only authentication
export default router;
