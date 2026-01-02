import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './routes/Landing';
import Builder from './routes/Builder';
import { ToastContainer } from './components';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/builder" element={<Builder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
