import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Button,
  Avatar,
  Flex,
  Badge,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Alert,
  AlertIcon,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  IconButton,
} from '@chakra-ui/react';
import { FaEdit, FaMapMarkerAlt, FaStar, FaComment, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, signOut } from '../api/supabase';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userBridges, setUserBridges] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    fullName: '',
  });

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Récupérer les ponts ajoutés par l'utilisateur
        const { data: bridges, error: bridgesError } = await supabase
          .from('bridges')
          .select('*')
          .eq('created_by', user.id);

        if (bridgesError) throw bridgesError;
        setUserBridges(bridges || []);

        // Récupérer les commentaires de l'utilisateur
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select('*, bridges(id, name)')
          .eq('user_id', user.id);

        if (commentsError) throw commentsError;
        setUserComments(comments || []);

        // Récupérer les évaluations de l'utilisateur
        const { data: ratings, error: ratingsError } = await supabase
          .from('ratings')
          .select('*, bridges(id, name)')
          .eq('user_id', user.id);

        if (ratingsError) throw ratingsError;
        setUserRatings(ratings || []);

        // Récupérer les données du profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileError && profile) {
          setUserData({
            username: profile.username || '',
            fullName: profile.full_name || '',
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger vos données.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, toast]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de vous déconnecter.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: userData.username,
          full_name: userData.fullName,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées avec succès.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour votre profil.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!user) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="warning">
          <AlertIcon />
          Vous devez être connecté pour accéder à cette page.
        </Alert>
        <Button as={RouterLink} to="/login" colorScheme="brand" mt={4}>
          Se connecter
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      <Box>
        <Flex direction={{ base: 'column', md: 'row' }} align="start" justify="space-between" mb={8}>
          {/* En-tête du profil */}
          <Flex align="center" mb={{ base: 4, md: 0 }}>
            <Avatar
              size="xl"
              name={userData.fullName || user.email}
              src=""
              mr={5}
            />
            <Box>
              <Heading size="lg">
                {userData.username || userData.fullName || user.email.split('@')[0]}
              </Heading>
              <Text color="gray.600">{user.email}</Text>
              <Badge colorScheme="brand" mt={2}>
                {userBridges.length} ponts ajoutés
              </Badge>
            </Box>
          </Flex>

          <Stack direction="row" spacing={4}>
            <Button
              leftIcon={<FaEdit />}
              colorScheme="brand"
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Annuler' : 'Modifier le profil'}
            </Button>
            <Button
              leftIcon={<FaSignOutAlt />}
              colorScheme="red"
              variant="outline"
              onClick={handleLogout}
            >
              Déconnexion
            </Button>
          </Stack>
        </Flex>

        {/* Formulaire d'édition du profil */}
        {isEditing && (
          <Box
            p={5}
            mb={8}
            bg={useColorModeValue('white', 'gray.700')}
            borderRadius="lg"
            boxShadow="md"
          >
            <Heading size="md" mb={4}>Modifier mon profil</Heading>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Nom d'utilisateur</FormLabel>
                <Input
                  name="username"
                  value={userData.username}
                  onChange={handleInputChange}
                  placeholder="Nom d'utilisateur"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Nom complet</FormLabel>
                <Input
                  name="fullName"
                  value={userData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nom complet"
                />
              </FormControl>
              <Button
                colorScheme="brand"
                onClick={handleSaveProfile}
              >
                Enregistrer les modifications
              </Button>
            </Stack>
          </Box>
        )}

        {/* Statistiques de l'utilisateur */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={8}>
          <Stat
            px={4}
            py={3}
            shadow="base"
            borderColor="gray.200"
            rounded="lg"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">Ponts ajoutés</StatLabel>
            <StatNumber fontSize="3xl">{userBridges.length}</StatNumber>
          </Stat>
          <Stat
            px={4}
            py={3}
            shadow="base"
            borderColor="gray.200"
            rounded="lg"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">Commentaires</StatLabel>
            <StatNumber fontSize="3xl">{userComments.length}</StatNumber>
          </Stat>
          <Stat
            px={4}
            py={3}
            shadow="base"
            borderColor="gray.200"
            rounded="lg"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">Évaluations</StatLabel>
            <StatNumber fontSize="3xl">{userRatings.length}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Onglets pour les différentes activités */}
        <Tabs colorScheme="brand" variant="enclosed" isLazy>
          <TabList>
            <Tab>Mes ponts</Tab>
            <Tab>Mes commentaires</Tab>
            <Tab>Mes évaluations</Tab>
          </TabList>

          <TabPanels bg={useColorModeValue('white', 'gray.700')} borderRadius="lg" mt={2}>
            {/* Onglet des ponts ajoutés */}
            <TabPanel>
              {userBridges.length === 0 ? (
                <Text textAlign="center" py={4}>
                  Vous n'avez pas encore ajouté de pont.
                </Text>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                  {userBridges.map((bridge) => (
                    <Card key={bridge.id} boxShadow="md" borderRadius="lg">
                      <CardHeader>
                        <Heading size="md">{bridge.name}</Heading>
                        <Text color="gray.500" fontSize="sm">
                          {bridge.city}, {bridge.region}
                        </Text>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text noOfLines={2} mb={3}>
                          {bridge.description || 'Aucune description'}
                        </Text>
                        <Flex justify="space-between" align="center">
                          <Badge colorScheme={
                            !bridge.average_rating ? 'gray' :
                            bridge.average_rating < 2 ? 'red' :
                            bridge.average_rating < 3.5 ? 'yellow' :
                            'green'
                          }>
                            {bridge.average_rating ? `${bridge.average_rating.toFixed(1)}/5` : 'Non évalué'}
                          </Badge>
                          <Button
                            as={RouterLink}
                            to={`/bridge/${bridge.id}`}
                            size="sm"
                            colorScheme="brand"
                            leftIcon={<FaMapMarkerAlt />}
                          >
                            Voir
                          </Button>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* Onglet des commentaires */}
            <TabPanel>
              {userComments.length === 0 ? (
                <Text textAlign="center" py={4}>
                  Vous n'avez pas encore publié de commentaire.
                </Text>
              ) : (
                <Stack spacing={4}>
                  {userComments.map((comment) => (
                    <Box
                      key={comment.id}
                      p={4}
                      borderRadius="md"
                      boxShadow="sm"
                      borderWidth="1px"
                    >
                      <Flex justify="space-between" mb={2}>
                        <Text fontWeight="bold">
                          <RouterLink to={`/bridge/${comment.bridge_id}`}>
                            {comment.bridges?.name || 'Pont inconnu'}
                          </RouterLink>
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </Text>
                      </Flex>
                      <Text>{comment.content}</Text>
                      
                      {comment.images && comment.images.length > 0 && (
                        <Text fontSize="sm" color="gray.500" mt={2}>
                          {comment.images.length} image(s) jointe(s)
                        </Text>
                      )}
                      
                      <Button
                        as={RouterLink}
                        to={`/bridge/${comment.bridge_id}`}
                        size="sm"
                        colorScheme="brand"
                        variant="outline"
                        mt={3}
                        leftIcon={<FaComment />}
                      >
                        Voir le pont
                      </Button>
                    </Box>
                  ))}
                </Stack>
              )}
            </TabPanel>

            {/* Onglet des évaluations */}
            <TabPanel>
              {userRatings.length === 0 ? (
                <Text textAlign="center" py={4}>
                  Vous n'avez pas encore évalué de pont.
                </Text>
              ) : (
                <Stack spacing={4}>
                  {userRatings.map((rating) => (
                    <Box
                      key={rating.id}
                      p={4}
                      borderRadius="md"
                      boxShadow="sm"
                      borderWidth="1px"
                    >
                      <Flex justify="space-between" mb={3}>
                        <Text fontWeight="bold">
                          <RouterLink to={`/bridge/${rating.bridge_id}`}>
                            {rating.bridges?.name || 'Pont inconnu'}
                          </RouterLink>
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </Text>
                      </Flex>
                      
                      <SimpleGrid columns={3} spacing={4}>
                        <Box>
                          <Text fontSize="sm" color="gray.500">Hygiène</Text>
                          <Flex align="center">
                            <Badge colorScheme={
                              rating.hygiene < 2 ? 'red' :
                              rating.hygiene < 4 ? 'yellow' :
                              'green'
                            } mr={2}>
                              {rating.hygiene}/5
                            </Badge>
                            {Array(5)
                              .fill('')
                              .map((_, i) => (
                                <Box
                                  key={i}
                                  color={i < rating.hygiene ? 'yellow.400' : 'gray.300'}
                                  as={FaStar}
                                  size="14px"
                                />
                              ))}
                          </Flex>
                        </Box>
                        
                        <Box>
                          <Text fontSize="sm" color="gray.500">Discrétion</Text>
                          <Flex align="center">
                            <Badge colorScheme={
                              rating.discretion < 2 ? 'red' :
                              rating.discretion < 4 ? 'yellow' :
                              'green'
                            } mr={2}>
                              {rating.discretion}/5
                            </Badge>
                            {Array(5)
                              .fill('')
                              .map((_, i) => (
                                <Box
                                  key={i}
                                  color={i < rating.discretion ? 'yellow.400' : 'gray.300'}
                                  as={FaStar}
                                  size="14px"
                                />
                              ))}
                          </Flex>
                        </Box>
                        
                        <Box>
                          <Text fontSize="sm" color="gray.500">Accessibilité</Text>
                          <Flex align="center">
                            <Badge colorScheme={
                              rating.accessibility < 2 ? 'red' :
                              rating.accessibility < 4 ? 'yellow' :
                              'green'
                            } mr={2}>
                              {rating.accessibility}/5
                            </Badge>
                            {Array(5)
                              .fill('')
                              .map((_, i) => (
                                <Box
                                  key={i}
                                  color={i < rating.accessibility ? 'yellow.400' : 'gray.300'}
                                  as={FaStar}
                                  size="14px"
                                />
                              ))}
                          </Flex>
                        </Box>
                      </SimpleGrid>
                      
                      <Button
                        as={RouterLink}
                        to={`/bridge/${rating.bridge_id}`}
                        size="sm"
                        colorScheme="brand"
                        variant="outline"
                        mt={3}
                        leftIcon={<FaMapMarkerAlt />}
                      >
                        Voir le pont
                      </Button>
                    </Box>
                  ))}
                </Stack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default ProfilePage;
