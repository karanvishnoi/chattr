import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TextChat from './pages/TextChat';
import VideoChat from './pages/VideoChat';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/text" element={<TextChat />} />
        <Route path="/video" element={<VideoChat />} />
      </Routes>
    </BrowserRouter>
  );
}
