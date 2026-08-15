/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Box, Image, Text, SimpleGrid, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import { coverThumbUrl } from '../utils/coverUrl';

const TABS = [
  { key: 'want_to_read', label: 'Хочу прочитать' },
  { key: 'reading', label: 'Читаю' },
  { key: 'read', label: 'Прочитано' },
];

const ReadingShelves = ({ handleBookClick }) => {
  const [shelves, setShelves] = useState(null);

  useEffect(() => {
    axiosInstance
      .get('/reading-status')
      .then((res) => setShelves(res.data))
      .catch(() => setShelves({ want_to_read: [], reading: [], read: [] }));
  }, []);

  if (!shelves) return null;
  const hasAny = TABS.some(({ key }) => shelves[key].length > 0);
  if (!hasAny) return null;

  return (
    <Box>
      <Text fontSize="20px" marginBottom="20px">Мои книги по статусу</Text>
      <Tabs colorScheme="green" sx={{ '[aria-selected=true]': { color: 'var(--chakra-colors-bw-accent)' } }}>
        <TabList>
          {TABS.map(({ key, label }) => (
            <Tab key={key}>{label} ({shelves[key].length})</Tab>
          ))}
        </TabList>
        <TabPanels>
          {TABS.map(({ key }) => (
            <TabPanel key={key} px={0}>
              {shelves[key].length === 0 ? (
                <Text color="bw.textMuted">Пока пусто</Text>
              ) : (
                <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing="20px">
                  {shelves[key].map((book) => (
                    <Box
                      key={book.id}
                      cursor="pointer"
                      onClick={() => handleBookClick(book)}
                      transition="transform 0.15s ease, box-shadow 0.15s ease"
                      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
                    >
                      <Image
                        src={coverThumbUrl(book.img) || './default.jpg'}
                        fallbackSrc="./default.jpg"
                        alt={book.title}
                        loading="lazy"
                        width="150px"
                        height="200px"
                        objectFit="cover"
                        borderRadius="10px"
                      />
                      <Text fontSize="sm" mt="6px" noOfLines={2}>{book.title}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ReadingShelves;
