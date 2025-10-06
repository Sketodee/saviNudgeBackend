// routes/userRoutes.ts
import express from 'express';
import { createUser, getUserByEmail, getUserById } from '../../controllers/userController';


const router = express.Router();

router.route('/createuser').post(createUser);

router.route('/:userId').get(getUserById);

router.route('/getuserbyemail').get(getUserByEmail);


export default router;