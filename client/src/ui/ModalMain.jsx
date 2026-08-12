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
import { StarIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axiosInstance from '../axiosInstance';
import { openLibrarySearchUrl } from '../utils/openLibrary';

export default function ModalMain({ user, book }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [inputBody, setInputBody] = useState('');
  const [reviews, setReviews] = useState(book?.reviews || []);
  const [isFavorite, setIsFavorite] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setReviews(book?.reviews || []);
  }, [book]);

  const handleRating = (value) => {
    setRating(value);
  };

  const handleMouseEnter = (value) => {
    setHover(value);
  };

  const handleMouseLeave = () => {
    setHover(rating);
  };

  const handleFavorites = async () => {
    if (!user) {
      toast({ title: 'Войдите, чтобы добавлять книги в избранное', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    try {
      await axiosInstance.post(`/updateFavourites/${user.id}`, {
        bookId: book.id,
      });
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

  if (!book) {
    return null;
  }

  return (
    <>
      <Button
        ml={"35px"}
        sx={{
          backgroundColor: "#909e18",
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
                  <Image src={book.img || './default.jpg'} width="250px" height="350px" objectFit="cover" borderRadius="md" />
                </Box>
                <Box w="65%" mr={'20px'} p={4} borderWidth="1px" borderRadius="md" boxShadow="sm" bg="white">
                  <Stack spacing={3}>
                    <Heading as="h3" size="md" fontWeight="semibold" color="gray.700">
                      Информация о книге:
                    </Heading>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Автор:
                      </Text>
                      <Text fontSize="md">{book.author}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Жанр:
                      </Text>
                      <Text fontSize="md">{book.genre}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Год:
                      </Text>
                      <Text fontSize="md">{book.year}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Рейтинг:
                      </Text>
                      <Text fontSize="md">{book.rating} ⭐</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
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
              <Box w={'60vh'}>
                <Text fontSize="xl" fontWeight="bold" mb="4">
                  Рецензии
                </Text>
                <Box maxH="300px" overflowY="auto" p="2" border="1px solid #ccc" borderRadius="md">
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <Box key={index} p="3" border="1px solid #ddd" borderRadius="md" mb="3">
                        <Stack direction="row" spacing="4" align="center">
                          <Avatar name={review.userName} />

                          <Box>
                            <Flex justifyContent="space-between">
                              <Text fontWeight="bold">{review.userName}</Text>
                            </Flex>
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
                <Box mt="4">
                  <Textarea value={inputBody} onChange={(e) => setInputBody(e.target.value)} placeholder="Напиши свою рецензию" />

                  <Box mt="15px">
                    {[...Array(5)].map((_, index) => {
                      const ratingValue = index + 1;
                      return (
                        <StarIcon
                          key={index}
                          aria-label={`Рейтинг ${ratingValue}`}
                          fontSize="25px"
                          variant="ghost"
                          color={ratingValue <= (hover || rating) ? 'gold' : 'gray.300'}
                          onClick={() => handleRating(ratingValue)}
                          onMouseEnter={() => handleMouseEnter(ratingValue)}
                          onMouseLeave={handleMouseLeave}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Flex>

          <Flex className="bookActionsRow" mt={'30px'} gap="12px">
            <Button backgroundColor={isFavorite ? '#334d00' : '#909e18'} color="white" onClick={handleFavorites}>
              {isFavorite ? '✓ В избранном' : 'Добавить в избранное'}
            </Button>
            <Button backgroundColor="#334d00" color="white" onClick={addReviewHandler}>
              Добавить рецензию
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
