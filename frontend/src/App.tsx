import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './Navigation';
import Login from './Login';
import Register from './Register';

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<div className="container mt-5">Start projektu</div>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
