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
  Avatar
} from "@chakra-ui/react";

const BookModal = ({ book, isOpen, onClose }) => {
  if (!book) {
    return null;
  }

  const testReviews = [
    {
      user: "Иван Петров",
      text: "Отличная книга! Очень понравилась глубина персонажей.",
      avatarUrl: "https://bit.ly/broken-link"
    },
    {
      user: "Мария Сидорова",
      text: "Интересный сюжет, но мне не хватило динамики в развитии событий.",
      avatarUrl: "https://bit.ly/broken-link"
    },
    {
      user: "Александр Иванов",
      text: "Читал давно, но до сих пор под впечатлением. Рекомендую!",
      avatarUrl: "https://bit.ly/broken-link"
    },
  ];
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
                {/* <Text mt="4">{book.annotation}</Text> */}
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
                  : testReviews
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
                {book.reviews && book.reviews.length === 0 && (
                  <Text color="gray.500">Нет рецензий на эту книгу.</Text>
                )}
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
