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
  Box
} from "@chakra-ui/react";

const BookModal = ({ book, isOpen, onClose }) => {
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
      <ModalOverlay />
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
            </Box>
            <Flex direction="column" flex="1">
              <Text fontSize="lg">Автор: {book.author}</Text>
              <Text fontSize="lg">Жанр: {book.genre}</Text>
              <Text fontSize="lg">Год: {book.year}</Text>
              <Text fontSize="lg">Рейтинг: {book.rating}</Text>
              <Text fontSize="lg">Оценили: {book.quantity_rate}</Text>
              {/* <Text mt="4">{book.annotation}</Text> */}
              </Flex>
          </Flex>
          <Box mt="6">
          <Text fontSize="md">{book.annotation}</Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Закрыть</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BookModal;
