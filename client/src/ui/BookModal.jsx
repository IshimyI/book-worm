import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Text,
  Image,
  Flex,
  Box,
  Divider,
  Stack,
  Avatar,
  Input,
  ButtonGroup,
} from "@chakra-ui/react";
import { useState } from "react";

const BookModal = ({ book, isOpen, onClose, user }) => {
  const [newReview, setNewReview] = useState("");

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
      <ModalContent maxW="1400px" minH="700px" p="6">
        <ModalCloseButton />
        <ModalHeader fontSize="2xl" fontWeight="bold">
          {book.title}
        </ModalHeader>
        <ModalBody>
          <Flex direction={{ base: "column", md: "row" }} gap="6">
            <Box flexShrink={0}>
              <Image
                src={book.IMG || "./default.jpg"}
                width="250px"
                height="350px"
                objectFit="cover"
                borderRadius="md"
              />
              <Box mt="4">
                <Text fontSize="lg">Автор: {book.author}</Text>
                <Text fontSize="lg">Жанр: {book.genre}</Text>
                <Text fontSize="lg">Год: {book.year}</Text>
                <Text fontSize="lg">Рейтинг: {book.rating}</Text>
                <Text fontSize="lg">Оценили: {book.quantity_rate}</Text>
              </Box>
            </Box>

            <Box flex="2" maxW="400px">
              <Text fontSize="md" noOfLines={10} overflow="hidden">
                {book.annotation}
              </Text>
            </Box>
            <Box flex="1">
              <Text fontSize="xl" fontWeight="bold" mb="4">
                Рецензии
              </Text>
              <Box
                maxH="400px"
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
                    p="4"
                    border="1px solid #ddd"
                    borderRadius="md"
                    mb="4"
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

              {/* Форма добавления рецензии */}
              <Box mt="4">
                <Input
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Напиши свою рецензию"
                />
                <ButtonGroup variant="outline" spacing="6" mt="4">
                  <Button colorScheme="blue" onClick={handleReview}>
                    Добавить
                  </Button>
                </ButtonGroup>
              </Box>
            </Box>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Закрыть</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BookModal;
