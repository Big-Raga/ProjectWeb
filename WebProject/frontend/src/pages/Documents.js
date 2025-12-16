import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Notification from '../components/Notification';
import { useNotification } from '../hooks';
import '../styles/Documents.css';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { notification, showNotification, clearNotification } = useNotification();
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents/list');
      setDocuments(res.data);
    } catch (err) {
      showNotification(err.response?.data?.msg || 'Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Only PDF and TXT files are allowed', 'error');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('File size must be less than 10MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);

    try {
      setUploading(true);
      const res = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showNotification(`${res.data.document.originalName} uploaded successfully!`, 'success');
      await loadDocuments();
    } catch (err) {
      showNotification(err.response?.data?.msg || 'Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Delete "${docName}"?`)) return;

    try {
      await api.delete(`/documents/${docId}`);
      showNotification('Document deleted successfully', 'success');
      await loadDocuments();
    } catch (err) {
      showNotification(err.response?.data?.msg || 'Failed to delete document', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') return '📄';
    if (fileType === 'text/plain') return '📝';
    return '📎';
  };

  return (
    <div className="documents-page">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={clearNotification} 
        />
      )}

      <div className="documents-container">
        <div className="documents-header">
          <h1 className="documents-title">My Documents</h1>
          <p className="documents-subtitle">
            Upload your course materials, syllabi, and assignments for AI-powered assistance
          </p>
        </div>

        {/* Upload Area */}
        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-icon">📁</div>
          <h3 className="upload-title">
            {uploading ? 'Uploading...' : 'Upload Document'}
          </h3>
          <p className="upload-text">
            Drag and drop your file here, or
          </p>
          <label htmlFor="file-upload" className="upload-btn-wrapper">
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            <button 
              className="btn btn-primary upload-btn"
              disabled={uploading}
              onClick={() => document.getElementById('file-upload').click()}
            >
              {uploading ? 'Processing...' : 'Browse Files'}
            </button>
          </label>
          <p className="upload-note">Supported formats: PDF, TXT (max 10MB)</p>
        </div>

        {/* Documents List */}
        <div className="documents-list-section">
          <h2 className="list-title">Your Documents ({documents.length})</h2>
          
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No documents yet</h3>
              <p>Upload your first document to get started with AI assistance</p>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map((doc) => (
                <div key={doc._id} className="document-card">
                  <div className="document-icon">{getFileIcon(doc.fileType)}</div>
                  <div className="document-info">
                    <h3 className="document-name" title={doc.originalName}>
                      {doc.originalName}
                    </h3>
                    <div className="document-meta">
                      <span className="document-size">{formatFileSize(doc.fileSize)}</span>
                      <span className="document-separator">•</span>
                      <span className="document-date">{formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(doc._id, doc.originalName)}
                    title="Delete document"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
