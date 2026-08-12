/* eslint-disable react/prop-types */
import { Card, CardBody, CardFooter, Flex, Heading, Image, Stack, Text } from '@chakra-ui/react';

export default function SelectedBook({ book, handleBookClick, setInputs }) {
  function selectBook(book) {
    setInputs(book);
    handleBookClick(book);
  }

  return (
    <Card onClick={() => selectBook(book)} rounded={10} direction={{ base: 'column', sm: 'row' }} overflow="hidden" variant="outline" m={2} _hover={{ border: '1px', borderColor: 'blue' }}>
     
      <Image objectFit="cover" w="150px" rounded={10} m='1px' src={book.img} alt="Обложка" />

      <Stack>
        <CardBody>
          <Heading size="md">{book.title}</Heading>
          <Text py="2">{book.author}</Text>
          <Text py="2">{book.annotation}</Text>
        </CardBody>

        <CardFooter>
          <Flex flexDirection="column">
            <Text>{book.genre}</Text>
            <Text>{book.year}</Text>
          </Flex>
        </CardFooter>
      </Stack>
    </Card>
  );
}
