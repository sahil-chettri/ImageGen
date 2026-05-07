import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getCredits, getPlans, purchaseCredits } from '../controllers/creditsController.js';

const router = Router();

router.use(protect);

router.get('/',          getCredits);
router.get('/plans',     getPlans);
router.post('/purchase', purchaseCredits);

export default router;