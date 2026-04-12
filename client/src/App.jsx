import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import TextChat from './pages/TextChat';
import VideoChat from './pages/VideoChat';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Pricing from './pages/Pricing';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/text" element={<TextChat />} />
          <Route path="/video" element={<VideoChat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
