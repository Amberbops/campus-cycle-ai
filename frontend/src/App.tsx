import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './pages/LandingPage';
import { ScanPage } from './pages/ScanPage';
import { AdminPage } from './pages/AdminPage';
import { DemandPage } from './pages/DemandPage';
import { MyItemsPage } from './pages/MyItemsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/demand" element={<DemandPage />} />
          <Route path="/items" element={<MyItemsPage />} />
          <Route path="/my-items" element={<MyItemsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
