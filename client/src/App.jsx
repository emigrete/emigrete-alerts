import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useContext } from 'react';
import Overlay from './pages/Overlay';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import TTSPage from './pages/TTS';
import Pricing from './pages/Pricing';
import { AdminDashboard } from './pages/AdminDashboard';
import CreatorDashboard from './pages/CreatorDashboard';
import { LoadingProvider, LoadingContext } from './contexts/LoadingContext';
import { LoadingScreen } from './components/LoadingScreen';

function AppContent() {
  const { isLoading } = useContext(LoadingContext);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-dark-bg z-50 flex items-center justify-center">
          <LoadingScreen fullPage={false} />
        </div>
      )}
      <Routes>
        <Route path="/overlay" element={<Overlay />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/tts" element={<TTSPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/creator" element={<CreatorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LoadingProvider>
        <AppContent />
      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;
