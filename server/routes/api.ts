import { Router } from 'express';
import { checkBalance } from '../controllers/balanceController.js';

const router = Router();

router.get('/checkBalance', checkBalance);

export default router;
