import React from 'react';
import { Box, Heading, Text, Button, Center, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Center minH="80vh">
      <VStack spacing={6} textAlign="center" p={8}>
        <Heading size="2xl">404</Heading>
        <Heading size="lg">Page non trouvée</Heading>
        <Text fontSize="lg">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </Text>
        <Button 
          colorScheme="blue" 
          size="lg" 
          onClick={() => navigate('/')}
        >
          Retour à l'accueil
        </Button>
      </VStack>
    </Center>
  );
};

export default NotFoundPage;
