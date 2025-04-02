import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Center, Spinner } from '@chakra-ui/react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Afficher le contenu de la route si l'utilisateur est connecté
  return children;
};

export default ProtectedRoute;
