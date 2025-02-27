import { Button, Card, CardBody, CardFooter, Flex, Heading, Image, Stack, Text } from '@chakra-ui/react';
import React, { useState } from 'react';

export default function SelectedBook({ book, changeBook, handleBookClick, setSelectedBook }) {
  function selectBook() {
    if (!changeBook) {
      setSelectedBook(book);
      handleBookClick();
    }
  }

  return (
    <Card onClick={selectBook} direction={{ base: 'column', sm: 'row' }} overflow="hidden" variant="outline" m={2} _hover={{ border: '1px', borderColor: 'blue' }}>
      <Image objectFit="cover" w="150px" src={book.img} alt="Обложка" />

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
