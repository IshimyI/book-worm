import axiosInstance from "../axiosInstance";

export default function useFavorite(user, setUser, bookId) {
  const favouritesList = user?.favourites ? user.favourites.split(" ") : [];
  const isFavorite = favouritesList.includes(String(bookId));

  const toggle = async () => {
    const previousFavourites = user.favourites || "";
    const nextList = isFavorite
      ? favouritesList.filter((id) => id !== String(bookId))
      : [...favouritesList, String(bookId)];
    setUser((prev) => ({ ...prev, favourites: nextList.join(" ") }));

    try {
      await axiosInstance.post(`/updateFavourites/${user.id}`, { bookId });
    } catch (error) {
      setUser((prev) => ({ ...prev, favourites: previousFavourites }));
      throw error;
    }
  };

  return { isFavorite, toggle };
}
