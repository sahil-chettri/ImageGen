import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload }       from '../middleware/uploadMiddleware.js';
import { uploadImage }  from '../controllers/uploadController.js';

const router = Router();

router.post('/image', authenticate, upload.single('image'), uploadImage);

export default router;