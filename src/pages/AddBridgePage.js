import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Heading,
  SimpleGrid,
  Select,
  Divider,
  VStack,
  HStack,
  Text,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  FormHelperText,
  Flex,
  Icon,
  useColorModeValue,
  Progress,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaCloudUploadAlt, FaInfoCircle } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { addBridge, uploadImage, getImageUrl } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';

// Correction pour les icônes de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Composant pour gérer les événements de sélection sur la carte
function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? (
    <Marker
      position={position}
      interactive={false}
    />
  ) : null;
}

const AddBridgePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    region: '',
    description: '',
    latitude: null,
    longitude: null,
    rain_protection: false,
    nearby_toilets: false,
    toilets_distance: null,
    drinking_water: false,
    water_distance: null,
    security_level: 'medium',
    lighting: false,
    traffic_level: 'medium',
    noise_level: 'medium',
    view_quality: 'average',
  });
  
  const [position, setPosition] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [bridgeImages, setBridgeImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Obtenir la position de l'utilisateur
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          // Position par défaut (Paris)
          setUserLocation({ lat: 48.8566, lng: 2.3522 });
        }
      );
    } else {
      // Position par défaut (Paris)
      setUserLocation({ lat: 48.8566, lng: 2.3522 });
    }
  }, []);

  // Mettre à jour les coordonnées du pont lorsque la position est modifiée
  useEffect(() => {
    if (position) {
      setFormData({
        ...formData,
        latitude: position.lat,
        longitude: position.lng,
      });
    }
  }, [position]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleRadioChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNumberChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value === '' ? null : Number(value),
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setBridgeImages(files);

    // Créer des prévisualisations des images
    const previews = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target.result);
        setImagePreview([...previews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const isFormValid = () => {
    const requiredFields = ['name', 'city', 'latitude', 'longitude'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Veuillez remplir tous les champs obligatoires (nom, ville et position sur la carte).',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    setProgress(10);
    
    try {
      // Uploader les images
      const imageUrls = [];
      if (bridgeImages.length > 0) {
        const totalImages = bridgeImages.length;
        let uploadedCount = 0;
        
        for (const file of bridgeImages) {
          const path = `bridges/${Date.now()}_${file.name}`;
          await uploadImage(file, path);
          const url = getImageUrl(path);
          imageUrls.push(url);
          
          uploadedCount++;
          setProgress(10 + Math.floor((uploadedCount / totalImages) * 40));
        }
      }
      
      setProgress(60);

      // Créer l'objet de données du pont
      const bridgeData = {
        ...formData,
        images: imageUrls,
        created_by: user.id,
        created_at: new Date().toISOString(),
        average_rating: 0,
        average_hygiene: 0,
        average_discretion: 0,
        average_accessibility: 0,
        ratings_count: 0,
      };

      setProgress(80);
      
      // Ajouter le pont à la base de données
      const [newBridge] = await addBridge(bridgeData);
      
      setProgress(100);
      
      toast({
        title: 'Pont ajouté avec succès!',
        description: 'Merci pour votre contribution à la communauté "Le Bon Pont".',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Rediriger vers la page de détail du pont
      navigate(`/bridge/${newBridge.id}`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du pont:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur s\'est produite lors de l\'ajout du pont.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <Heading as="h1" mb={6} color="brand.600">
        Ajouter un nouveau pont
      </Heading>
      
      <Text mb={6} color="gray.600">
        Contribuez à la communauté en ajoutant un pont que vous avez découvert. 
        Les informations que vous fournissez aideront d'autres personnes à trouver un abri.
      </Text>
      
      {isSubmitting && (
        <Box mb={6}>
          <Text mb={2}>Envoi en cours... {progress}%</Text>
          <Progress value={progress} size="md" colorScheme="brand" borderRadius="md" />
        </Box>
      )}
      
      <Box as="form" onSubmit={handleSubmit}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
          {/* Informations de base */}
          <Box>
            <VStack 
              spacing={6} 
              align="stretch" 
              p={6} 
              bg={useColorModeValue('white', 'gray.700')} 
              borderRadius="lg" 
              boxShadow="base"
            >
              <Heading as="h2" size="md">
                Informations de base
              </Heading>
              
              <FormControl isRequired>
                <FormLabel>Nom du pont</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Pont des Arts"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Adresse</FormLabel>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Ex: Quai de Conti"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Ville</FormLabel>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Ex: Paris"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Région</FormLabel>
                <Input
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  placeholder="Ex: Île-de-France"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Décrivez ce pont et les conditions d'abri qu'il offre..."
                  minH="120px"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Photos du pont</FormLabel>
                <Flex
                  justify="center"
                  align="center"
                  p={5}
                  border="2px dashed"
                  borderColor="gray.300"
                  borderRadius="md"
                  direction="column"
                  transition="all 0.3s"
                  _hover={{ borderColor: 'brand.500' }}
                  mb={4}
                >
                  <Icon as={FaCloudUploadAlt} w={10} h={10} color="gray.400" mb={2} />
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    opacity="0"
                    position="absolute"
                    top="0"
                    left="0"
                    width="100%"
                    height="100%"
                    cursor="pointer"
                  />
                  <Text>Cliquez ou glissez des images ici</Text>
                  <Text fontSize="sm" color="gray.500">
                    Ajoutez des photos pour aider les autres utilisateurs
                  </Text>
                </Flex>
                
                {imagePreview.length > 0 && (
                  <SimpleGrid columns={3} spacing={2}>
                    {imagePreview.map((img, index) => (
                      <Box
                        key={index}
                        height="100px"
                        borderRadius="md"
                        overflow="hidden"
                        bg="gray.100"
                      >
                        <img
                          src={img}
                          alt={`Preview ${index}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </FormControl>
            </VStack>
          </Box>
          
          {/* Carte et position */}
          <Box>
            <VStack 
              spacing={6} 
              align="stretch" 
              p={6} 
              bg={useColorModeValue('white', 'gray.700')} 
              borderRadius="lg" 
              boxShadow="base"
              mb={6}
            >
              <Heading as="h2" size="md">
                Position du pont (cliquez sur la carte)
              </Heading>
              
              <FormControl isRequired>
                <Box
                  height="400px"
                  borderRadius="md"
                  overflow="hidden"
                  boxShadow="sm"
                >
                  {userLocation && (
                    <MapContainer
                      center={[userLocation.lat, userLocation.lng]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>
                  )}
                </Box>
                <Flex mt={2} justifyContent="space-between">
                  <Text fontSize="sm" color="gray.500" display="flex" alignItems="center">
                    <Icon as={FaInfoCircle} mr={1} />
                    Cliquez sur la carte pour définir la position exacte
                  </Text>
                  {position && (
                    <Text fontSize="sm" fontWeight="medium">
                      Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                    </Text>
                  )}
                </Flex>
              </FormControl>
            </VStack>
            
            {/* Informations pratiques */}
            <VStack 
              spacing={6} 
              align="stretch" 
              p={6} 
              bg={useColorModeValue('white', 'gray.700')} 
              borderRadius="lg" 
              boxShadow="base"
            >
              <Heading as="h2" size="md">
                Informations pratiques
              </Heading>
              
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                <FormControl>
                  <Checkbox
                    name="rain_protection"
                    isChecked={formData.rain_protection}
                    onChange={handleInputChange}
                  >
                    Protection contre la pluie
                  </Checkbox>
                </FormControl>
                
                <FormControl>
                  <Checkbox
                    name="lighting"
                    isChecked={formData.lighting}
                    onChange={handleInputChange}
                  >
                    Éclairage
                  </Checkbox>
                </FormControl>
              </SimpleGrid>
              
              <Divider />
              
              <HStack align="start" spacing={6}>
                <FormControl>
                  <Checkbox
                    name="nearby_toilets"
                    isChecked={formData.nearby_toilets}
                    onChange={handleInputChange}
                  >
                    Toilettes à proximité
                  </Checkbox>
                  {formData.nearby_toilets && (
                    <NumberInput
                      mt={2}
                      min={1}
                      onChange={(value) => handleNumberChange('toilets_distance', value)}
                      value={formData.toilets_distance || ''}
                    >
                      <NumberInputField placeholder="Distance (mètres)" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  )}
                </FormControl>
                
                <FormControl>
                  <Checkbox
                    name="drinking_water"
                    isChecked={formData.drinking_water}
                    onChange={handleInputChange}
                  >
                    Eau potable à proximité
                  </Checkbox>
                  {formData.drinking_water && (
                    <NumberInput
                      mt={2}
                      min={1}
                      onChange={(value) => handleNumberChange('water_distance', value)}
                      value={formData.water_distance || ''}
                    >
                      <NumberInputField placeholder="Distance (mètres)" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  )}
                </FormControl>
              </HStack>
              
              <Divider />
              
              <FormControl>
                <FormLabel>Niveau de sécurité</FormLabel>
                <RadioGroup
                  value={formData.security_level}
                  onChange={(value) => handleRadioChange('security_level', value)}
                >
                  <Stack direction="row" spacing={5}>
                    <Radio value="low">Faible</Radio>
                    <Radio value="medium">Moyen</Radio>
                    <Radio value="high">Élevé</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
              
              <FormControl>
                <FormLabel>Niveau de circulation</FormLabel>
                <RadioGroup
                  value={formData.traffic_level}
                  onChange={(value) => handleRadioChange('traffic_level', value)}
                >
                  <Stack direction="row" spacing={5}>
                    <Radio value="low">Faible</Radio>
                    <Radio value="medium">Moyen</Radio>
                    <Radio value="high">Élevé</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
              
              <FormControl>
                <FormLabel>Niveau sonore</FormLabel>
                <RadioGroup
                  value={formData.noise_level}
                  onChange={(value) => handleRadioChange('noise_level', value)}
                >
                  <Stack direction="row" spacing={5}>
                    <Radio value="low">Faible</Radio>
                    <Radio value="medium">Moyen</Radio>
                    <Radio value="high">Élevé</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
              
              <FormControl>
                <FormLabel>Qualité de la vue</FormLabel>
                <RadioGroup
                  value={formData.view_quality}
                  onChange={(value) => handleRadioChange('view_quality', value)}
                >
                  <Stack direction="row" spacing={5}>
                    <Radio value="poor">Médiocre</Radio>
                    <Radio value="average">Moyenne</Radio>
                    <Radio value="good">Belle</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
            </VStack>
          </Box>
        </SimpleGrid>
        
        <Flex justify="center" mt={10}>
          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            leftIcon={<Icon as={FaMapMarkerAlt} />}
            isLoading={isSubmitting}
            loadingText="Envoi en cours..."
            isDisabled={!isFormValid() || isSubmitting}
          >
            Ajouter ce pont
          </Button>
        </Flex>
      </Box>
    </Container>
  );
};

export default AddBridgePage;
