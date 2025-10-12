import express from 'express';  
import { login } from '../../controllers/authController';
import { verifyJWT, verifyRole } from '../../middleware/authMiddleware';

const router = express.Router();    

router.route('/login').post(login);
// router.route('/login').post(verifyJWT, verifyRole(), login);

export default router;
