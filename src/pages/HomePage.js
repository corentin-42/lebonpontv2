import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Container,
  Text,
  Button,
  Stack,
  Icon,
  useColorModeValue,
  Image,
  SimpleGrid,
  Flex,
  Center,
} from '@chakra-ui/react';
import { FaMapMarkedAlt, FaHome, FaUserShield } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Feature = ({ title, text, icon }) => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      boxShadow={'lg'}
      rounded={'xl'}
      p={{ base: 4, sm: 6, md: 8 }}
      spacing={{ base: 8 }}
      maxW={{ lg: 'lg' }}
    >
      <Center>
        <Flex
          w={16}
          h={16}
          align={'center'}
          justify={'center'}
          color={'white'}
          rounded={'full'}
          bg={'brand.500'}
          mb={1}
        >
          {icon}
        </Flex>
      </Center>
      <Box>
        <Heading
          color={useColorModeValue('gray.700', 'white')}
          fontSize={'2xl'}
          fontFamily={'body'}
          textAlign="center"
        >
          {title}
        </Heading>
        <Text
          color={'gray.500'}
          fontSize={'lg'}
          textAlign="center"
          mt={4}
        >
          {text}
        </Text>
      </Box>
    </Stack>
  );
};

const HomePage = () => {
  const { user } = useAuth();

  return (
    <Box>
      {/* Hero Section */}
      <Container maxW={'7xl'}>
        <Stack
          align={'center'}
          spacing={{ base: 8, md: 10 }}
          py={{ base: 20, md: 28 }}
          direction={{ base: 'column', md: 'row' }}
        >
          <Stack flex={1} spacing={{ base: 5, md: 10 }}>
            <Heading
              lineHeight={1.1}
              fontWeight={600}
              fontSize={{ base: '3xl', sm: '4xl', lg: '6xl' }}
            >
              <Text
                as={'span'}
                position={'relative'}
                color={'brand.500'}
              >
                Le Bon Pont
              </Text>
              <br />
              <Text as={'span'} fontSize={{ base: '2xl', sm: '3xl', lg: '4xl' }}>
                Trouvez un abri sûr sous un pont
              </Text>
            </Heading>
            <Text color={'gray.500'} fontSize={'xl'}>
              Une application destinée à aider les personnes sans domicile ou voyageant sans argent 
              à trouver rapidement un abri gratuit sous un pont. Explorez notre carte interactive 
              et trouvez l'endroit idéal pour passer la nuit en sécurité.
            </Text>
            <Stack
              spacing={{ base: 4, sm: 6 }}
              direction={{ base: 'column', sm: 'row' }}
            >
              <Button
                as={RouterLink}
                to="/map"
                rounded={'full'}
                size={'lg'}
                fontWeight={'normal'}
                px={6}
                colorScheme={'brand'}
                bg={'brand.500'}
                _hover={{ bg: 'brand.600' }}
                leftIcon={<FaMapMarkedAlt />}
              >
                Voir la carte
              </Button>
              {!user && (
                <Button
                  as={RouterLink}
                  to="/register"
                  rounded={'full'}
                  size={'lg'}
                  fontWeight={'normal'}
                  px={6}
                  leftIcon={<FaUserShield />}
                >
                  S'inscrire
                </Button>
              )}
            </Stack>
          </Stack>
          <Flex
            flex={1}
            justify={'center'}
            align={'center'}
            position={'relative'}
            w={'full'}
          >
            <Box
              position={'relative'}
              height={'300px'}
              rounded={'2xl'}
              boxShadow={'2xl'}
              width={'full'}
              overflow={'hidden'}
            >
              <Image
                alt={'Hero Image'}
                fit={'cover'}
                align={'center'}
                w={'100%'}
                h={'100%'}
                src={'https://images.unsplash.com/photo-1610476905085-1e8db380e8e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
              />
            </Box>
          </Flex>
        </Stack>
      </Container>

      {/* Features Section */}
      <Box py={12} bg={useColorModeValue('gray.50', 'gray.700')}>
        <Container maxW={'7xl'}>
          <Heading
            textAlign={'center'}
            fontSize={'4xl'}
            py={10}
            fontWeight={'bold'}
            color={'brand.600'}
          >
            Comment ça fonctionne
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} px={{ base: 4, md: 0 }}>
            <Feature
              icon={<Icon as={FaMapMarkedAlt} w={10} h={10} />}
              title={'Carte interactive'}
              text={
                'Explorez notre carte interactive pour trouver des ponts près de vous avec des informations détaillées sur leur confort et leur sécurité.'
              }
            />
            <Feature
              icon={<Icon as={FaHome} w={10} h={10} />}
              title={'Informations pratiques'}
              text={
                'Consultez les détails sur chaque pont: niveau sonore, abri contre la pluie, toilettes à proximité, eau potable, et bien plus encore.'
              }
            />
            <Feature
              icon={<Icon as={FaUserShield} w={10} h={10} />}
              title={'Communauté d\'entraide'}
              text={
                'Partagez vos expériences, ajoutez de nouveaux ponts et aidez les autres en évaluant les lieux que vous avez visités.'
              }
            />
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
