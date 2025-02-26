import { Box, Center, Flex, Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import ReviewProfile from "../ui/ReviewProfile";
import FavoriteProfile from "../ui/FavoriteProfile";
import AddBook from "../ui/AddBook";

const Office = ({ user }) => {
  const [review, setReview] = useState([
    { id: 1, IMG: "./default.jpg" },
    { id: 2, IMG: "./default.jpg" },
    { id: 3, IMG: "./default.jpg" },
    { id: 4, IMG: "./default.jpg" },
    { id: 5, IMG: "./default.jpg" },
    { id: 6, IMG: "./default.jpg" },
    { id: 7, IMG: "./default.jpg" },
    { id: 8, IMG: "./default.jpg" },
    { id: 9, IMG: "./default.jpg" },
    { id: 10, IMG: "./default.jpg" },
  ]);
  const [favorite, setFavorite] = useState([
    { id: 1, IMG: "./default.jpg" },
    { id: 2, IMG: "./default.jpg" },
    { id: 3, IMG: "./default.jpg" },
    { id: 4, IMG: "./default.jpg" },
    { id: 5, IMG: "./default.jpg" },
  ]);

  useEffect(() => {
    // (async function () {
    //   try {
    //     const reviewRes = await axiosInstance.get(
    //       "http://localhost:3000/api/review"
    //     );
    //     const favoriteRes = await axiosInstance.get(
    //       "http://localhost:3000/api/favorite"
    //     );
    //     setReview(reviewRes.data);
    //     setFavorite(favoriteRes.data);
    //   } catch (error) {
    //     console.error("Ошибка при загрузке книг:", error);
    //   }
    // })();
  }, []);

  const handleOpen = () => {
    console.log("Открывается окно с созданием книги");
  };

  return (
    <Center>
      <Box maxW="1200px" width="100%" padding="20px">
        <Flex justify="flex-end" align="center" mb="20px">
          {/* <Button colorScheme="blue" onClick={handleOpen}>Добавить рецензию</Button> */}

          <AddBook user={user} />
        </Flex>
        <ReviewProfile reviewBooks={review} />
        <Box marginTop="100px">
          <FavoriteProfile favoriteBooks={favorite} />
        </Box>
      </Box>
    </Center>
  );
};

export default Office;
