/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Box,
  Center,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Input,
  Button,
  Checkbox,
  Badge,
  useToast,
  Skeleton,
  Image,
} from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import useSeoMeta from '../utils/useSeoMeta';
import PageCard from '../ui/PageCard';
import { withCount } from '../utils/pluralize';
import useConfirm from '../ui/useConfirm';

export default function ListsPage({ user }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newIsCurated, setNewIsCurated] = useState(false);
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  useSeoMeta({ title: 'Мои списки чтения' });

  const load = () => {
    setLoading(true);
    axiosInstance
      .get('/lists')
      .then((res) => setLists(res.data))
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user]);

  const createList = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await axiosInstance.post('/lists', { name, isCurated: newIsCurated });
      setLists((prev) => [res.data, ...prev]);
      setNewName('');
      setNewIsCurated(false);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось создать список', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setCreating(false);
    }
  };

  const removeList = async (id) => {
    if (!(await confirm('Удалить этот список?'))) return;
    try {
      await axiosInstance.delete(`/lists/${id}`);
      setLists((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось удалить список', status: 'error', duration: 2500, isClosable: true });
    }
  };

  if (!user) {
    return (
      <Center py="100px" flexDirection="column">
        <Text fontSize="xl" mb="20px">Войдите, чтобы создавать списки чтения</Text>
        <NavLink to="/auth">
          <Button backgroundColor="#334d00" color="white">Войти</Button>
        </NavLink>
      </Center>
    );
  }

  return (
    <PageCard maxW="900px">
      {ConfirmDialog}
      <Heading as="h1" size="lg" mb="20px">Мои списки</Heading>

      <Flex gap="10px" mb={user.isAdmin ? '10px' : '30px'}>
        <Input
          placeholder="Название нового списка"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createList()}
        />
        <Button isLoading={creating} onClick={createList} sx={{ backgroundColor: '#334d00', color: 'white' }} flexShrink={0}>
          Создать список
        </Button>
      </Flex>
      {user.isAdmin && (
        <Checkbox isChecked={newIsCurated} onChange={(e) => setNewIsCurated(e.target.checked)} mb="30px">
          Сделать подборкой (видна всем на странице «Подборки»)
        </Checkbox>
      )}

      {loading ? (
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="16px">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} height="140px" borderRadius="md" />
          ))}
        </SimpleGrid>
      ) : lists.length === 0 ? (
        <Text color="bw.textMuted">Пока нет списков — создайте первый выше или добавьте книгу в список со страницы книги.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="16px">
          {lists.map((list) => (
            <Box key={list.id} border="1px solid" borderColor="bw.border" borderRadius="md" p="16px" bg="bw.cardBg">
              <Flex justify="space-between" align="flex-start" mb="10px">
                <NavLink to={`/lists/${list.id}`}>
                  <Heading as="h3" size="sm" _hover={{ color: '#4b5320', textDecoration: 'underline' }}>
                    {list.name} {list.isCurated && <Badge colorScheme="green" ml="4px">подборка</Badge>}
                  </Heading>
                </NavLink>
                <Button size="xs" variant="link" sx={{ color: '#a4522a' }} onClick={() => removeList(list.id)}>
                  Удалить
                </Button>
              </Flex>
              <Text fontSize="sm" color="bw.textMuted" mb="10px">
                {withCount(list.bookCount, ['книга', 'книги', 'книг'])}
              </Text>
              {list.covers.length > 0 && (
                <Flex gap="6px">
                  {list.covers.map((cover, i) => (
                    <Image key={i} src={cover || './default.jpg'} fallbackSrc="./default.jpg" alt="" loading="lazy" width="44px" height="60px" objectFit="cover" borderRadius="4px" />
                  ))}
                </Flex>
              )}
            </Box>
          ))}
        </SimpleGrid>
      )}
    </PageCard>
  );
}
