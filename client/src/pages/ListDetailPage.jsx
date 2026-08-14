import { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Box, Center, Heading, Text, SimpleGrid, Flex, Input, Textarea, Button, Image, Badge, useToast, Skeleton } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import useSeoMeta from '../utils/useSeoMeta';
import { coverThumbUrl } from '../utils/coverUrl';
import PageCard from '../ui/PageCard';
import Breadcrumbs from '../ui/Breadcrumbs';

export default function ListDetailPage() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const toast = useToast();

  useSeoMeta({
    enabled: Boolean(list),
    title: list?.name,
    description: list?.description || '',
    image: list ? `${import.meta.env.VITE_TARGET}/api/v1/lists/${id}/og-image.png` : undefined,
  });

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get(`/lists/${id}`)
      .then((res) => {
        setList(res.data);
        setNameInput(res.data.name);
        setDescInput(res.data.description || '');
      })
      .catch(() => setList(false))
      .finally(() => setLoading(false));
  }, [id]);

  const saveName = async () => {
    const name = nameInput.trim();
    const description = descInput.trim() || null;
    try {
      await axiosInstance.patch(`/lists/${id}`, { name, description });
      setList((prev) => ({ ...prev, name, description }));
      setEditingName(false);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось сохранить изменения', status: 'error', duration: 2500, isClosable: true });
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

  const backTo = list.isCurated ? '/collections' : '/lists';
  const backLabel = list.isCurated ? 'Подборки' : 'Мои списки';

  return (
    <PageCard maxW="900px">
      <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: backLabel, to: backTo }, { label: list.name }]} />

      {list.isCurated && (
        <Badge colorScheme="green" mb="10px">Подборка редакции</Badge>
      )}

      {editingName ? (
        <Flex direction="column" gap="10px" mb="20px" maxW="500px">
          <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} autoFocus />
          {list.isCurated && (
            <Textarea value={descInput} onChange={(e) => setDescInput(e.target.value)} placeholder="Краткое описание подборки" rows={2} />
          )}
          <Button onClick={saveName} sx={{ backgroundColor: '#334d00', color: 'white' }} alignSelf="flex-start">
            Сохранить
          </Button>
        </Flex>
      ) : (
        <>
          <Heading
            as="h1"
            size="lg"
            mb={list.description ? '6px' : '20px'}
            onClick={() => list.canManage && setEditingName(true)}
            cursor={list.canManage ? 'pointer' : 'default'}
            _hover={list.canManage ? { color: '#4b5320' } : undefined}
          >
            {list.name} {list.canManage && <Text as="span" fontSize="sm" color="bw.textMuted">(изменить)</Text>}
          </Heading>
          {list.description && (
            <Text color="bw.textMuted" mb="20px">{list.description}</Text>
          )}
        </>
      )}

      {list.books.length === 0 ? (
        <Text color="bw.textMuted">
          {list.canManage ? 'В этом списке пока нет книг — добавьте их со страницы книги.' : 'В этом списке пока нет книг.'}
        </Text>
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
              {list.canManage && (
                <Button size="xs" variant="link" sx={{ color: '#a4522a' }} onClick={() => removeBook(book.id)}>
                  Убрать из списка
                </Button>
              )}
            </Box>
          ))}
        </SimpleGrid>
      )}
    </PageCard>
  );
}
