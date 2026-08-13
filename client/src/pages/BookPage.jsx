/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Box, Center, Flex, Image, Text, Heading, Stack, Divider, Avatar, Textarea, Button, Select, useToast, Skeleton, SkeletonText, SkeletonCircle, useColorModeValue, Badge } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import { openLibrarySearchUrl } from '../utils/openLibrary';
import useSeoMeta from '../utils/useSeoMeta';
import StarRatingInput from '../ui/StarRatingInput';
import useFavorite from '../utils/useFavorite';
import PageCard from '../ui/PageCard';
import AddToListMenu from '../ui/AddToListMenu';
import ReadingStatusSelect from '../ui/ReadingStatusSelect';
import ReviewComments from '../ui/ReviewComments';
import BookQuotes from '../ui/BookQuotes';
import SpoilerText from '../ui/SpoilerText';
import { relativeTime } from '../utils/relativeTime';
import { addRecentlyViewed } from '../utils/recentlyViewed';
import { coverThumbUrl } from '../utils/coverUrl';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import useConfirm from '../ui/useConfirm';
import Breadcrumbs from '../ui/Breadcrumbs';
import useUndoableAction from '../ui/useUndoableAction';

export default function BookPage({ user, setUser }) {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState('newest');
  const [inputBody, setInputBody] = useState('');
  const [rating, setRating] = useState(0);
  const [recommendations, setRecommendations] = useState({ sameGenre: [], sameReaders: [] });
  const { isFavorite, toggle: toggleFavorite } = useFavorite(user, setUser, book?.id);
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const runUndoable = useUndoableAction();

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get(`/book/${id}`)
      .then((res) => {
        setBook(res.data);
        setReviews(res.data.reviews || []);
        addRecentlyViewed(res.data);
      })
      .catch(() => setBook(false))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    axiosInstance
      .get(`/book/${id}/recommendations`)
      .then((res) => setRecommendations(res.data))
      .catch(() => setRecommendations({ sameGenre: [], sameReaders: [] }));
  }, [id]);

  useSeoMeta({
    enabled: Boolean(book),
    title: book?.title,
    description: book?.annotation || (book ? `${book.title}, ${book.author}` : ''),
    // A branded card (cover + title + rating) generated server-side, not
    // the bare cover — social crawlers don't run this JS anyway (see the
    // server-rendered /books/:id bot response for the path that reaches
    // them), but anything that *does* execute JS here gets the nicer image.
    image: book ? `${import.meta.env.VITE_TARGET}/api/v1/book/${book.id}/og-image.png` : undefined,
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Ссылка скопирована', status: 'success', duration: 1500, isClosable: true });
    } catch {
      toast({ title: 'Не удалось скопировать ссылку', status: 'error', duration: 2000, isClosable: true });
    }
  };

  const handleFavorites = async () => {
    if (!user) {
      toast({ title: 'Войдите, чтобы добавлять книги в избранное', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    const wasFavorite = isFavorite;
    try {
      await toggleFavorite();
      toast({
        title: wasFavorite ? 'Убрано из избранного' : 'Добавлено в избранное',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось обновить избранное', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;
  const isEditing = Boolean(myReview);

  // Prefill the form with the existing review as soon as it's known, so
  // opening the form to "write a review" on a book you already reviewed
  // shows what you wrote instead of a blank box.
  useEffect(() => {
    if (myReview) {
      setInputBody(myReview.user_rev);
      setRating(myReview.user_raeting);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview?.id]);

  const startEditing = () => {
    setInputBody(myReview.user_rev);
    setRating(myReview.user_raeting);
    document.getElementById('reviewForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const draftKey = book ? `bw_draft_review_${book.id}` : null;

  // Restore an unsaved draft once the book (and whether the user already
  // has a review to edit instead) is known — only for the "write a new
  // review" case, so it never clobbers the pre-filled edit form above.
  useEffect(() => {
    if (!draftKey || isEditing) return;
    const draft = localStorage.getItem(draftKey);
    if (draft) setInputBody(draft);
  }, [draftKey, isEditing]);

  // ...and keep saving it as they type, so navigating away by accident
  // doesn't lose a half-written review.
  useEffect(() => {
    if (!draftKey || isEditing) return;
    if (inputBody) {
      localStorage.setItem(draftKey, inputBody);
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, isEditing, inputBody]);

  const deleteReview = async () => {
    if (!myReview || !(await confirm('Удалить вашу рецензию?'))) return;
    const removed = myReview;
    const removedIndex = reviews.findIndex((r) => r.id === removed.id);
    setReviews((prev) => prev.filter((r) => r.id !== removed.id));

    const restore = () => setReviews((prev) => {
      if (prev.some((r) => r.id === removed.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(removedIndex, next.length), 0, removed);
      return next;
    });

    runUndoable({
      message: 'Рецензия удалена',
      onUndo: restore,
      onCommit: async () => {
        try {
          await axiosInstance.delete(`/review/${removed.id}`);
        } catch (error) {
          restore();
          toast({ title: error.response?.data?.message || 'Не удалось удалить рецензию', status: 'error', duration: 2500, isClosable: true });
        }
      },
    });
  };

  const toggleHelpful = async (review) => {
    if (!user) {
      toast({ title: 'Войдите, чтобы отметить рецензию полезной', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    try {
      const res = await axiosInstance.post(`/review/${review.id}/helpful`);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, helpfulCount: res.data.helpfulCount, helpfulByMe: res.data.helpful } : r))
      );
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось отметить рецензию', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const updateCommentCount = (reviewId, count) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, commentCount: count } : r)));
  };

  const reportReview = async (review) => {
    if (!user) {
      toast({ title: 'Войдите, чтобы отправить жалобу', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    try {
      await axiosInstance.post(`/review/${review.id}/report`);
      toast({ title: 'Жалоба отправлена, спасибо', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось отправить жалобу', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const addReviewHandler = async (event) => {
    event.preventDefault();
    if (!user) {
      toast({ title: 'Войдите, чтобы оставить рецензию', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    if (!inputBody || !rating) {
      toast({ title: 'Напишите текст и поставьте оценку', status: 'warning', duration: 2500, isClosable: true });
      return;
    }
    try {
      const res = await axiosInstance.post(`/book/new`, {
        user_id: user.id,
        body: inputBody,
        title: book.title,
        author: book.author,
        user_rating: rating,
      });
      if (res.status === 200) {
        setReviews((prev) => {
          const already = prev.some((r) => r.user_id === user.id);
          const updated = {
            id: res.data.review.id,
            userName: user.name,
            user_rev: inputBody,
            user_id: user.id,
            user_raeting: rating,
            createdAt: res.data.review.createdAt,
          };
          return already
            ? prev.map((r) => (r.user_id === user.id ? updated : r))
            : [updated, ...prev];
        });
        setInputBody('');
        setRating(0);
        toast({
          title: isEditing ? 'Рецензия обновлена' : 'Рецензия добавлена',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Не удалось сохранить рецензию';
      toast({ title: message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (reviewSort === 'rating') {
      list.sort((a, b) => (b.user_raeting ?? 0) - (a.user_raeting ?? 0));
    } else if (reviewSort === 'helpful') {
      list.sort((a, b) => (b.helpfulCount ?? 0) - (a.helpfulCount ?? 0));
    } else if (reviewSort === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    // Your own review always leads, regardless of sort order.
    if (user) {
      list.sort((a, b) => (b.user_id === user.id ? 1 : 0) - (a.user_id === user.id ? 1 : 0));
    }
    return list;
  }, [reviews, reviewSort, user]);

  const reviewCardBg = useColorModeValue('white', '#25251c');
  const ownReviewBg = useColorModeValue('#f7f8ef', '#33361f');
  const skeletonBorder = useColorModeValue('#eee', '#3a3a30');

  if (loading) {
    return (
      <PageCard maxW="1000px">
        <Flex gap="30px" flexWrap="wrap">
          <Skeleton width="250px" height="350px" borderRadius="md" />
          <Box flex="1" minW="250px">
            <Skeleton height="32px" width="70%" mb="14px" />
            <Skeleton height="16px" width="40%" mb="20px" />
            <SkeletonText noOfLines={4} spacing="3" mb="20px" />
            <Skeleton height="40px" width="180px" />
          </Box>
        </Flex>
        <Divider my="30px" />
        <Skeleton height="24px" width="150px" mb="20px" />
        {[...Array(3)].map((_, i) => (
          <Flex key={i} gap="14px" p="12px" mb="12px" border="1px solid" borderColor={skeletonBorder} borderRadius="md">
            <SkeletonCircle size="10" />
            <Box flex="1"><SkeletonText noOfLines={2} spacing="2" /></Box>
          </Flex>
        ))}
      </PageCard>
    );
  }

  if (!book) {
    return (
      <Center py="100px" flexDirection="column">
        <Text fontSize="xl" mb="20px">Книга не найдена</Text>
        <NavLink to="/">
          <Button backgroundColor="#334d00" color="white">На главную</Button>
        </NavLink>
      </Center>
    );
  }

  return (
    <PageCard maxW="1000px">
      {ConfirmDialog}
      <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: book.title }]} />

      <Flex gap="30px" flexWrap="wrap">
        <Image src={book.img || './default.jpg'} alt={book.title} width="250px" height="350px" objectFit="cover" borderRadius="md" />
        <Box flex="1" minW="250px">
          <Heading as="h1" size="lg" mb="10px">
            {book.title}
            {book.status === 'pending' && (
              <Badge ml="10px" colorScheme="yellow" verticalAlign="middle">На модерации</Badge>
            )}
          </Heading>
          <Text color="bw.textMuted" mb="10px">{book.author}</Text>
            <Stack spacing={2} mb="20px">
              <Text fontSize="sm">
                <b>Жанр:</b> {book.genre}
                {book.additionalGenres?.length > 0 && `, ${book.additionalGenres.join(', ')}`}
              </Text>
              <Text fontSize="sm"><b>Год:</b> {book.year}</Text>
              <Text fontSize="sm"><b>Рейтинг:</b> {book.rating ?? 0} ⭐ ({book.quantity_rate ?? 0} отзывов)</Text>
            </Stack>
            <Text mb="20px">{book.annotation}</Text>
            <Flex gap="12px" flexWrap="wrap">
              <Button backgroundColor={isFavorite ? '#334d00' : '#6b7412'} color="white" onClick={handleFavorites}>
                {isFavorite ? '✓ В избранном' : 'Добавить в избранное'}
              </Button>
              <AddToListMenu user={user} bookId={book.id} />
              <ReadingStatusSelect
                user={user}
                bookId={book.id}
                status={book.readingStatus}
                onChange={(status) => setBook((prev) => ({ ...prev, readingStatus: status }))}
              />
              <Button
                as="a"
                href={openLibrarySearchUrl(book.title, book.author)}
                target="_blank"
                rel="noreferrer"
                variant="outline"
                sx={{ color: '#334d00', borderColor: '#334d00' }}
              >
                Читать / найти книгу
              </Button>
              <Button variant="ghost" color="bw.textMuted" onClick={copyLink}>
                🔗 Скопировать ссылку
              </Button>
            </Flex>
          </Box>
        </Flex>

        <Divider my="30px" />

        <BookQuotes bookId={book.id} user={user} />

        <Divider my="30px" />

        <Flex justify="space-between" align="center" mb="20px" flexWrap="wrap" gap="10px">
          <Heading as="h2" size="md">Рецензии</Heading>
          <Select size="sm" w="200px" aria-label="Сортировка рецензий" value={reviewSort} onChange={(e) => setReviewSort(e.target.value)}>
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="rating">По оценке</option>
            <option value="helpful">Сначала полезные</option>
          </Select>
        </Flex>
        <Box maxH="400px" overflowY="auto" mb="20px">
          {sortedReviews.length > 0 ? (
            sortedReviews.map((review) => {
              const isMine = user && review.user_id === user.id;
              return (
                <Box
                  key={review.id}
                  p="3"
                  border={isMine ? '2px solid' : '1px solid'}
                  borderColor={isMine ? 'bw.accent' : 'bw.border'}
                  bg={isMine ? ownReviewBg : reviewCardBg}
                  borderRadius="md"
                  mb="3"
                >
                  <Stack direction="row" spacing="4" align="center">
                    <Avatar name={review.userName} src={resolveAvatarUrl(review.userAvatarUrl)} />
                    <Box flex="1">
                      <Flex justify="space-between" align="center">
                        <Box>
                          <Text fontWeight="bold">
                            <NavLink to={`/users/${review.user_id}`} style={{ textDecoration: 'none' }}>
                              <Text as="span" _hover={{ textDecoration: 'underline', color: '#4b5320' }}>{review.userName}</Text>
                            </NavLink>
                            {' '}
                            {isMine && <Text as="span" fontSize="xs" color="#4b5320" fontWeight="bold">(ваш отзыв)</Text>}
                          </Text>
                          <Text fontSize="xs" color="bw.textMuted">{relativeTime(review.createdAt)}</Text>
                        </Box>
                        {isMine ? (
                          <Flex gap="10px">
                            <Button size="xs" variant="link" sx={{ color: '#4b5320' }} onClick={startEditing}>
                              Редактировать
                            </Button>
                            <Button size="xs" variant="link" sx={{ color: '#a4522a' }} onClick={deleteReview}>
                              Удалить
                            </Button>
                          </Flex>
                        ) : (
                          <Button size="xs" variant="link" color="bw.textMuted" onClick={() => reportReview(review)}>
                            Пожаловаться
                          </Button>
                        )}
                      </Flex>
                      <Divider my="2" />
                      <SpoilerText text={review.user_rev} />
                      <Flex justify="space-between" align="center" mt="6px">
                        <Text>{review.user_raeting} ⭐</Text>
                        {isMine ? (
                          <Text fontSize="sm" color="bw.textMuted">
                            👍 {review.helpfulCount || 0}
                          </Text>
                        ) : (
                          <Button
                            size="xs"
                            variant={review.helpfulByMe ? 'solid' : 'outline'}
                            sx={
                              review.helpfulByMe
                                ? { backgroundColor: '#4b5320', color: 'white' }
                                : { color: '#4b5320', borderColor: '#4b5320' }
                            }
                            onClick={() => toggleHelpful(review)}
                          >
                            👍 Полезно {review.helpfulCount > 0 ? `(${review.helpfulCount})` : ''}
                          </Button>
                        )}
                      </Flex>
                      <ReviewComments user={user} review={review} onCountChange={updateCommentCount} />
                    </Box>
                  </Stack>
                </Box>
              );
            })
          ) : (
            <Text color="bw.textMuted" textAlign="center" py="6">
              Пока нет рецензий — будьте первым
            </Text>
          )}
        </Box>

        <Box id="reviewForm">
          {isEditing && (
            <Text fontSize="sm" color="#4b5320" fontWeight="bold" mb="6px">Вы редактируете свой отзыв</Text>
          )}
          <Textarea value={inputBody} onChange={(e) => setInputBody(e.target.value)} placeholder="Напиши свою рецензию" mb="6px" />
          <Text fontSize="xs" color="bw.textMuted" mb="10px">
            Спойлер? Оберните текст в ||двойные вертикальные черты||, и его скроют до клика.
          </Text>
          <Box mb="15px">
            <StarRatingInput rating={rating} onChange={setRating} />
          </Box>
          <Button backgroundColor="#334d00" color="white" onClick={addReviewHandler}>
            {isEditing ? 'Обновить рецензию' : 'Добавить рецензию'}
          </Button>
        </Box>

        {recommendations.sameGenre.length > 0 && (
          <>
            <Divider my="30px" />
            <Heading as="h2" size="md" mb="16px">Похожие книги</Heading>
            <BookStrip books={recommendations.sameGenre} />
          </>
        )}

        {recommendations.sameReaders.length > 0 && (
          <>
            <Divider my="30px" />
            <Heading as="h2" size="md" mb="16px">Читатели этой книги также читали</Heading>
            <BookStrip books={recommendations.sameReaders} />
          </>
        )}
    </PageCard>
  );
}

function BookStrip({ books }) {
  return (
    <Flex gap="16px" overflowX="auto" pb="8px">
      {books.map((rec) => (
        <NavLink key={rec.id} to={`/books/${rec.id}`} style={{ flexShrink: 0 }}>
          <Box width="130px" _hover={{ opacity: 0.85 }}>
            <Image
              src={coverThumbUrl(rec.img) || './default.jpg'}
              alt={rec.title}
              loading="lazy"
              width="130px"
              height="180px"
              objectFit="cover"
              borderRadius="6px"
            />
            <Text fontSize="sm" fontWeight="bold" mt="6px" noOfLines={2}>{rec.title}</Text>
            <Text fontSize="xs" color="bw.textMuted">{rec.rating ?? 0} ⭐</Text>
          </Box>
        </NavLink>
      ))}
    </Flex>
  );
}
