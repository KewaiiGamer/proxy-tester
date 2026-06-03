import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TestProvider } from './context/TestContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Lists from './pages/Lists';
import Test from './pages/Test';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <TestProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lists" element={<Lists />} />
            <Route path="/test" element={<Test />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </TestProvider>
    </BrowserRouter>
  );
}

export default App;
