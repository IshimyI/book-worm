/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Box, Center, Flex, Image, Text, Heading, Stack, Divider, Avatar, Textarea, Button, Select, useToast, Spinner } from '@chakra-ui/react';
import { StarIcon, ArrowBackIcon } from '@chakra-ui/icons';
import axiosInstance from '../axiosInstance';
import { openLibrarySearchUrl } from '../utils/openLibrary';

export default function BookPage({ user }) {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState('newest');
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

  useEffect(() => {
    const defaultTitle = document.title;
    const setMeta = (name, content, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (book) {
      document.title = `${book.title} — Mr Book Worm`;
      setMeta('description', book.annotation || `${book.title}, ${book.author}`);
      setMeta('og:title', book.title, 'property');
      setMeta('og:description', book.annotation || '', 'property');
      if (book.img) setMeta('og:image', book.img, 'property');
    }

    return () => {
      document.title = defaultTitle;
    };
  }, [book]);

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

  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;
  const isEditing = Boolean(myReview);

  // Prefill the form with the existing review as soon as it's known, so
  // opening the form to "write a review" on a book you already reviewed
  // shows what you wrote instead of a blank box.
  useEffect(() => {
    if (myReview) {
      setInputBody(myReview.user_rev);
      setRating(myReview.user_raeting);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview?.id]);

  const startEditing = () => {
    setInputBody(myReview.user_rev);
    setRating(myReview.user_raeting);
    document.getElementById('reviewForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const deleteReview = async () => {
    if (!myReview || !window.confirm('Удалить вашу рецензию?')) return;
    try {
      await axiosInstance.delete(`/review/${myReview.id}`);
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id));
      toast({ title: 'Рецензия удалена', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: 'Не удалось удалить рецензию', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const reportReview = async (review) => {
    if (!user) {
      toast({ title: 'Войдите, чтобы отправить жалобу', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    try {
      await axiosInstance.post(`/review/${review.id}/report`);
      toast({ title: 'Жалоба отправлена, спасибо', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: 'Не удалось отправить жалобу', status: 'error', duration: 2500, isClosable: true });
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
        setReviews((prev) => {
          const already = prev.some((r) => r.user_id === user.id);
          const updated = {
            id: res.data.review.id,
            userName: user.name,
            user_rev: inputBody,
            user_id: user.id,
            user_raeting: rating,
            createdAt: res.data.review.createdAt,
          };
          return already
            ? prev.map((r) => (r.user_id === user.id ? updated : r))
            : [updated, ...prev];
        });
        setInputBody('');
        setRating(0);
        setHover(0);
        toast({
          title: isEditing ? 'Рецензия обновлена' : 'Рецензия добавлена',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Не удалось сохранить рецензию';
      toast({ title: message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (reviewSort === 'rating') {
      list.sort((a, b) => (b.user_raeting ?? 0) - (a.user_raeting ?? 0));
    } else if (reviewSort === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    // Your own review always leads, regardless of sort order.
    if (user) {
      list.sort((a, b) => (b.user_id === user.id ? 1 : 0) - (a.user_id === user.id ? 1 : 0));
    }
    return list;
  }, [reviews, reviewSort, user]);

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
      <Box maxW="1000px" width="100%" bg="#fffdf7" borderRadius="lg" boxShadow="md" p="30px" borderTop="4px solid #4b5320">
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
            <Flex gap="12px" flexWrap="wrap">
              <Button backgroundColor={isFavorite ? '#334d00' : '#909e18'} color="white" onClick={handleFavorites}>
                {isFavorite ? '✓ В избранном' : 'Добавить в избранное'}
              </Button>
              <Button
                as="a"
                href={openLibrarySearchUrl(book.title, book.author)}
                target="_blank"
                rel="noreferrer"
                variant="outline"
                sx={{ color: '#334d00', borderColor: '#334d00' }}
              >
                Читать / найти книгу
              </Button>
            </Flex>
          </Box>
        </Flex>

        <Divider my="30px" />

        <Flex justify="space-between" align="center" mb="20px" flexWrap="wrap" gap="10px">
          <Heading as="h2" size="md">Рецензии</Heading>
          <Select size="sm" w="200px" value={reviewSort} onChange={(e) => setReviewSort(e.target.value)}>
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="rating">По оценке</option>
          </Select>
        </Flex>
        <Box maxH="400px" overflowY="auto" mb="20px">
          {sortedReviews.length > 0 ? (
            sortedReviews.map((review) => {
              const isMine = user && review.user_id === user.id;
              return (
                <Box
                  key={review.id}
                  p="3"
                  border={isMine ? '2px solid #4b5320' : '1px solid #ddd'}
                  bg={isMine ? '#f7f8ef' : 'white'}
                  borderRadius="md"
                  mb="3"
                >
                  <Stack direction="row" spacing="4" align="center">
                    <Avatar name={review.userName} />
                    <Box flex="1">
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold">
                          <NavLink to={`/users/${review.user_id}`} style={{ textDecoration: 'none' }}>
                            <Text as="span" _hover={{ textDecoration: 'underline', color: '#4b5320' }}>{review.userName}</Text>
                          </NavLink>
                          {' '}
                          {isMine && <Text as="span" fontSize="xs" color="#4b5320" fontWeight="bold">(ваш отзыв)</Text>}
                        </Text>
                        {isMine ? (
                          <Flex gap="10px">
                            <Button size="xs" variant="link" sx={{ color: '#4b5320' }} onClick={startEditing}>
                              Редактировать
                            </Button>
                            <Button size="xs" variant="link" sx={{ color: '#a4522a' }} onClick={deleteReview}>
                              Удалить
                            </Button>
                          </Flex>
                        ) : (
                          <Button size="xs" variant="link" color="gray.500" onClick={() => reportReview(review)}>
                            Пожаловаться
                          </Button>
                        )}
                      </Flex>
                      <Divider my="2" />
                      <Text>{review.user_rev}</Text>
                      <Text>{review.user_raeting} ⭐</Text>
                    </Box>
                  </Stack>
                </Box>
              );
            })
          ) : (
            <Text color="gray.500" textAlign="center" py="6">
              Пока нет рецензий — будьте первым
            </Text>
          )}
        </Box>

        <Box id="reviewForm">
          {isEditing && (
            <Text fontSize="sm" color="#4b5320" fontWeight="bold" mb="6px">Вы редактируете свой отзыв</Text>
          )}
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
            {isEditing ? 'Обновить рецензию' : 'Добавить рецензию'}
          </Button>
        </Box>
      </Box>
    </Center>
  );
}
