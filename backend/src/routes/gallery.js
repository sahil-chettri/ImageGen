import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getGallery, getGalleryItem, deleteGalleryItem } from '../controllers/galleryController.js';

const router = Router();

router.use(protect);

router.get('/',       getGallery);
router.get('/:id',    getGalleryItem);
router.delete('/:id', deleteGalleryItem);

export default router;