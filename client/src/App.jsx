import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Overlay from './pages/Overlay';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/overlay" element={<Overlay />} />
        <Route path="/auth-callback" element={<AuthCallback />} /> {/* <--- 2. AGREGAR RUTA */}
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;