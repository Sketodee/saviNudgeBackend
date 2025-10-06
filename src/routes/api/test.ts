import express from 'express';
const router = express.Router();
import testController from '../../controllers/testController';


router.route('/testApi')
.get(testController.getTest);


export default router;