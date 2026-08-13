/* eslint-disable react/prop-types */
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Stack,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  useToast,
  Text,
  Image,
  Flex,
  Box,
  Heading,
  Avatar,
  Divider,
  Textarea,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axiosInstance from '../axiosInstance';
import { openLibrarySearchUrl } from '../utils/openLibrary';
import StarRatingInput from './StarRatingInput';
import useFavorite from '../utils/useFavorite';

export default function ModalMain({ user, setUser, book }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rating, setRating] = useState(0);
  const [inputBody, setInputBody] = useState('');
  const [reviews, setReviews] = useState(book?.reviews || []);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { isFavorite, toggle: toggleFavorite } = useFavorite(user, setUser, book?.id);
  const toast = useToast();

  // The catalog list doesn't ship full review bodies for every book (that's
  // most of the payload weight for a page most visitors never open) — fetch
  // them lazily the moment this book's modal actually opens.
  useEffect(() => {
    if (!isOpen || !book) return;
    setReviewsLoading(true);
    axiosInstance
      .get(`/book/${book.id}`)
      .then((res) => setReviews(res.data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [isOpen, book]);

  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  useEffect(() => {
    if (myReview) {
      setInputBody(myReview.user_rev);
      setRating(myReview.user_raeting);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview?.id]);

  const sortedReviews = user
    ? [...reviews].sort((a, b) => (b.user_id === user.id ? 1 : 0) - (a.user_id === user.id ? 1 : 0))
    : reviews;

  const handleRating = (value) => {
    setRating(value);
  };

  const handleFavorites = async () => {
    if (!user) {
      toast({ title: 'Войдите, чтобы добавлять книги в избранное', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    const wasFavorite = isFavorite;
    try {
      await toggleFavorite();
      toast({
        title: wasFavorite ? 'Убрано из избранного' : 'Добавлено в избранное',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось обновить избранное', status: 'error', duration: 2500, isClosable: true });
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
          };
          return already
            ? prev.map((r) => (r.user_id === user.id ? updated : r))
            : [updated, ...prev];
        });
        setInputBody('');
        setRating(0);
        toast({
          title: myReview ? 'Рецензия обновлена' : 'Рецензия добавлена',
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

  if (!book) {
    return null;
  }

  return (
    <>
      <Button
        ml={"35px"}
        sx={{
          backgroundColor: "#6b7412",
          color: "white",
        }}
        size="sm"
        onClick={onOpen}
      >
        Подробнее
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent maxW="70%" minH="700px" p="6" overflow="hidden">
        <ModalCloseButton />
        <ModalHeader fontSize="2xl" fontWeight="bold">
          {book.title}
          <NavLink to={`/books/${book.id}`}>
            <Button size="xs" ml="12px" variant="outline" sx={{ color: '#334d00', borderColor: '#334d00' }}>
              <ExternalLinkIcon mr="6px" /> Открыть страницу книги
            </Button>
          </NavLink>
        </ModalHeader>
        <ModalBody overflow="auto">
          <Flex>
            <Box>
              <Flex className="bookInfoRow">
                <Box maxWidth="250px">
                  <Image src={book.img || './default.jpg'} alt={book.title} width="250px" height="350px" objectFit="cover" borderRadius="md" />
                </Box>
                <Box w="65%" mr={'20px'} p={4} borderWidth="1px" borderColor="bw.border" borderRadius="md" boxShadow="sm" bg="bw.cardBg">
                  <Stack spacing={3}>
                    <Heading as="h3" size="md" fontWeight="semibold" color="bw.text">
                      Информация о книге:
                    </Heading>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="bw.textMuted">
                        Автор:
                      </Text>
                      <Text fontSize="md">{book.author}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="bw.textMuted">
                        Жанр:
                      </Text>
                      <Text fontSize="md">{book.genre}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="bw.textMuted">
                        Год:
                      </Text>
                      <Text fontSize="md">{book.year}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="bw.textMuted">
                        Рейтинг:
                      </Text>
                      <Text fontSize="md">{book.rating} ⭐</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="bw.textMuted">
                        Оценили:
                      </Text>
                      <Text fontSize="md">{book.quantity_rate}</Text>
                    </Box>
                  </Stack>
                </Box>
              </Flex>
              <Box mt="20px" pr={'25px'} mb={'25px'}>
                <Text fontSize="md">{book.annotation}</Text>
              </Box>{' '}
            </Box>
            <Box>
              <Box w={{ base: '100%', md: '400px' }}>
                <Text fontSize="xl" fontWeight="bold" mb="4">
                  Рецензии
                </Text>
                <Box maxH="300px" overflowY="auto" p="2" border="1px solid" borderColor="bw.border" borderRadius="md">
                  {reviewsLoading ? (
                    <Text color="bw.textMuted" textAlign="center" py="6">Загрузка…</Text>
                  ) : sortedReviews.length > 0 ? (
                    sortedReviews.map((review, index) => (
                      <Box
                        key={index}
                        p="3"
                        border={user && review.user_id === user.id ? '2px solid #4b5320' : '1px solid'}
                        borderColor={user && review.user_id === user.id ? undefined : 'bw.border'}
                        bg={user && review.user_id === user.id ? 'bw.reviewHighlight' : 'bw.cardBg'}
                        borderRadius="md"
                        mb="3"
                      >
                        <Stack direction="row" spacing="4" align="center">
                          <Avatar name={review.userName} />

                          <Box>
                            <Flex justifyContent="space-between">
                              <Text fontWeight="bold">
                                {review.userName}{' '}
                                {user && review.user_id === user.id && (
                                  <Text as="span" fontSize="xs" color="#4b5320" fontWeight="bold">(ваш отзыв)</Text>
                                )}
                              </Text>
                            </Flex>
                            <Divider my="2" />
                            <Text>{review.user_rev}</Text>
                            <Text>{review.user_raeting} ⭐</Text>
                          </Box>
                        </Stack>
                      </Box>
                    ))
                  ) : (
                    <Text color="bw.textMuted" textAlign="center" py="6">
                      Пока нет рецензий — будьте первым
                    </Text>
                  )}
                </Box>
                <Box mt="4">
                  <Textarea value={inputBody} onChange={(e) => setInputBody(e.target.value)} placeholder="Напиши свою рецензию" />

                  <Box mt="15px">
                    <StarRatingInput rating={rating} onChange={handleRating} />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Flex>

          <Flex className="bookActionsRow" mt={'30px'} gap="12px">
            <Button backgroundColor={isFavorite ? '#334d00' : '#6b7412'} color="white" onClick={handleFavorites}>
              {isFavorite ? '✓ В избранном' : 'Добавить в избранное'}
            </Button>
            <Button backgroundColor="#334d00" color="white" onClick={addReviewHandler}>
              {myReview ? 'Обновить рецензию' : 'Добавить рецензию'}
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
        </ModalBody>
      </ModalContent>
      </Modal>
    </>
  );
}
