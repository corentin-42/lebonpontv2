import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Context
import { AuthProvider } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import BridgeDetailsPage from './pages/BridgeDetailsPage';
import AddBridgePage from './pages/AddBridgePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Theme personnalisé
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80caff',
      300: '#4db3ff',
      400: '#1a9dff',
      500: '#0087e6',
      600: '#0069b3',
      700: '#004c80',
      800: '#00304d',
      900: '#00131a',
    },
  },
  fonts: {
    heading: '"Poppins", sans-serif',
    body: '"Roboto", sans-serif',
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/bridge/:id" element={<BridgeDetailsPage />} />
            <Route 
              path="/add-bridge" 
              element={
                <ProtectedRoute>
                  <AddBridgePage />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
