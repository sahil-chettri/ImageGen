import { Router } from 'express';
import { authenticate }     from '../middleware/auth.js';
import { generateLimiter }  from '../middleware/rateLimiter.js';
import { upload }           from '../middleware/uploadMiddleware.js';
import {
  textToImage,  textGenValidators,
  imageToImage,
  getGeneration,
} from '../controllers/generateController.js';

const router = Router();

// All generate routes require auth
router.use(authenticate);

router.post('/text',  generateLimiter, textGenValidators, textToImage);
router.post('/image', generateLimiter, upload.single('image'), imageToImage);
router.get('/:id',    getGeneration);

export default router;