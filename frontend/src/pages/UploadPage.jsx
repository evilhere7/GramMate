import React, { useState } from 'react';
import styled from 'styled-components';

const UploadContainer = styled.div`
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #FF6B35;
    background-color: #222;
  }

  &::placeholder {
    color: #666;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #FF6B35;
    background-color: #222;
  }

  &::placeholder {
    color: #666;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #FF6B35;
  }

  option {
    background-color: #1a1a1a;
    color: #fff;
  }
`;

const FileUploadBox = styled.div`
  border: 2px dashed #333;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  background-color: #0a0a0a;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #FF6B35;
    background-color: #111;
  }

  input[type="file"] {
    display: none;
  }

  p {
    color: #888;
    margin: 0;
    font-size: 14px;
  }

  .upload-icon {
    font-size: 40px;
    margin-bottom: 10px;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: #1a1a1a;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 10px;

  .progress {
    height: 100%;
    background-color: #FF6B35;
    transition: width 0.3s;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #FF6B35;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: #e55a2a;
  }

  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  background-color: #1a3a1a;
  color: #88ff88;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
`;

const ErrorMessage = styled.div`
  background-color: #3d1700;
  color: #ff9999;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
`;

function UploadPage({ token }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'entertainment',
    hashtags: ''
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setError('');
      
      // Generate preview
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
    } else {
      setError('Please select a valid video file');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDragDropUpload = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files && files[0]) {
      const fakeEvent = { target: { files: files } };
      handleFileSelect(fakeEvent);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a video title');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');
    setSuccess('');

    try {
      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('hashtags', formData.hashtags);

      // Simulate progress (in production, use XMLHttpRequest for real progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 30;
          return next > 90 ? 90 : next;
        });
      }, 300);

      const response = await fetch(
        'http://localhost:8000/videos/upload',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadFormData
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Video "${data.title}" uploaded successfully! Video ID: ${data.id}`);
        
        // Reset form
        setSelectedFile(null);
        setFilePreview(null);
        setFormData({
          title: '',
          description: '',
          category: 'entertainment',
          hashtags: ''
        });
        setProgress(0);
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Upload failed');
      }
    } catch (err) {
      setError(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <UploadContainer>
      <h2 style={{ color: '#fff', marginBottom: '30px' }}>Upload Video</h2>

      {success && <SuccessMessage>{success}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <form onSubmit={handleSubmit}>
        {/* File Upload */}
        <FormGroup>
          <Label>Video File</Label>
          <FileUploadBox
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDragDropUpload}
            onClick={() => document.getElementById('file-input').click()}
          >
            <div className="upload-icon">📹</div>
            <p>
              {selectedFile 
                ? selectedFile.name 
                : 'Drag and drop your video here\nor click to select'}
            </p>
            <input
              id="file-input"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
            />
          </FileUploadBox>
          {selectedFile && (
            <>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </div>
              <ProgressBar>
                <div className="progress" style={{ width: `${progress}%` }}></div>
              </ProgressBar>
            </>
          )}
        </FormGroup>

        {/* Title */}
        <FormGroup>
          <Label htmlFor="title">Video Title *</Label>
          <Input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter an engaging title"
            maxLength="100"
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {formData.title.length}/100
          </div>
        </FormGroup>

        {/* Description */}
        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Tell viewers what your video is about (optional)"
            maxLength="500"
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {formData.description.length}/500
          </div>
        </FormGroup>

        {/* Category */}
        <FormGroup>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="entertainment">Entertainment</option>
            <option value="music">Music</option>
            <option value="dance">Dance</option>
            <option value="comedy">Comedy</option>
            <option value="education">Education</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="sports">Sports</option>
            <option value="gaming">Gaming</option>
            <option value="other">Other</option>
          </Select>
        </FormGroup>

        {/* Hashtags */}
        <FormGroup>
          <Label htmlFor="hashtags">Hashtags</Label>
          <Input
            id="hashtags"
            type="text"
            name="hashtags"
            value={formData.hashtags}
            onChange={handleInputChange}
            placeholder="Separate with spaces: #trending #viral #fyp"
          />
        </FormGroup>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={uploading || !selectedFile}
        >
          {uploading ? `Uploading... ${Math.round(progress)}%` : 'Upload Video'}
        </Button>
      </form>

      {/* Tips Section */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#0a0a0a', borderRadius: '8px' }}>
        <h3 style={{ color: '#FF6B35', marginTop: 0 }}>💡 Upload Tips</h3>
        <ul style={{ color: '#888', fontSize: '14px', lineHeight: '1.6' }}>
          <li>Keep videos between 15 seconds and 10 minutes</li>
          <li>Use clear, vibrant titles to attract viewers</li>
          <li>Add relevant hashtags to increase discoverability</li>
          <li>Higher engagement = higher rewards for you</li>
          <li>Vertical format (9:16) works best for mobile</li>
        </ul>
      </div>
    </UploadContainer>
  );
}

export default UploadPage;
