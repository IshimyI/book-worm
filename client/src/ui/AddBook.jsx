import React, { useEffect, useState } from 'react';
import { ArrowBackIcon, StarIcon } from '@chakra-ui/icons';
import { Box, Flex, Input, Text, Center, Button, Textarea, Select, ModalOverlay, Modal, ModalContent, useDisclosure, FormControl, Heading } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import SelectedBook from './SelectedBook';

const emptyInputs = {
  title: '',
  author: '',
  genre: '',
  annotation: '',
  year: '',
  img: '',
  body: '',
  user_rating: '',
};

const rating = [1, 2, 3, 4, 5];

const genres = ['Классика', 'Научная фантастика', 'Фэнтези', 'Антиутопия'];

export default function AddBook({ user }) {
  const [addBookFlag, setAddBookFlag] = useState(true);
  const [searchBookFlag, setSearchBookFlag] = useState(false);
  const [books, setBooks] = useState([]);
  const [changeBook, setChangeBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState({});
  const [inputs, setInputs] = useState(emptyInputs);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const switchAdder = () => {
    addBookFlag ? setAddBookFlag(false) : setAddBookFlag(true);
  };

  const switchSearch = () => {
    searchBookFlag ? setSearchBookFlag(false) : setSearchBookFlag(true);
    setChangeBook(false);
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    //setInputs({...selectedBook});
    console.log(book);

    setSearchBookFlag(false);
    setChangeBook(true);
  };

  useEffect(()=>{
    setInputs({...selectedBook});
    console.log(inputs)
  },[])

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setInputs((prevInputs) => ({
      ...prevInputs,
      [name]: value,
    }));
  };

  const addOwnBookHandler = async (event) => {
    event.preventDefault();
    console.log('инпуты в хэндле', inputs);
    if (!(inputs.title && inputs.author && inputs.img)) {
      console.log('Поля * должны быть заполнены');
    } else {
      try {
        const res = await axiosInstance.post(`/book/new`, {
          user_id: user.id,
          title: inputs.title,
          author: inputs.author,
          genre: inputs.genre,
          annotation: inputs.annotation,
          year: inputs.annotation,
          img: inputs.img,
          body: inputs.body,
          user_rating: inputs.user_rating,
        });
        if (res.status === 201) {
          setInputs(emptyInputs);
        }
      } catch (error) {
        console.log(error, 'что-то c add не так');
      }
    }
  };

  //временное решение для тестов
  useEffect(() => {
    async function loadBooks() {
      await fetch('http://localhost:3000/api/listAllBooks')
        .then((res) => res.json())
        .then((data) => setBooks(data))
        .catch((err) => console.error('Ошибка при загрузке книг:', err));
    }
    loadBooks();
  }, []);
  //
  return (
    <>
      <Button
        onClick={onOpen}
        sx={{
          backgroundColor: '#334d00',
          color: 'white',
        }}
      >
        Добавить книгу
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <Flex m="40px" style={{ flexDirection: 'column' }}>
            <Center>
              <Flex w="100%" style={{ flexDirection: 'column' }}>
                <Heading mb="20px">Выбор книги</Heading>
                <form onSubmit={addOwnBookHandler}>
                  {addBookFlag ? (
                    <>
                      <Input onClick={switchSearch} placeholder="Поиск в глобальной базе по названию" />

                      {searchBookFlag && (
                        <>
                          <Box w="100%" overflowY="auto" maxHeight="40vh" minH={20} mt="20px" mb="20px" borderColor="black" borderRadius="md">
                            {books.map((book) => {
                              return <SelectedBook key={book.id} book={book} handleBookClick={handleBookClick} setInputs={setInputs} inputs={inputs} />;
                            })}
                          </Box>
                        </>
                      )}
                      {changeBook ? (
                        <>
                          <SelectedBook book={selectedBook} />
                        </>
                      ) : (
                        <>
                          <Flex
                            w="40%"
                            mt="20px"
                            mb="20px"
                            style={{
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text>Не нашли подходящую книгу?</Text>
                            <Button
                              onClick={switchAdder}
                              sx={{
                                backgroundColor: '#334d00',
                                color: 'white',
                              }}
                            >
                              Добавить свою
                            </Button>
                          </Flex>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Box w="100%" minH="100px" mt="20px">
                        <Button
                          onClick={switchAdder}
                          mb="40px"
                          variant="link"
                          sx={{
                            color: '#334d00',
                          }}
                        >
                          <ArrowBackIcon />
                          Вернуться к поиску
                        </Button>

                        <Input name="title" value={inputs.title} onChange={handleInputChange} placeholder="Название" mb="20px" />
                        <Input name="author" value={inputs.author} onChange={handleInputChange} placeholder="Автор" mb="20px" />
                        <Input name="year" value={inputs.year} onChange={handleInputChange} placeholder="Год" mb="20px" />
                        <Input name="img" value={inputs.img} onChange={handleInputChange} placeholder="URL обложки" mb="20px" />
                        <Select name="genre" onChange={handleInputChange} placeholder="Жанр" mb="20px">
                          {genres.map((genre) => (
                            <option key={genre} value={genre}>
                              {genre}
                            </option>
                          ))}
                        </Select>
                      </Box>
                    </>
                  )}

                  <Flex style={{ justifyContent: 'space-between' }}>
                    <Flex
                      w="70%"
                      mt={4}
                      style={{
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Textarea name="body" value={inputs.body} onChange={handleInputChange}></Textarea>
                      <Box mt="40px" h="40px">
                        {rating.map((score) => {
                          return <StarIcon key={score} color="grey" _hover={{ color: 'gold' }} />;
                        })}
                      </Box>
                    </Flex>
                    <Flex
                      w="30%"
                      minH="80px"
                      mt="20px"
                      style={{
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'flex-end',
                      }}
                    >
                      <Button
                        type="submit"
                        sx={{
                          backgroundColor: '#334d00',
                          color: 'white',
                        }}
                      >
                        Добавить рецензию
                      </Button>
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
