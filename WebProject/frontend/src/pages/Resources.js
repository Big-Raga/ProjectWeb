import React from 'react';
import '../styles/Resources.css';

const Resources = () => {
  return (
    <div className="resources-container">
      <h2 className="resources-title">Course Resources</h2>
      <div className="resources-grid">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="resource-card">
            <h4 className="resource-title">CS101 Syllabus.pdf</h4>
            <p className="resource-description">Introduction to Computer Science course outline.</p>
            <button className="btn btn-outline resource-download-btn">Download</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Resources;
