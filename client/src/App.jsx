import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import Overlay from './pages/Overlay';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import TTSPage from './pages/TTS';
import Pricing from './pages/Pricing';
import { AdminDashboard } from './pages/AdminDashboard';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorOverlay from './pages/CreatorOverlay';
import { LoadingProvider, LoadingContext } from './contexts/LoadingContext';
import { LoadingScreen } from './components/LoadingScreen';

function AppContent() {
  const { isLoading } = useContext(LoadingContext);
  const location = useLocation();

  // Agregar clase al root, html y body cuando está en overlay para que sean transparentes
  useEffect(() => {
    const root = document.getElementById('root');
    const html = document.documentElement;
    const body = document.body;
    
    if (location.pathname === '/overlay' || location.pathname === '/creator-overlay') {
      root?.classList.add('overlay-route');
      html.classList.add('overlay-route');
      body.classList.add('overlay-route');
    } else {
      root?.classList.remove('overlay-route');
      html.classList.remove('overlay-route');
      body.classList.remove('overlay-route');
    }
  }, [location.pathname]);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-dark-bg z-50 flex items-center justify-center">
          <LoadingScreen fullPage={false} />
        </div>
      )}
      <Routes>
        <Route path="/overlay" element={<Overlay />} />
        <Route path="/creator-overlay" element={<CreatorOverlay />} />
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
