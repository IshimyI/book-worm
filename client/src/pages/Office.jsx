import { Box, Center, Flex, Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import ReviewProfile from "../ui/ReviewProfile";
import FavoriteProfile from "../ui/FavoriteProfile";
import AddBook from "../ui/AddBook";
import BookModal from "../ui/BookModal";

const Office = ({ user }) => {
  console.log(user);
  const [favoriteBooks, setFavoriteBooks] = useState([]);

  const [review, setReview] = useState([
    {
      id: 1,
      title: "Убийство в Восточном экспрессе",
      author: "Агата Кристи",
      annotation:
        "Убийство в Восточном экспрессе — один из самых известных детективных романов Агаты Кристи, впервые опубликованный в 1934 году. Это произведение стало классикой жанра и принесло автору мировую славу. Книга входит в серию произведений о знаменитом бельгийском сыщике Эркюле Пуаро, чей острый ум и внимание к деталям позволяют ему раскрывать самые запутанные преступления.Действие романа разворачивается в поезде Восточный экспресс, следующем из Стамбула в Кале.",
      rating: "4.5",
      quantity_rate: 325,
      img: "https://example.com/images/ubistvo_v_vostochnom_ekspresse.jpg",
      genre: "Детектив",
      year: 1934,
    },
    {
      id: 2,
      title: "1984",
      author: "Джордж Оруэлл",
      annotation:
        "Антиутопический роман, описывающий тоталитарное общество, где правительство контролирует все аспекты жизни граждан.",
      rating: "4.8",
      quantity_rate: 580,
      img: "https://example.com/images/1984.jpg",
      genre: "Антиутопия",
      year: 1949,
    },
    {
      id: 3,
      title: "Мастер и Маргарита",
      author: "Михаил Булгаков",
      annotation:
        "Роман, сочетающий в себе сатиру, мистику и философские размышления, рассказывает о визите дьявола в Москву и трагической любви Мастера и Маргариты.",
      rating: "4.9",
      quantity_rate: 712,
      img: "https://example.com/images/master_i_margarita.jpg",
      genre: "Классика",
      year: 1967,
    },
    {
      id: 4,
      title: "Гордость и предубеждение",
      author: "Джейн Остин",
      annotation:
        "Роман о любви, семье и социальных отношениях в Англии начала XIX века, с акцентом на историю Элизабет Беннет и мистера Дарси.",
      rating: "4.6",
      quantity_rate: 450,
      img: "https://example.com/images/gordost_i_predubezhdenie.jpg",
      genre: "Классика",
      year: 1813,
    },
    {
      id: 5,
      title: "Гарри Поттер и философский камень",
      author: "Джоан Роулинг",
      annotation:
        "История о юном волшебнике Гарри Поттере, который узнает о своем магическом наследии и поступает в школу чародейства и волшебства Хогвартс.",
      rating: "4.7",
      quantity_rate: 920,
      img: "https://example.com/images/garri_potter_i_filosofskiy_kamen.jpg",
      genre: "Фэнтези",
      year: 1997,
    },
  ]);
  const [favorite, setFavorite] = useState([
    {
      id: 1,
      title: "Убийство в Восточном экспрессе",
      author: "Агата Кристи",
      annotation:
        "Знаменитый детектив Эркюль Пуаро расследует загадочное убийство в роскошном поезде, застрявшем в снегах Югославии.",
      rating: "4.5",
      quantity_rate: 325,
      img: "https://example.com/images/ubistvo_v_vostochnom_ekspresse.jpg",
      genre: "Детектив",
      year: 1934,
    },
    {
      id: 2,
      title: "1984",
      author: "Джордж Оруэлл",
      annotation:
        "Антиутопический роман, описывающий тоталитарное общество, где правительство контролирует все аспекты жизни граждан.",
      rating: "4.8",
      quantity_rate: 580,
      img: "https://example.com/images/1984.jpg",
      genre: "Антиутопия",
      year: 1949,
    },
    {
      id: 3,
      title: "Мастер и Маргарита",
      author: "Михаил Булгаков",
      annotation:
        "Роман, сочетающий в себе сатиру, мистику и философские размышления, рассказывает о визите дьявола в Москву и трагической любви Мастера и Маргариты.",
      rating: "4.9",
      quantity_rate: 712,
      img: "https://example.com/images/master_i_margarita.jpg",
      genre: "Классика",
      year: 1967,
    },
    {
      id: 4,
      title: "Гордость и предубеждение",
      author: "Джейн Остин",
      annotation:
        "Роман о любви, семье и социальных отношениях в Англии начала XIX века, с акцентом на историю Элизабет Беннет и мистера Дарси.",
      rating: "4.6",
      quantity_rate: 450,
      img: "https://example.com/images/gordost_i_predubezhdenie.jpg",
      genre: "Классика",
      year: 1813,
    },
    {
      id: 5,
      title: "Гарри Поттер и философский камень",
      author: "Джоан Роулинг",
      annotation:
        "История о юном волшебнике Гарри Поттере, который узнает о своем магическом наследии и поступает в школу чародейства и волшебства Хогвартс.",
      rating: "4.7",
      quantity_rate: 920,
      img: "https://example.com/images/garri_potter_i_filosofskiy_kamen.jpg",
      genre: "Фэнтези",
      year: 1997,
    },
  ]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    (async function () {
      try {
        const reviewRes = await axiosInstance.get(
          "http://localhost:3000/api/review"
        );
        const favoriteRes = await axiosInstance.get(
          `http://localhost:3000/api/favourites/${user.id}`
        );
        setReview(reviewRes.data);
        setFavoriteBooks(favoriteRes.data);
      } catch (error) {
        console.error("Ошибка при загрузке книг:", error);
      }
    })();
  }, [user.id]);

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  return (
    <div className="conteyner">
      <Center>
        <Box maxW="1200px" width="100%" padding="20px">
          <Flex justify="flex-end" align="center" mb="20px">
            <AddBook user={user} />
          </Flex>
          <ReviewProfile
            reviewBooks={review}
            handleBookClick={handleBookClick}
          />
          <Box marginTop="100px">
            <FavoriteProfile
              favoriteBooks={favoriteBooks}
              handleBookClick={handleBookClick}
              setFavoriteBooks={setFavoriteBooks}
            />
          </Box>
        </Box>
        <BookModal
          book={selectedBook}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={user}
        />
      </Center>
    </div>
  );
};

export default Office;
