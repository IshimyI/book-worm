import axiosInstance from "../axiosInstance";

// Derives favourite status from the real user.favourites list (previously
// every "add to favourites" button always started at isFavorite=false
// regardless of whether the book was actually already favourited — reloading
// a favourited book's page, or just navigating back to it, showed "Добавить
// в избранное" and a click would silently *remove* it while the button
// optimistically flipped to "В избранном").
//
// Toggling updates the shared user object immediately (optimistic), then
// confirms with the server; a failed request rolls the local state back.
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
