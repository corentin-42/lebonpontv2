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
  Checkbox,
  Flex,
  FormHelperText,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { signUp } from '../api/supabase';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Rediriger si l'utilisateur est déjà connecté
  if (user) {
    navigate('/');
    return null;
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation des entrées
    if (!email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    if (!agreeTerms) {
      setError('Vous devez accepter les conditions d\'utilisation.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { error } = await signUp(email, password);
      
      if (error) throw error;
      
      setSuccessMessage('Inscription réussie! Veuillez vérifier votre email pour confirmer votre compte.');
      // Ne pas rediriger immédiatement, laisser l'utilisateur voir le message de succès
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      setError(
        error.message === 'User already registered'
          ? 'Cette adresse email est déjà utilisée. Veuillez vous connecter ou utiliser une autre adresse.'
          : 'Une erreur s\'est produite lors de l\'inscription. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="lg" py={{ base: 12, md: 24 }}>
      <Stack spacing={8}>
        <Stack align="center">
          <Heading fontSize="4xl" color="brand.600">Inscription</Heading>
          <Text fontSize="lg" color="gray.600">
            Rejoignez la communauté Le Bon Pont
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
          
          {successMessage && (
            <Alert status="success" mb={4} borderRadius="md">
              <AlertIcon />
              {successMessage}
            </Alert>
          )}
          
          <form onSubmit={handleRegister}>
            <Stack spacing={4}>
              <FormControl id="email" isRequired>
                <FormLabel>Adresse email</FormLabel>
                <Input
                  type="email"
                  placeholder="Votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  isDisabled={!!successMessage}
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
                    isDisabled={!!successMessage}
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
                <FormHelperText>Au moins 6 caractères</FormHelperText>
              </FormControl>
              
              <FormControl id="confirmPassword" isRequired>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    isDisabled={!!successMessage}
                  />
                  <InputRightElement>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <FormControl>
                <Checkbox
                  isChecked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  isDisabled={!!successMessage}
                >
                  J'accepte les conditions d'utilisation et la politique de confidentialité
                </Checkbox>
              </FormControl>
              
              <Stack spacing={10} pt={2}>
                <Button
                  type="submit"
                  loadingText="Inscription en cours..."
                  size="lg"
                  colorScheme="brand"
                  isLoading={isLoading}
                  isDisabled={!!successMessage}
                >
                  S'inscrire
                </Button>
              </Stack>
            </Stack>
          </form>
          
          {successMessage && (
            <Stack mt={6}>
              <Button onClick={() => navigate('/login')} colorScheme="brand" variant="outline">
                Aller à la page de connexion
              </Button>
            </Stack>
          )}
        </Box>
        
        <Flex justify="center">
          <Text align="center" mr={1}>
            Vous avez déjà un compte ?
          </Text>
          <Link as={RouterLink} to="/login" color="brand.500" fontWeight="bold">
            Connectez-vous
          </Link>
        </Flex>
      </Stack>
    </Container>
  );
};

export default RegisterPage;
