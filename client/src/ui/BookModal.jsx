import { Button, Modal, ModalOverlay, ModalContent, ModalBody, ModalFooter, ModalCloseButton, Text, Image } from "@chakra-ui/react";


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
    <Modal isCentered isOpen={isOpen} onClose={onClose}>
      <OverlayOne />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody>
        <Image 
            src={"./default.jpg"} 
            boxSize="200px" 
            objectFit="cover"
            borderRadius="md"
            mb="4"
          />
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