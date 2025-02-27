import { Button, Card, CardBody, CardFooter, Heading, Image, Stack, Text } from '@chakra-ui/react';
import React from 'react';

export default function SelectedBook({book}) {
  return (
    <Card direction={{ base: 'column', sm: 'row' }} overflow="hidden" variant="outline" m={2}>
      <Image objectFit="cover" w='200px' src={book.img} alt="Обложка" />

      <Stack>
        <CardBody>
          <Heading size="md">{book.title}</Heading>
          <Text py="2">{book.author}</Text>
          <Text py="2">{book.annotation}</Text>
        </CardBody>

        <CardFooter>
          {book.year}
        </CardFooter>
      </Stack>
    </Card>
  );
}
