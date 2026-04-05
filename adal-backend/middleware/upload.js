const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

// Make sure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// Where and how to save files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext    = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${unique}${ext}`)
  },
})

// Only allow these file types
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf|doc|docx/
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase())
  const mimeOk  = allowed.test(file.mimetype)
  if (extOk && mimeOk) return cb(null, true)
  cb(new Error('Only images (jpg, png), PDFs and Word documents are allowed.'))
}

const upload = multer({
  storage,
  limits:     { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter,
})

module.exports = upload