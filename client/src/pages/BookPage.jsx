/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Box, Center, Flex, Image, Text, Heading, Stack, Divider, Avatar, Textarea, Button, useToast, Spinner } from '@chakra-ui/react';
import { StarIcon, ArrowBackIcon } from '@chakra-ui/icons';
import axiosInstance from '../axiosInstance';

export default function BookPage({ user }) {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [inputBody, setInputBody] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get(`/book/${id}`)
      .then((res) => {
        setBook(res.data);
        setReviews(res.data.reviews || []);
      })
      .catch(() => setBook(false))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFavorites = async () => {
    if (!user) {
      toast({ title: 'Войдите, чтобы добавлять книги в избранное', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    try {
      await axiosInstance.post(`/updateFavourites/${user.id}`, { bookId: book.id });
      setIsFavorite((prev) => !prev);
      toast({
        title: isFavorite ? 'Убрано из избранного' : 'Добавлено в избранное',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({ title: 'Не удалось обновить избранное', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const addReviewHandler = async (event) => {
    event.preventDefault();
    if (!user) {
      toast({ title: 'Войдите, чтобы оставить рецензию', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    if (!inputBody || !rating) {
      toast({ title: 'Напишите текст и поставьте оценку', status: 'warning', duration: 2500, isClosable: true });
      return;
    }
    try {
      const res = await axiosInstance.post(`/book/new`, {
        user_id: user.id,
        body: inputBody,
        title: book.title,
        author: book.author,
        user_rating: rating,
      });
      if (res.status === 200) {
        setReviews((prev) => [
          { userName: user.name, user_rev: inputBody, user_id: user.id, user_raeting: rating },
          ...prev,
        ]);
        setInputBody('');
        setRating(0);
        setHover(0);
        toast({ title: 'Рецензия добавлена', status: 'success', duration: 2000, isClosable: true });
      }
    } catch (error) {
      toast({ title: 'Не удалось добавить рецензию', status: 'error', duration: 2500, isClosable: true });
    }
  };

  if (loading) {
    return (
      <Center py="100px">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!book) {
    return (
      <Center py="100px" flexDirection="column">
        <Text fontSize="xl" mb="20px">Книга не найдена</Text>
        <NavLink to="/">
          <Button backgroundColor="#334d00" color="white">На главную</Button>
        </NavLink>
      </Center>
    );
  }

  return (
    <Center py="40px" px="20px">
      <Box maxW="1000px" width="100%" bg="white" borderRadius="lg" boxShadow="md" p="30px">
        <NavLink to="/">
          <Button variant="link" mb="20px" sx={{ color: '#334d00' }}>
            <ArrowBackIcon mr="6px" /> К каталогу
          </Button>
        </NavLink>

        <Flex gap="30px" flexWrap="wrap">
          <Image src={book.img || './default.jpg'} width="250px" height="350px" objectFit="cover" borderRadius="md" />
          <Box flex="1" minW="250px">
            <Heading as="h1" size="lg" mb="10px">{book.title}</Heading>
            <Text color="gray.600" mb="10px">{book.author}</Text>
            <Stack spacing={2} mb="20px">
              <Text fontSize="sm"><b>Жанр:</b> {book.genre}</Text>
              <Text fontSize="sm"><b>Год:</b> {book.year}</Text>
              <Text fontSize="sm"><b>Рейтинг:</b> {book.rating ?? 0} ⭐ ({book.quantity_rate ?? 0} отзывов)</Text>
            </Stack>
            <Text mb="20px">{book.annotation}</Text>
            <Button backgroundColor={isFavorite ? '#334d00' : '#909e18'} color="white" onClick={handleFavorites}>
              {isFavorite ? '✓ В избранном' : 'Добавить в избранное'}
            </Button>
          </Box>
        </Flex>

        <Divider my="30px" />

        <Heading as="h2" size="md" mb="20px">Рецензии</Heading>
        <Box maxH="400px" overflowY="auto" mb="20px">
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <Box key={index} p="3" border="1px solid #ddd" borderRadius="md" mb="3">
                <Stack direction="row" spacing="4" align="center">
                  <Avatar name={review.userName} />
                  <Box>
                    <Text fontWeight="bold">{review.userName}</Text>
                    <Divider my="2" />
                    <Text>{review.user_rev}</Text>
                    <Text>{review.user_raeting} ⭐</Text>
                  </Box>
                </Stack>
              </Box>
            ))
          ) : (
            <Text color="gray.500" textAlign="center" py="6">
              Пока нет рецензий — будьте первым
            </Text>
          )}
        </Box>

        <Textarea value={inputBody} onChange={(e) => setInputBody(e.target.value)} placeholder="Напиши свою рецензию" mb="10px" />
        <Box mb="15px">
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
              <StarIcon
                key={index}
                fontSize="25px"
                color={ratingValue <= (hover || rating) ? 'gold' : 'gray.300'}
                onClick={() => setRating(ratingValue)}
                onMouseEnter={() => setHover(ratingValue)}
                onMouseLeave={() => setHover(rating)}
                cursor="pointer"
              />
            );
          })}
        </Box>
        <Button backgroundColor="#334d00" color="white" onClick={addReviewHandler}>
          Добавить рецензию
        </Button>
      </Box>
    </Center>
  );
}
