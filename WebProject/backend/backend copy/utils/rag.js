const { ChromaClient } = require('chromadb');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pipeline } = require('@xenova/transformers');

// FREE Gemini API for LLM generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Initialize embedding model (runs in Node.js!)
let embedder = null;
const initEmbedder = async () => {
  if (!embedder) {
    console.log('🔄 Loading embedding model (one-time download ~25MB)...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Embedding model loaded');
  }
  return embedder;
};

// Initialize ChromaDB client (singleton) - HTTP server mode
let chromaClient = null;
let collection = null;

const initChroma = async () => {
  if (!chromaClient) {
    // Connect to ChromaDB HTTP server
    chromaClient = new ChromaClient({
      path: "http://localhost:8000"
    });
    
    try {
      collection = await chromaClient.getOrCreateCollection({
        name: "academic_documents",
        metadata: { "hnsw:space": "cosine" }
      });
      console.log('✅ ChromaDB connected (http://localhost:8000)');
    } catch (err) {
      console.error('❌ ChromaDB initialization error:', err.message);
      console.error('💡 Make sure ChromaDB is running: chroma run --path ./chroma_data --port 8000');
      throw err;
    }
  }
  return collection;
};

/**
 * Generate embeddings using Transformers.js (runs in Node.js!)
 */
async function generateEmbedding(text) {
  try {
    const model = await initEmbedder();
    const output = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('❌ Embedding generation error:', err.message);
    throw new Error('Failed to generate embedding.');
  }
}

/**
 * Chunk text into smaller pieces
 */
function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }
  
  return chunks;
}

/**
 * Ingest document chunks with embeddings
 */
async function ingestDocument(userId, textChunks, fileName) {
  const collection = await initChroma();
  const timestamp = Date.now();
  
  const ids = [];
  const embeddings = [];
  const documents = [];
  const metadatas = [];

  // Generate embeddings for all chunks
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    const embedding = await generateEmbedding(chunk);
    
    ids.push(`${userId}_${timestamp}_chunk_${i}`);
    embeddings.push(embedding);
    documents.push(chunk);
    metadatas.push({
      userId: userId.toString(),
      fileName: fileName,
      chunkIndex: i,
      totalChunks: textChunks.length,
      uploadDate: new Date().toISOString()
    });
  }

  // Add to ChromaDB
  await collection.add({
    ids: ids,
    embeddings: embeddings,
    documents: documents,
    metadatas: metadatas
  });

  return {
    docId: `${userId}_${timestamp}`,
    chunksCreated: textChunks.length
  };
}

/**
 * RAG Query - Retrieve relevant context and generate answer
 */
async function ragQuery(userId, question) {
  try {
    const collection = await initChroma();
    
    // Step 1: Embed the question
    const questionEmbedding = await generateEmbedding(question);
    
    // Step 2: Vector search for relevant chunks
    const results = await collection.query({
      queryEmbeddings: [questionEmbedding],
      nResults: 5,
      where: {
        userId: userId.toString()
      }
    });

    // Step 3: Build context from retrieved chunks
    const chunks = results.documents[0] || [];
    const metadatas = results.metadatas[0] || [];
    
    if (chunks.length === 0) {
      return {
        answer: "I don't have any documents uploaded yet that relate to your question. Please upload relevant course materials in the Documents page, and I'll be able to help you better!",
        sources: []
      };
    }

    const context = chunks.map((chunk, idx) => {
      const meta = metadatas[idx];
      return `[Source: ${meta.fileName}]\n${chunk}`;
    }).join('\n\n---\n\n');

    // Step 4: Generate answer using FREE Gemini 2.0 Flash LLM
    const prompt = `You are an AI academic assistant helping a student with their coursework. Use the provided context from their uploaded documents to answer their question accurately and helpfully.

IMPORTANT RULES:
- Answer based ONLY on the context provided below
- If the context doesn't contain enough information, say "I don't have enough information in your uploaded documents to fully answer that question"
- Cite which document(s) the information comes from in your answer
- Structure your response clearly with proper paragraphs
- Be educational and concise
- Use bullet points or numbered lists when appropriate

---CONTEXT FROM STUDENT'S DOCUMENTS---
${context}

---STUDENT'S QUESTION---
${question}

---INSTRUCTIONS---
Provide a well-structured, clear answer based on the context above. Start directly with the answer without preamble.`;

    // Call Gemini API (FREE tier available)
    let answer;
    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      answer = response.text();
      
      // Log success for debugging
      console.log('✅ Gemini LLM response generated successfully');
    } catch (geminiErr) {
      console.error('❌ Gemini API error:', geminiErr.message);
      // Fallback to structured context if API fails
      answer = `I encountered an issue generating a response. Here's what I found in your documents:\n\n${chunks.slice(0, 2).map((c, i) => `**From ${metadatas[i].fileName}:**\n${c}\n`).join('\n')}\n\n*Note: Please check that your Gemini API key is valid and has quota available.*`;
    }

    // Extract unique sources
    const sources = [...new Set(metadatas.map(m => m.fileName))];

    return {
      answer: answer,
      sources: sources,
      chunks: chunks.length
    };

  } catch (err) {
    console.error('RAG query error:', err);
    throw err;
  }
}

/**
 * Delete user's document chunks
 */
async function deleteDocumentChunks(userId, fileName) {
  const collection = await initChroma();
  
  try {
    // Get all chunks for this document using $and operator
    const results = await collection.get({
      where: {
        $and: [
          { userId: { $eq: userId.toString() } },
          { fileName: { $eq: fileName } }
        ]
      }
    });

    // Delete them
    if (results.ids && results.ids.length > 0) {
      await collection.delete({
        ids: results.ids
      });
      console.log(`✅ Deleted ${results.ids.length} chunks for ${fileName}`);
      return results.ids.length;
    }
    
    console.log(`⚠️ No chunks found for ${fileName}`);
    return 0;
  } catch (err) {
    console.error('❌ Delete error:', err.message);
    throw err;
  }
}

module.exports = {
  initChroma,
  generateEmbedding,
  chunkText,
  ingestDocument,
  ragQuery,
  deleteDocumentChunks
};
