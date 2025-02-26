import React, { useState } from 'react';
import { Box, Flex, Input, Text, Select, Center, Button, Textarea } from '@chakra-ui/react';

export default function AddBook() {
    
  const [searchBook, setSearchBook] = useState(false);

  return (
    <Center border="1px" borderColor="black" borderRadius="md" m={4}>
      <Flex w="90%" m={10} style={{ flexDirection: 'column' }}>
        <Text>поиск по базе книг</Text>
        <Input></Input>
        <Box w="100%" minH={20} mt={4} border="1px" borderColor="black" borderRadius="md"></Box>
        <Flex style={{ justifyContent: 'space-between' }}>
          <Flex w="50%" mt={4} style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
            <Textarea w="100%" minH={20} border="1px" borderColor="black" borderRadius="md"></Textarea>
            <Box mt={10}>RATING</Box>
          </Flex>
          <Flex w="50%" minH={20} mt={4} style={{ flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
            <Button>Добавить рецензию</Button>
          </Flex>
        </Flex>
      </Flex>
    </Center>
  );
}
