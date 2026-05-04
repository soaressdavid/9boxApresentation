import express from 'express';
import UserController from './user.controller.js';
import {authMiddleware, isAdminMiddleware, isGestorOrAdminMiddleware} from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../users/user.validation.js';
import valid from 'joi';

const router = express.Router();
const userController = new UserController();

router.post('/login', validate(loginSchema), (req, res, next) => userController.login(req, res, next));

router.use(authMiddleware);

router.get('/profile', (req, res, next) => userController.getProfile(req, res, next));
router.put('/profile', validate(updateProfileSchema), (req, res, next) => userController.updateProfile(req, res, next));

router.get('/ra/:ra', (req, res, next) => userController.findByRA(req, res, next));
router.get('/', isGestorOrAdminMiddleware, (req, res, next) => userController.findAll(req, res, next));

router.post('/register', isAdminMiddleware, validate(registerSchema), (req, res, next) => userController.register(req, res, next));

router.get('/:id', isGestorOrAdminMiddleware, (req, res, next) => userController.findById(req, res, next));
router.delete('/:id', isAdminMiddleware, (req, res, next) => userController.delete(req, res, next));

export default router;