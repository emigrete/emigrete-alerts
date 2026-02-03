import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Overlay from './pages/Overlay';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import TTSPage from './pages/TTS';
import Pricing from './pages/Pricing';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/overlay" element={<Overlay />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/tts" element={<TTSPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
