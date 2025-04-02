import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Link,
  useColorModeValue,
  Alert,
  AlertIcon,
  InputGroup,
  InputRightElement,
  IconButton,
  Flex,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { signIn } from '../api/supabase';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Rediriger si l'utilisateur est déjà connecté
  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) throw error;
      
      // Redirection vers la page d'accueil après connexion réussie
      navigate('/');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError(
        error.message === 'Invalid login credentials'
          ? 'Identifiants invalides. Veuillez vérifier votre email et mot de passe.'
          : 'Une erreur s\'est produite lors de la connexion. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="lg" py={{ base: 12, md: 24 }}>
      <Stack spacing={8}>
        <Stack align="center">
          <Heading fontSize="4xl" color="brand.600">Connexion</Heading>
          <Text fontSize="lg" color="gray.600">
            Accédez à votre compte Le Bon Pont
          </Text>
        </Stack>
        <Box
          rounded="lg"
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow="lg"
          p={8}
        >
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleLogin}>
            <Stack spacing={4}>
              <FormControl id="email" isRequired>
                <FormLabel>Adresse email</FormLabel>
                <Input
                  type="email"
                  placeholder="Votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>
              
              <FormControl id="password" isRequired>
                <FormLabel>Mot de passe</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputRightElement>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <Stack spacing={10}>
                <Link color="brand.500" alignSelf="flex-end">
                  Mot de passe oublié ?
                </Link>
                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  isLoading={isLoading}
                  loadingText="Connexion en cours..."
                >
                  Se connecter
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
        
        <Flex justify="center">
          <Text align="center" mr={1}>
            Vous n'avez pas de compte ?
          </Text>
          <Link as={RouterLink} to="/register" color="brand.500" fontWeight="bold">
            Inscrivez-vous
          </Link>
        </Flex>
      </Stack>
    </Container>
  );
};

export default LoginPage;
