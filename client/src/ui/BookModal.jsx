import { Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Text, useDisclosure } from "@chakra-ui/react";


const BookModal = ({ book, isOpen, onClose }) => {
  if (!book) {
    return null; // Возвращаем null, если book == null
  }
  const OverlayOne = () => (
    <ModalOverlay
      bg="blackAlpha.300"
      backdropFilter="blur(10px) hue-rotate(90deg)"
    />
  );
  return (
    <Modal isCentered isOpen={isOpen} onClose={onClose}>
      <OverlayOne />
      <ModalContent>
        <ModalHeader>{book.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Автор: {book.author}</Text>
          <Text>Жанр: {book.genre}</Text>
          <Text>Год: {book.year}</Text>
          <Text>Рейтинг: {book.rating}</Text>
          <Text>{book.description}</Text>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Закрыть</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BookModal;