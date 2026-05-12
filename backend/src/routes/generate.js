import { Router } from 'express';
import { protect }          from '../middleware/auth.js';
import { generateLimiter }  from '../middleware/rateLimiter.js';
import { upload }           from '../middleware/uploadMiddleware.js';
import {
  textToImage, textGenValidators,
  imageToImage,
  inpaintToImage,
  getGeneration,
} from '../controllers/generateController.js';

const router = Router();

router.use(protect);

// Text → Image
router.post('/text',  generateLimiter, textGenValidators, textToImage);

// Image → Image (single file)
router.post('/image', generateLimiter, upload.single('image'), imageToImage);

// Inpainting (two files: original image + B&W mask)
router.post('/inpaint', generateLimiter, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mask',  maxCount: 1 },
]), inpaintToImage);

// Get generation by ID
router.get('/:id', getGeneration);

export default router;