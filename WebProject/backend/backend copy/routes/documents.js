const router = require('express').Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Document = require('../models/Document');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const { ingestDocument, chunkText, deleteDocumentChunks } = require('../utils/rag');

// Middleware to verify token
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and TXT files are allowed'));
        }
    }
});

// Extract text from PDF
const extractTextFromPDF = async (filePath) => {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
};

// Extract text from TXT
const extractTextFromTXT = async (filePath) => {
    return await fs.readFile(filePath, 'utf-8');
};

// UPLOAD document
router.post('/upload', auth, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const filePath = req.file.path;
        let text = '';

        // Extract text based on file type
        if (req.file.mimetype === 'application/pdf') {
            text = await extractTextFromPDF(filePath);
        } else if (req.file.mimetype === 'text/plain') {
            text = await extractTextFromTXT(filePath);
        }

        if (!text || text.trim().length === 0) {
            await fs.unlink(filePath);
            return res.status(400).json({ msg: 'Could not extract text from document' });
        }

        // Chunk the text
        const chunks = chunkText(text);
        
        // Ingest document with embeddings using RAG utility
        const result = await ingestDocument(req.userId, chunks, req.file.originalname);

        // Save document metadata to MongoDB
        const document = new Document({
            userId: req.userId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            chromaId: result.docId
        });

        await document.save();

        // Clean up uploaded file after processing
        await fs.unlink(filePath);

        res.json({
            msg: 'Document uploaded and processed successfully',
            document: {
                id: document._id,
                originalName: document.originalName,
                fileSize: document.fileSize,
                uploadedAt: document.uploadedAt,
                chunksCreated: result.chunksCreated
            }
        });
    } catch (err) {
        console.error('Upload error:', err);
        // Clean up file if it exists
        if (req.file?.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkErr) {
                console.error('Error cleaning up file:', unlinkErr);
            }
        }
        res.status(500).json({ error: err.message || 'Failed to upload document' });
    }
});

// GET all documents for user
router.get('/list', auth, async (req, res) => {
    try {
        const documents = await Document.find({ userId: req.userId })
            .sort({ uploadedAt: -1 })
            .select('originalName fileType fileSize uploadedAt');
        res.json(documents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE document
router.delete('/:documentId', auth, async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.documentId,
            userId: req.userId
        });

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Delete from ChromaDB using RAG utility
        await deleteDocumentChunks(req.userId, document.originalName);

        // Delete from MongoDB
        await Document.deleteOne({ _id: req.params.documentId });

        res.json({ msg: 'Document deleted successfully' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
