import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './routes/Landing';
import Builder from './routes/Builder';
import Workspace from './routes/Workspace';
import { ToastContainer } from './components';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/app" element={<Workspace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
