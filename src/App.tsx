import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import { MainPage } from './pages/MainPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
      </Routes>
    </Router>
  );
}

export default App;
