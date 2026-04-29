/** POST /api/v1/upload/image */
export function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }

  const url = `/uploads/${req.file.filename}`;

  res.status(201).json({
    success:  true,
    message:  'Image uploaded successfully',
    url,
    filename: req.file.filename,
    size:     req.file.size,
    mimetype: req.file.mimetype,
  });
}
