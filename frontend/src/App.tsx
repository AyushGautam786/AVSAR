import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RecommendationsPage from './pages/InternshipRecommend'
import InternshipsPage from './pages/InternshipPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ResumeTailorPage from './pages/ResumeTailorPage';
import TermsPage from './pages/TermsPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/internships" element={<InternshipsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/resume-tailor" element={<ResumeTailorPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;