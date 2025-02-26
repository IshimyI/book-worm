import React, { useEffect, useState } from 'react';
import { StarIcon } from '@chakra-ui/icons';
import { Box, Flex, Input, Text, Center, Button, Textarea, Select, ModalOverlay, Modal, ModalContent, useDisclosure, FormControl, Heading } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';

const emptyInputs = {
  title: '',
  author: '',
  genre: '',
  year: '',
  img: '',
  body: '',
  user_rating: '',
};

const rating = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const genres = ['классическая литература', 'детектив', 'фантастика', 'современная литература'];

export default function AddBook({ user }) {
  const [addBookFlag, setAddBookFlag] = useState(true);
  //const [searchBookFlag, setSearchBookFlag] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [inputs, setInputs] = useState(emptyInputs);

  const switchAdder = () => {
    addBookFlag ? setAddBookFlag(false) : setAddBookFlag(true);
  };

  // const switchSearch = () => {
  //   addBookFlag ? setSearchBookFlag(false) : setSearchBookFlag(true);
  // };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setInputs((prevInputs) => ({
      ...prevInputs,
      [name]: value,
    }));
  };

  const addOwnBookHandler = async (event) => {
    event.preventDefault();
    if (!(inputs.title && inputs.author && inputs.img)) {
      console.log('Поля * должны быть заполнены');
    } else {
      try {
        const res = await axiosInstance.post(`/book/new`, {
          title: inputs.title,
          author: inputs.author,
          genre: inputs.genre,
          year: inputs.annotation,
          img: inputs.img,
        });
        if (res.status === 201) {
          //тут бы желательно получить как минимум ID книги
          setInputs(emptyInputs);
        }
      } catch (error) {
        console.log(error, 'что-то c add не так');
      }
    }
  };

  const addReviewHandler = async (event) => {
    event.preventDefault();
    if (!(inputs.body && inputs.user_rating)) {
      console.log('Поля должны быть заполнены');
    } else {
      try {
        const res = await axiosInstance.post(`/api/review/new`, {
          body: inputs.body,
          user_rating: inputs.user_rating,
          book_id: book.id, //который мы получим из предыдущей функции
          user_id: user.id,
        });
        if (res.status === 201) {
          setInputs(emptyInputs);
        }
      } catch (error) {
        console.log(error, 'что-то c add не так');
      }
    }
  };

  return (
    <>
      <Button onClick={onOpen}>Open Modal</Button>

      <Modal isOpen={isOpen} onClose={onClose} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <Flex border="1px" borderColor="#272018" borderRadius="md" m={4} style={{ flexDirection: 'column' }}>
            <Center m={4}>
              <Flex w="100%" style={{ flexDirection: 'column' }}>
                <Heading>Выбор книги</Heading>
                {addBookFlag ? (
                  <>
                    <Text>поиск</Text>
                    <Input placeholder="введите название" />
                    <Box w="100%" minH={20} mt={4} border="1px" borderColor="black" borderRadius="md"></Box>
                    <Flex
                      w="40%"
                      mt={5}
                      style={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text>Не нашли подходящую книгу?</Text>
                      <Button onClick={switchAdder}>Добавить свою</Button>
                    </Flex>
                  </>
                ) : (
                  <>
                    <Box w="100%" minH={20} mt={4}>
                      <Button onClick={switchAdder} mb={4}>
                        Вернуться к поиску
                      </Button>
                      <form onSubmit={addOwnBookHandler}>
                        <Input name="title" value={inputs.title} onChange={handleInputChange} placeholder="*название" mb={4} />
                        <Input name="author" value={inputs.author} onChange={handleInputChange} placeholder="*автор" mb={4} />
                        <Input name="year" value={inputs.year} onChange={handleInputChange} placeholder="год" mb={4} />
                        <Input name="img" value={inputs.img} onChange={handleInputChange} placeholder="*URL обложки" mb={4} />
                        <Select name="genre" onChange={handleInputChange} placeholder="жанр" mb={4}>
                          {genres.map((genre) => (
                            <option key={genre} value={genre}>
                              {genre}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit">Добавить</Button>
                      </form>
                    </Box>
                  </>
                )}
                <form onSubmit={addReviewHandler}>
                  <Flex style={{ justifyContent: 'space-between' }}>
                    <Flex
                      w="70%"
                      mt={4}
                      style={{
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Textarea name="body" value={inputs.body} onChange={handleInputChange} w="100%" minH={20} border="1px" borderColor="black" borderRadius="md" placeholder="добавьте рецензию"></Textarea>
                      <Box mt={10} h={10} >
                        {rating.map((score) => {
                          return <StarIcon key={score} color='grey' _hover={{color: 'gold'}}/>;
                        })}
                      </Box>
                      
                    </Flex>
                    <Flex
                      w="30%"
                      minH={20}
                      mt={4}
                      style={{
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'flex-end',
                      }}
                    >
                      <Button type="submit">Добавить рецензию</Button>
                    </Flex>
                  </Flex>
                </form>
              </Flex>
            </Center>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
}
