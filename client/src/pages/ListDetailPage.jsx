/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Box, Center, Heading, Text, SimpleGrid, Flex, Input, Button, Image, useToast, Skeleton } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import axiosInstance from '../axiosInstance';
import useSeoMeta from '../utils/useSeoMeta';
import { coverThumbUrl } from '../utils/coverUrl';
import PageCard from '../ui/PageCard';

export default function ListDetailPage({ user }) {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const toast = useToast();

  useSeoMeta({ enabled: Boolean(list), title: list?.name });

  const load = () => {
    setLoading(true);
    axiosInstance
      .get(`/lists/${id}`)
      .then((res) => {
        setList(res.data);
        setNameInput(res.data.name);
      })
      .catch(() => setList(false))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const saveName = async () => {
    const name = nameInput.trim();
    if (!name || name === list.name) {
      setEditingName(false);
      return;
    }
    try {
      await axiosInstance.patch(`/lists/${id}`, { name });
      setList((prev) => ({ ...prev, name }));
      setEditingName(false);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось переименовать список', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const removeBook = async (bookId) => {
    try {
      await axiosInstance.delete(`/lists/${id}/books/${bookId}`);
      setList((prev) => ({ ...prev, books: prev.books.filter((b) => b.id !== bookId) }));
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось убрать книгу', status: 'error', duration: 2500, isClosable: true });
    }
  };

  if (!user) {
    return (
      <Center py="100px" flexDirection="column">
        <Text fontSize="xl" mb="20px">Войдите, чтобы посмотреть список</Text>
        <NavLink to="/auth">
          <Button backgroundColor="#334d00" color="white">Войти</Button>
        </NavLink>
      </Center>
    );
  }

  if (loading) {
    return (
      <PageCard maxW="900px">
        <Skeleton height="32px" width="240px" mb="20px" />
        <SimpleGrid columns={{ base: 2, sm: 4 }} spacing="16px">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height="200px" borderRadius="md" />
          ))}
        </SimpleGrid>
      </PageCard>
    );
  }

  if (!list) {
    return (
      <Center py="100px" flexDirection="column">
        <Text fontSize="xl" mb="20px">Список не найден</Text>
        <NavLink to="/lists">
          <Button backgroundColor="#334d00" color="white">К моим спискам</Button>
        </NavLink>
      </Center>
    );
  }

  return (
    <PageCard maxW="900px">
      <NavLink to="/lists">
        <Button variant="link" mb="20px" sx={{ color: '#334d00' }}>
          <ArrowBackIcon mr="6px" /> К моим спискам
        </Button>
      </NavLink>

      {editingName ? (
        <Flex gap="10px" mb="20px" maxW="400px">
          <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveName()} autoFocus />
          <Button onClick={saveName} sx={{ backgroundColor: '#334d00', color: 'white' }} flexShrink={0}>
            Сохранить
          </Button>
        </Flex>
      ) : (
        <Heading as="h1" size="lg" mb="20px" onClick={() => setEditingName(true)} cursor="pointer" _hover={{ color: '#4b5320' }}>
          {list.name} <Text as="span" fontSize="sm" color="bw.textMuted">(изменить)</Text>
        </Heading>
      )}

      {list.books.length === 0 ? (
        <Text color="bw.textMuted">В этом списке пока нет книг — добавьте их со страницы книги.</Text>
      ) : (
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing="20px">
          {list.books.map((book) => (
            <Box key={book.id} position="relative">
              <NavLink to={`/books/${book.id}`}>
                <Image
                  src={coverThumbUrl(book.img) || './default.jpg'}
                  alt={book.title}
                  loading="lazy"
                  width="100%"
                  height="200px"
                  objectFit="cover"
                  borderRadius="8px"
                />
                <Text fontSize="sm" fontWeight="bold" mt="6px" noOfLines={2}>{book.title}</Text>
              </NavLink>
              <Button size="xs" variant="link" sx={{ color: '#a4522a' }} onClick={() => removeBook(book.id)}>
                Убрать из списка
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </PageCard>
  );
}
