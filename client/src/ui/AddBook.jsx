import React, { useEffect, useState } from 'react';
import { ArrowBackIcon, StarIcon } from '@chakra-ui/icons';
import { Box, Flex, Input, Text, Center, Button, Textarea, Select, ModalOverlay, Modal, ModalContent, useDisclosure, Heading, Stack, Alert, AlertIcon, ModalCloseButton } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import SelectedBook from './SelectedBook';
import axios from 'axios';

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

const genres = ['Классика', 'Научная фантастика', 'Фэнтези', 'Антиутопия', 'Детектив', 'Триллер', 'Роман', 'История', 'Биография', 'Комиксы', 'Молодежная литература', 'Хоррор', 'Поэзия', 'Психология'];;

export default function AddBook({ user }) {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('https://openlibrary.org/search.json', {
          params: { q: query, limit: 20 },
        });

        const booksData = response.data.docs.map((book) => ({
          title: book.title || 'Неизвестно',
          author: book.author_name?.join(', ') || 'Неизвестно',
          annotation: book.first_sentence?.join(' '),
          img: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null,
          genre: book.subject ? book.subject.slice(0, 3) : 'Жанр неизвестен',
          year: book.first_publish_year || 'Неизвестно',
        }));

        setBooks(booksData);
        console.log('booksData', response.data.docs);
      } catch (error) {
        console.error('Ошибка при загрузке книг:', error);
      }
    };

    fetchBooks();
  }, [query]);

  const [addBookFlag, setAddBookFlag] = useState(true);
  const [searchBookFlag, setSearchBookFlag] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [changeBook, setChangeBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState({});
  const [inputs, setInputs] = useState(emptyInputs);
  const [alertCode, setAlertCode] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleRating = (value) => {
    setRating(value);
    console.log(rating);
  };

  const handleMouseEnter = (value) => {
    setHover(value);
  };

  const handleMouseLeave = () => {
    setHover(rating);
  };

  const switchAdder = () => {
    addBookFlag ? setAddBookFlag(false) : setAddBookFlag(true);
  };

  const switchSearch = () => {
    //searchBookFlag ? setSearchBookFlag(false) : setSearchBookFlag(true);
    setChangeBook(false);
    setSearchBookFlag(false);
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setSearchBookFlag(false);
    setChangeBook(true);
    setQuery('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setInputs((prevInputs) => ({
      ...prevInputs,
      [name]: value,
    }));
  };

  useEffect(() => {
    setInputs({ ...selectedBook });
  }, []);

  useEffect(() => {
    if (query) {
      setSearchBookFlag(true);
    }
  }, [query]);

  const alertFunction = (alertCode, alertMessage) => {
    setAlertCode(alertCode);
    setAlertMessage(alertMessage)
    setTimeout(()=>{setAlertCode(null); setAlertMessage('')}, 2000)
  };

  const addOwnBookHandler = async (event) => {
    event.preventDefault();
    console.log('инпуты в хэндлере', inputs);
    if (!(inputs.title && inputs.author && inputs.img)) {
      alertFunction(500, 'Не все поля заполнены');
    } else {
      try {
        const res = await axiosInstance.post(`/book/new`, {
          user_id: user.id,
          title: inputs.title,
          author: inputs.author,
          genre: inputs.genre,
          annotation: inputs.annotation,
          year: inputs.year,
          img: inputs.img,
          body: inputs.body,
          user_rating: rating,
        });
        if (res.status === 200) {
          setInputs(emptyInputs);
          setRating(0);
          setHover(0);
          setChangeBook(false);
          alertFunction(200, 'Книга успешно добавлена! Спасибо!');
          setTimeout(()=>{onClose()}, 2000);
        }
      } catch (error) {
        console.log(error, 'что-то c add не так');
      }
    }
  };

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
                <Flex><Heading mb="20px">Выбор книги</Heading><ModalCloseButton /></Flex>

                {alertCode && (
                  <Stack spacing={3} mb="10px">
                    {alertCode === 500 && (
                      <Alert status="error">
                        <AlertIcon />
                        {alertMessage}
                      </Alert>
                    )}

                    {alertCode === 200 && (
                      <Alert status="success">
                      <AlertIcon />
                      {alertMessage}
                    </Alert>
                    )}

              
                  </Stack>
                )}
                <form onSubmit={addOwnBookHandler}>
                  {addBookFlag ? (
                    <>
                      <Input onClick={switchSearch} onChange={(e) => setQuery(e.target.value)} value={query} placeholder="Поиск в глобальной базе по названию" />

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
                      <Textarea type="text" name="body" value={inputs.body} onChange={handleInputChange} placeholder="Написать рецензию"></Textarea>

                      <Box mt="40px" h="40px">
                        {[...Array(5)].map((_, index) => {
                          const ratingValue = index + 1;
                          return (
                            <StarIcon
                              key={index}
                              aria-label={`Рейтинг ${ratingValue}`}
                              fontSize="25px"
                              variant="ghost"
                              color={ratingValue <= (hover || rating) ? 'gold' : 'gray.300'}
                              onClick={() => handleRating(ratingValue)}
                              onMouseEnter={() => handleMouseEnter(ratingValue)}
                              onMouseLeave={handleMouseLeave}
                            />
                          );
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
