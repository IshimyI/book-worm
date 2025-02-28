/* eslint-disable react/prop-types */
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  Image,
  Flex,
  Box,
  Divider,
  Stack,
  Avatar,
  Textarea,
  Heading,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";
import { useState } from "react";

const BookModal = ({ book, isOpen, onClose, user }) => {
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const [reviews, setReviews] = useState([
    {
      user: "Иван Петров",
      text: "Отличная книга! Очень понравилась глубина персонажей.",
      avatarUrl: "https://bit.ly/broken-link",
    },
    {
      user: "Мария Сидорова",
      text: "Интересный сюжет, но мне не хватило динамики в развитии событий.",
      avatarUrl: "https://bit.ly/broken-link",
    },
    {
      user: "Александр Иванов",
      text: "Читал давно, но до сих пор под впечатлением. Рекомендую!",
      avatarUrl: "https://bit.ly/broken-link",
    },
  ]);

  const handleReview = () => {
    if (newReview.trim()) {
      const newRev = {
        user: user.name,
        text: newReview,
        avatarUrl: "https://bit.ly/broken-link",
      };
      setReviews([...reviews, newRev]);
      setNewReview("");
    }
  };
  const handleRating = (value) => {
    setRating(value);
    console.log(rating);
  };

  const handleMouseEnter = (value) => {
    setHover(value);
  };

  const handleMouseLeave = () => {
    setHover(rating);
  };

  const handleFavorites = () => {
    console.log("Книга добавлена в избранное");
  };
  

  const addOwnBookHandler = async (event) => {
    event.preventDefault();
    console.log('инпуты в хэндлере', inputs);
    if (!(inputs.title && inputs.author && inputs.img)) {
      console.log('Поля * должны быть заполнены');
    } else {
      try {
        const res = await axiosInstance.post(`/book/new`, {
          user_id: user.id,
          title: inputs.title,
          author: inputs.author,
          genre: inputs.genre,
          //annotation: inputs.annotation,
          year: inputs.year,
          img: inputs.img,
          body: inputs.body,
          user_rating: rating,
        });
        if (res.status === 200) {
          setInputs(emptyInputs);
          setRating(0);
          setHover(0);
        }
      } catch (error) {
        console.log(error, 'что-то c add не так');
      }
    }
  };

  if (!book) {
    return null;
  }

  const OverlayOne = () => (
    <ModalOverlay
      bg="blackAlpha.300"
      backdropFilter="blur(10px) hue-rotate(90deg)"
    />
  );

  return (
    <Modal isCentered isOpen={isOpen} onClose={onClose} size="xl">
      <OverlayOne />
      <ModalContent maxW="70%" minH="700px" p="6" overflow="hidden">
        <ModalCloseButton />
        <ModalHeader fontSize="2xl" fontWeight="bold">
          {book.title}
        </ModalHeader>
        <ModalBody overflow="auto">
          <Flex>
            <Box>
              <Flex className="this12">
                <Box maxWidth="250px">
                  <Image
                    src={book.IMG || "./default.jpg"}
                    width="250px"
                    height="350px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                </Box>
                <Box
                  w="65%"
                  mr={"20px"}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  boxShadow="sm"
                  bg="white"
                >
                  <Stack spacing={3}>
                    <Heading
                      as="h3"
                      size="md"
                      fontWeight="semibold"
                      color="gray.700"
                    >
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
              <Box mt="20px" pr={"25px"} mb={"25px"}>
                <Text fontSize="md">{book.annotation}</Text>
              </Box>{" "}
            </Box>
            <Box>
              <Box w={"60vh"}>
                <Text fontSize="xl" fontWeight="bold" mb="4">
                  Рецензии
                </Text>
                <Box
                  maxH="300px"
                  overflowY="auto"
                  p="2"
                  border="1px solid #ccc"
                  borderRadius="md"
                >
                  {(book.reviews && book.reviews.length > 0
                    ? book.reviews
                    : reviews
                  ).map((review, index) => (
                    <Box
                      key={index}
                      p="3"
                      border="1px solid #ddd"
                      borderRadius="md"
                      mb="3"
                    >
                      <Stack direction="row" spacing="4" align="center">
                        <Avatar name={review.user} src={review.avatarUrl} />
                        <Box>
                          <Text fontWeight="bold">{review.user}</Text>
                          <Divider my="2" />
                          <Text>{review.text}</Text>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                  {reviews.length === 0 && (
                    <Text color="gray.500">Нет рецензий на эту книгу.</Text>
                  )}
                </Box>
                <Box mt="4">
                  <Textarea
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    placeholder="Напиши свою рецензию"
                  />

                  <Box mt="15px">
                    {[...Array(5)].map((_, index) => {
                      const ratingValue = index + 1;
                      return (
                        <StarIcon
                          key={index}
                          aria-label={`Рейтинг ${ratingValue}`}
                          fontSize="25px"
                          variant="ghost"
                          color={
                            ratingValue <= (hover || rating)
                              ? "gold"
                              : "gray.300"
                          }
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

          <Flex className="this123" mt={"30px"}>
            <Button
              backgroundColor="#909e18"
              color="white"
              onClick={handleFavorites}
            >
              Добавить в избранное
            </Button>
            <Button
              backgroundColor="#334d00"
              color="white"
              onClick={handleReview}
            >
              Добавить рецензию
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BookModal;
