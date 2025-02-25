// src/routes/locationRoutes.ts

import express from 'express';
import { auth } from '../middleware/auth';
import { createLocation, getLocations, getLocation } from '../controllers/locationController';

const router = express.Router();

router.post('/', auth, createLocation);
router.get('/', getLocations);
router.get('/:id', getLocation);

export default router;