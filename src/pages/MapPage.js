import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/color-mode';
import { SearchIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaFilter } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllBridges } from '../api/supabase';
import L from 'leaflet';

// Correction pour les icônes de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapPage = () => {
  const [bridges, setBridges] = useState([]);
  const [filteredBridges, setFilteredBridges] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer la position de l'utilisateur
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          toast({
            title: 'Géolocalisation non disponible',
            description: 'Impossible de déterminer votre position actuelle.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          // Position par défaut (Paris)
          setUserLocation({ lat: 48.8566, lng: 2.3522 });
        }
      );
    } else {
      toast({
        title: 'Géolocalisation non supportée',
        description: 'Votre navigateur ne supporte pas la géolocalisation.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      // Position par défaut (Paris)
      setUserLocation({ lat: 48.8566, lng: 2.3522 });
    }

    // Charger les ponts depuis Supabase
    const loadBridges = async () => {
      try {
        const bridgesData = await getAllBridges();
        setBridges(bridgesData);
        setFilteredBridges(bridgesData);
      } catch (error) {
        console.error('Erreur lors du chargement des ponts:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données des ponts.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadBridges();
  }, [toast]);

  // Filtrer les ponts en fonction de la recherche et du filtre de région
  useEffect(() => {
    let results = bridges;
    
    if (searchTerm) {
      results = results.filter(
        (bridge) =>
          bridge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bridge.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bridge.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (regionFilter) {
      results = results.filter((bridge) => bridge.region === regionFilter);
    }
    
    setFilteredBridges(results);
  }, [searchTerm, regionFilter, bridges]);

  // Fonction pour calculer la distance entre deux points GPS
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Trier les ponts par proximité
  const sortByProximity = () => {
    if (!userLocation) return;

    const sortedBridges = [...filteredBridges].sort((a, b) => {
      const distanceA = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        a.latitude,
        a.longitude
      );
      const distanceB = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        b.latitude,
        b.longitude
      );
      return distanceA - distanceB;
    });

    setFilteredBridges(sortedBridges);
    
    toast({
      title: 'Ponts triés',
      description: 'Les ponts sont maintenant triés par proximité.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Obtenir la liste des régions uniques pour le filtre
  const regions = [...new Set(bridges.map((bridge) => bridge.region))].filter(Boolean);

  return (
    <Container maxW="7xl" py={8}>
      <Heading as="h1" mb={6} color="brand.600">
        Carte des Ponts
      </Heading>

      {/* Filtres et recherche */}
      <Box mb={6}>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap={4}
          p={4}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow="sm"
          borderRadius="md"
        >
          <InputGroup flex={1}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher un pont par nom, ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <Select
            placeholder="Filtrer par région"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            maxW={{ md: '200px' }}
          >
            <option value="">Toutes les régions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </Select>

          <Button
            leftIcon={<Icon as={FaMapMarkerAlt} />}
            colorScheme="brand"
            onClick={sortByProximity}
            isDisabled={!userLocation}
          >
            À proximité
          </Button>
        </Flex>
      </Box>

      {/* Carte */}
      <Box
        h="600px"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="xl"
        mb={6}
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
            
            {/* Marqueur pour la position de l'utilisateur */}
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: '<div style="background-color: #3182CE; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [15, 15],
                iconAnchor: [7, 7],
              })}
            >
              <Popup>Votre position actuelle</Popup>
            </Marker>
            
            {/* Marqueurs pour les ponts */}
            {filteredBridges.map((bridge) => (
              <Marker
                key={bridge.id}
                position={[bridge.latitude, bridge.longitude]}
              >
                <Popup>
                  <Stack spacing={2}>
                    <Heading as="h3" size="sm">{bridge.name}</Heading>
                    <Text>{bridge.address}, {bridge.city}</Text>
                    <Text fontSize="sm">
                      <b>Note moyenne:</b> {bridge.average_rating ? `${bridge.average_rating.toFixed(1)}/5` : 'Aucune note'}
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="brand"
                      onClick={() => navigate(`/bridge/${bridge.id}`)}
                    >
                      Voir les détails
                    </Button>
                  </Stack>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </Box>
      
      {/* Informations sur les résultats */}
      <Flex justify="space-between" align="center" mb={6}>
        <Text color="gray.600">
          {filteredBridges.length} {filteredBridges.length > 1 ? 'ponts trouvés' : 'pont trouvé'}
        </Text>
        <Button
          leftIcon={<Icon as={FaFilter} />}
          variant="outline"
          colorScheme="brand"
          onClick={() => {
            setSearchTerm('');
            setRegionFilter('');
          }}
        >
          Réinitialiser les filtres
        </Button>
      </Flex>
    </Container>
  );
};

export default MapPage;
