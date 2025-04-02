import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  Button,
  Icon,
  Badge,
  Divider,
  Flex,
  Avatar,
  IconButton,
  Textarea,
  FormControl,
  FormLabel,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Skeleton,
  HStack,
  VStack,
  useColorModeValue,
  Image,
  Grid,
  GridItem,
  Progress,
} from '@chakra-ui/react';
import { 
  FaUmbrella, 
  FaToilet, 
  FaTint, 
  FaShieldAlt, 
  FaLightbulb, 
  FaCar, 
  FaStar, 
  FaWalking, 
  FaVolumeMute, 
  FaCheckCircle, 
  FaEye, 
  FaThumbsUp, 
  FaFlag, 
  FaMapMarkedAlt 
} from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getBridgeById, addComment, addRating, uploadImage, getImageUrl } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';

// Correction pour les icônes de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const BridgeRating = ({ title, value, icon }) => {
  return (
    <Box p={4} borderRadius="lg" bg={useColorModeValue('white', 'gray.700')} boxShadow="base">
      <Stack align="center" spacing={2}>
        <Icon as={icon} color="brand.500" boxSize={6} />
        <Text fontWeight="bold" fontSize="sm">{title}</Text>
        <Progress
          value={value * 20}
          size="sm"
          colorScheme={
            value < 2 ? 'red' : value < 3.5 ? 'yellow' : 'green'
          }
          w="full"
          borderRadius="full"
        />
        <Text fontSize="lg" fontWeight="bold">
          {value.toFixed(1)}/5
        </Text>
      </Stack>
    </Box>
  );
};

const BridgeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [bridge, setBridge] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentImages, setCommentImages] = useState([]);
  const [userRating, setUserRating] = useState({
    hygiene: 0,
    discretion: 0,
    accessibility: 0,
  });
  const [visitedStatus, setVisitedStatus] = useState(false);
  const [userfulStatus, setUserfulStatus] = useState(false);

  useEffect(() => {
    const fetchBridgeDetails = async () => {
      try {
        const bridgeData = await getBridgeById(id);
        setBridge(bridgeData);
        setComments(bridgeData.comments || []);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des détails du pont:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les détails du pont.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/map');
      }
    };

    fetchBridgeDetails();
  }, [id, navigate, toast]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setCommentImages(files);
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour laisser un commentaire.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Commentaire vide',
        description: 'Veuillez saisir un commentaire.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Uploader les images si présentes
      const imageUrls = [];
      if (commentImages.length > 0) {
        for (const file of commentImages) {
          const path = `${user.id}/${bridge.id}/${Date.now()}_${file.name}`;
          await uploadImage(file, path);
          const url = getImageUrl(path);
          imageUrls.push(url);
        }
      }

      const commentData = {
        bridge_id: bridge.id,
        user_id: user.id,
        user_email: user.email,
        content: newComment,
        images: imageUrls,
        created_at: new Date().toISOString(),
      };

      const [newCommentData] = await addComment(commentData);
      setComments([...comments, newCommentData]);
      setNewComment('');
      setCommentImages([]);

      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été ajouté avec succès.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter votre commentaire.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubmitRating = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour évaluer un pont.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
      return;
    }

    try {
      const ratingData = {
        bridge_id: bridge.id,
        user_id: user.id,
        hygiene: userRating.hygiene,
        discretion: userRating.discretion,
        accessibility: userRating.accessibility,
        created_at: new Date().toISOString(),
      };

      await addRating(ratingData);

      toast({
        title: 'Évaluation enregistrée',
        description: 'Votre évaluation a été enregistrée avec succès.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Mettre à jour les notes moyennes localement
      const newBridge = {...bridge};
      newBridge.average_hygiene = (bridge.average_hygiene * bridge.ratings_count + userRating.hygiene) / (bridge.ratings_count + 1);
      newBridge.average_discretion = (bridge.average_discretion * bridge.ratings_count + userRating.discretion) / (bridge.ratings_count + 1);
      newBridge.average_accessibility = (bridge.average_accessibility * bridge.ratings_count + userRating.accessibility) / (bridge.ratings_count + 1);
      newBridge.ratings_count += 1;
      setBridge(newBridge);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'évaluation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer votre évaluation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleVisitedClick = () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour marquer un pont comme visité.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
      return;
    }

    setVisitedStatus(!visitedStatus);
    toast({
      title: visitedStatus ? 'Visite annulée' : 'Pont marqué comme visité',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleUsefulClick = () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour marquer un pont comme utile.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
      return;
    }

    setUserfulStatus(!userfulStatus);
    toast({
      title: userfulStatus ? 'Marque d\'utilité retirée' : 'Pont marqué comme utile',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleReportClick = () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour signaler un pont.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
      return;
    }

    toast({
      title: 'Pont signalé',
      description: 'Merci pour votre signalement. Notre équipe va l\'examiner.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Container maxW="7xl" py={8}>
        <Stack spacing={6}>
          <Skeleton height="60px" />
          <Skeleton height="200px" />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </SimpleGrid>
        </Stack>
      </Container>
    );
  }

  if (!bridge) {
    return (
      <Container maxW="7xl" py={8}>
        <Heading>Pont non trouvé</Heading>
        <Text mt={4}>Ce pont n'existe pas ou a été supprimé.</Text>
        <Button mt={6} colorScheme="brand" onClick={() => navigate('/map')}>
          Retour à la carte
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      {/* En-tête */}
      <Box mb={6}>
        <Heading as="h1" size="2xl" mb={2} color="brand.600">
          {bridge.name}
        </Heading>
        <Flex alignItems="center" flexWrap="wrap" gap={2} mb={4}>
          <Icon as={FaMapMarkedAlt} color="gray.500" />
          <Text color="gray.600">{bridge.address}, {bridge.city}, {bridge.region}</Text>
        </Flex>

        <HStack spacing={4} mb={4}>
          <Badge colorScheme="brand" px={3} py={1} borderRadius="full">
            {bridge.ratings_count} évaluations
          </Badge>
          <Badge colorScheme={
            bridge.average_rating < 2 ? 'red' : 
            bridge.average_rating < 3.5 ? 'yellow' : 
            'green'
          } px={3} py={1} borderRadius="full">
            Note: {bridge.average_rating ? bridge.average_rating.toFixed(1) : '0'}/5
          </Badge>
        </HStack>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
          {/* Images du pont */}
          <GridItem>
            <Box
              borderRadius="lg"
              overflow="hidden"
              boxShadow="xl"
              bg="gray.100"
              h={{ base: "250px", md: "400px" }}
              position="relative"
            >
              {bridge.images && bridge.images.length > 0 ? (
                <Image
                  src={bridge.images[0]}
                  alt={bridge.name}
                  objectFit="cover"
                  w="100%"
                  h="100%"
                />
              ) : (
                <Flex
                  alignItems="center"
                  justifyContent="center"
                  h="100%"
                  bg="gray.100"
                >
                  <Text color="gray.500">Aucune image disponible</Text>
                </Flex>
              )}
            </Box>
            {bridge.images && bridge.images.length > 1 && (
              <SimpleGrid columns={4} spacing={2} mt={2}>
                {bridge.images.slice(1, 5).map((img, idx) => (
                  <Box
                    key={idx}
                    borderRadius="md"
                    overflow="hidden"
                    h="70px"
                    position="relative"
                  >
                    <Image
                      src={img}
                      alt={`${bridge.name} ${idx + 1}`}
                      objectFit="cover"
                      w="100%"
                      h="100%"
                    />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </GridItem>

          {/* Carte */}
          <GridItem>
            <Box
              borderRadius="lg"
              overflow="hidden"
              boxShadow="xl"
              h={{ base: "250px", md: "400px" }}
            >
              <MapContainer
                center={[bridge.latitude, bridge.longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[bridge.latitude, bridge.longitude]}>
                  <Popup>
                    <strong>{bridge.name}</strong>
                    <br />
                    {bridge.address}
                  </Popup>
                </Marker>
              </MapContainer>
            </Box>
          </GridItem>
        </Grid>
      </Box>

      {/* Actions rapides */}
      <Flex
        justify="space-between"
        p={4}
        bg={useColorModeValue('gray.50', 'gray.700')}
        borderRadius="lg"
        mb={6}
        flexWrap="wrap"
        gap={2}
      >
        <Button
          leftIcon={<Icon as={FaCheckCircle} />}
          colorScheme={visitedStatus ? 'green' : 'gray'}
          variant={visitedStatus ? 'solid' : 'outline'}
          onClick={handleVisitedClick}
        >
          J'y suis allé
        </Button>
        <Button
          leftIcon={<Icon as={FaThumbsUp} />}
          colorScheme={userfulStatus ? 'blue' : 'gray'}
          variant={userfulStatus ? 'solid' : 'outline'}
          onClick={handleUsefulClick}
        >
          Utile
        </Button>
        <Button
          leftIcon={<Icon as={FaFlag} />}
          colorScheme="red"
          variant="outline"
          onClick={handleReportClick}
        >
          Inapproprié
        </Button>
      </Flex>

      {/* Informations pratiques */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4}>
          Informations pratiques
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          <Stat
            px={4}
            py={3}
            borderRadius="lg"
            boxShadow="sm"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">
              <Flex alignItems="center">
                <Icon as={FaUmbrella} mr={2} color="brand.500" />
                Protection pluie
              </Flex>
            </StatLabel>
            <StatNumber fontSize="lg">
              {bridge.rain_protection ? 'Bonne' : 'Limitée'}
            </StatNumber>
          </Stat>

          <Stat
            px={4}
            py={3}
            borderRadius="lg"
            boxShadow="sm"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">
              <Flex alignItems="center">
                <Icon as={FaToilet} mr={2} color="brand.500" />
                Toilettes à proximité
              </Flex>
            </StatLabel>
            <StatNumber fontSize="lg">
              {bridge.nearby_toilets ? 'Oui' : 'Non'}
            </StatNumber>
            {bridge.toilets_distance && (
              <StatHelpText>
                {bridge.toilets_distance} mètres
              </StatHelpText>
            )}
          </Stat>

          <Stat
            px={4}
            py={3}
            borderRadius="lg"
            boxShadow="sm"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">
              <Flex alignItems="center">
                <Icon as={FaTint} mr={2} color="brand.500" />
                Eau potable
              </Flex>
            </StatLabel>
            <StatNumber fontSize="lg">
              {bridge.drinking_water ? 'Disponible' : 'Non disponible'}
            </StatNumber>
            {bridge.water_distance && (
              <StatHelpText>
                {bridge.water_distance} mètres
              </StatHelpText>
            )}
          </Stat>

          <Stat
            px={4}
            py={3}
            borderRadius="lg"
            boxShadow="sm"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">
              <Flex alignItems="center">
                <Icon as={FaShieldAlt} mr={2} color="brand.500" />
                Sécurité
              </Flex>
            </StatLabel>
            <StatNumber fontSize="lg">
              {bridge.security_level === 'high' ? 'Élevée' : 
               bridge.security_level === 'medium' ? 'Moyenne' : 'Faible'}
            </StatNumber>
          </Stat>

          <Stat
            px={4}
            py={3}
            borderRadius="lg"
            boxShadow="sm"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">
              <Flex alignItems="center">
                <Icon as={FaLightbulb} mr={2} color="brand.500" />
                Éclairage
              </Flex>
            </StatLabel>
            <StatNumber fontSize="lg">
              {bridge.lighting ? 'Présent' : 'Absent'}
            </StatNumber>
          </Stat>

          <Stat
            px={4}
            py={3}
            borderRadius="lg"
            boxShadow="sm"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">
              <Flex alignItems="center">
                <Icon as={FaCar} mr={2} color="brand.500" />
                Circulation
              </Flex>
            </StatLabel>
            <StatNumber fontSize="lg">
              {bridge.traffic_level === 'high' ? 'Dense' : 
               bridge.traffic_level === 'medium' ? 'Modérée' : 'Faible'}
            </StatNumber>
          </Stat>

          <Stat
            px={4}
            py={3}
            borderRadius="lg"
            boxShadow="sm"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">
              <Flex alignItems="center">
                <Icon as={FaVolumeMute} mr={2} color="brand.500" />
                Niveau sonore
              </Flex>
            </StatLabel>
            <StatNumber fontSize="lg">
              {bridge.noise_level === 'high' ? 'Élevé' : 
               bridge.noise_level === 'medium' ? 'Moyen' : 'Faible'}
            </StatNumber>
          </Stat>

          <Stat
            px={4}
            py={3}
            borderRadius="lg"
            boxShadow="sm"
            bg={useColorModeValue('white', 'gray.700')}
          >
            <StatLabel fontWeight="medium">
              <Flex alignItems="center">
                <Icon as={FaEye} mr={2} color="brand.500" />
                Vue
              </Flex>
            </StatLabel>
            <StatNumber fontSize="lg">
              {bridge.view_quality === 'good' ? 'Belle' : 
               bridge.view_quality === 'average' ? 'Moyenne' : 'Médiocre'}
            </StatNumber>
          </Stat>
        </SimpleGrid>
      </Box>

      {/* Notes */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4}>
          Évaluations
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
          <BridgeRating 
            title="Hygiène" 
            value={bridge.average_hygiene || 0} 
            icon={FaCheckCircle} 
          />
          <BridgeRating 
            title="Discrétion" 
            value={bridge.average_discretion || 0} 
            icon={FaEye} 
          />
          <BridgeRating 
            title="Accessibilité" 
            value={bridge.average_accessibility || 0} 
            icon={FaWalking} 
          />
        </SimpleGrid>

        {user && (
          <Box 
            p={6} 
            borderRadius="lg" 
            bg={useColorModeValue('white', 'gray.700')} 
            boxShadow="base"
            mb={6}
          >
            <Heading as="h3" size="md" mb={4}>
              Votre évaluation
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={4}>
              {['hygiene', 'discretion', 'accessibility'].map((criterion) => (
                <FormControl key={criterion}>
                  <FormLabel fontWeight="bold">
                    {criterion === 'hygiene' ? 'Hygiène' : 
                     criterion === 'discretion' ? 'Discrétion' : 'Accessibilité'}
                  </FormLabel>
                  <Flex>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IconButton
                        key={star}
                        icon={<FaStar />}
                        variant="ghost"
                        aria-label={`${star} stars`}
                        onClick={() => setUserRating({...userRating, [criterion]: star})}
                        color={star <= userRating[criterion] ? 'yellow.400' : 'gray.300'}
                        _hover={{ color: 'yellow.500' }}
                      />
                    ))}
                  </Flex>
                </FormControl>
              ))}
            </SimpleGrid>
            <Button 
              colorScheme="brand" 
              onClick={handleSubmitRating}
              isDisabled={!userRating.hygiene || !userRating.discretion || !userRating.accessibility}
            >
              Soumettre mon évaluation
            </Button>
          </Box>
        )}
      </Box>

      {/* Commentaires */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4}>
          Commentaires ({comments.length})
        </Heading>

        {/* Liste des commentaires */}
        <Stack spacing={4} mb={6}>
          {comments.length === 0 ? (
            <Box p={6} borderRadius="lg" bg={useColorModeValue('gray.50', 'gray.700')}>
              <Text textAlign="center">Aucun commentaire pour ce pont. Soyez le premier à partager votre expérience!</Text>
            </Box>
          ) : (
            comments.map((comment) => (
              <Box
                key={comment.id}
                p={5}
                borderRadius="lg"
                bg={useColorModeValue('white', 'gray.700')}
                boxShadow="base"
              >
                <Flex mb={3}>
                  <Avatar name={comment.user_email} size="sm" mr={2} />
                  <Box>
                    <Text fontWeight="bold">{comment.user_email}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </Text>
                  </Box>
                </Flex>
                <Text mb={3}>{comment.content}</Text>
                {comment.images && comment.images.length > 0 && (
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} mb={3}>
                    {comment.images.map((img, idx) => (
                      <Box
                        key={idx}
                        borderRadius="md"
                        overflow="hidden"
                        h="80px"
                        position="relative"
                      >
                        <Image
                          src={img}
                          alt={`Image ${idx + 1} du commentaire`}
                          objectFit="cover"
                          w="100%"
                          h="100%"
                        />
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            ))
          )}
        </Stack>

        {/* Formulaire de commentaire */}
        {user ? (
          <Box
            p={6}
            borderRadius="lg"
            bg={useColorModeValue('white', 'gray.700')}
            boxShadow="base"
          >
            <Heading as="h3" size="md" mb={4}>
              Ajouter un commentaire
            </Heading>
            <FormControl mb={4}>
              <Textarea
                placeholder="Partagez votre expérience sous ce pont..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                minH="100px"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Ajouter des photos</FormLabel>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ marginBottom: '10px' }}
              />
              {commentImages.length > 0 && (
                <Text fontSize="sm" color="gray.500">
                  {commentImages.length} image(s) sélectionnée(s)
                </Text>
              )}
            </FormControl>
            <Button colorScheme="brand" onClick={handleSubmitComment}>
              Publier mon commentaire
            </Button>
          </Box>
        ) : (
          <Box
            p={6}
            borderRadius="lg"
            bg={useColorModeValue('gray.50', 'gray.700')}
            textAlign="center"
          >
            <Text mb={4}>Connectez-vous pour ajouter un commentaire</Text>
            <Button
              as="a"
              href="/login"
              colorScheme="brand"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Se connecter
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default BridgeDetailsPage;
