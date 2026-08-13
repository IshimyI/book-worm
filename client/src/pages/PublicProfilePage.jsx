/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Box, Center, Heading, Text, Stack, Avatar, Divider, Image, Flex, Button, Textarea, Badge, Skeleton, SkeletonCircle, SkeletonText, useToast } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import axiosInstance from '../axiosInstance';
import useSeoMeta from '../utils/useSeoMeta';
import { coverThumbUrl } from '../utils/coverUrl';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import PageCard from '../ui/PageCard';
import SpoilerText from '../ui/SpoilerText';
import { withCount } from '../utils/pluralize';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });

export default function PublicProfilePage({ user }) {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [followBusy, setFollowBusy] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const toast = useToast();

  useSeoMeta({
    enabled: Boolean(profile),
    title: profile ? `${profile.name} — профиль` : '',
    description: profile ? `${withCount(profile.reviewCount, ['рецензия', 'рецензии', 'рецензий'])} от ${profile.name} на Mr Book Worm` : '',
  });

  useEffect(() => {
    setPage(1);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get(`/users/${id}/profile`, { params: { page, pageSize: 10 } })
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(false))
      .finally(() => setLoading(false));
  }, [id, page]);

  if (loading) {
    return (
      <PageCard>
        <Flex align="center" gap="16px" mb="10px">
          <SkeletonCircle size="16" />
          <Box flex="1">
            <Skeleton height="24px" width="200px" mb="10px" />
            <Skeleton height="14px" width="260px" />
          </Box>
        </Flex>
        <Divider my="20px" />
        <Skeleton height="20px" width="120px" mb="16px" />
        {[...Array(3)].map((_, i) => (
          <Flex key={i} gap="14px" p="12px" mb="14px" border="1px solid" borderColor="bw.border" borderRadius="md">
            <Skeleton width="60px" height="84px" borderRadius="4px" />
            <Box flex="1"><SkeletonText noOfLines={2} spacing="2" /></Box>
          </Flex>
        ))}
      </PageCard>
    );
  }

  if (!profile) {
    return (
      <Center py="100px" flexDirection="column">
        <Text fontSize="xl" mb="20px">Пользователь не найден</Text>
        <NavLink to="/">
          <Button backgroundColor="#334d00" color="white">На главную</Button>
        </NavLink>
      </Center>
    );
  }

  const isOwnProfile = user && user.id === profile.id;

  const startEditingBio = () => {
    setBioInput(profile.bio || '');
    setEditingBio(true);
  };

  const saveBio = async () => {
    setSavingBio(true);
    try {
      const res = await axiosInstance.patch('/users/me/bio', { bio: bioInput });
      setProfile((prev) => ({ ...prev, bio: res.data.bio }));
      setEditingBio(false);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось сохранить био', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setSavingBio(false);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast({ title: 'Войдите, чтобы подписываться на пользователей', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    setFollowBusy(true);
    try {
      const res = await axiosInstance.post(`/users/${id}/follow`);
      setProfile((prev) => ({ ...prev, isFollowedByMe: res.data.following, followerCount: res.data.followerCount }));
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось изменить подписку', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <PageCard>
      <NavLink to="/">
        <Button variant="link" mb="20px" sx={{ color: '#334d00' }}>
          <ArrowBackIcon mr="6px" /> К каталогу
        </Button>
      </NavLink>

      <Flex align="center" gap="16px" mb="10px" flexWrap="wrap">
        <Avatar name={profile.name} src={resolveAvatarUrl(profile.avatarUrl)} size="lg" />
        <Box flex="1">
          <Heading as="h1" size="lg">{profile.name}</Heading>
          <Text color="bw.textMuted" fontSize="sm">
            На сайте с {dateFormatter.format(new Date(profile.memberSince))} · {withCount(profile.reviewCount, ['рецензия', 'рецензии', 'рецензий'])}
          </Text>
          <Text color="bw.textMuted" fontSize="sm">
            {withCount(profile.followerCount, ['подписчик', 'подписчика', 'подписчиков'])} · {withCount(profile.followingCount, ['подписка', 'подписки', 'подписок'])}
          </Text>
        </Box>
        {!isOwnProfile && (
          <Button
            isLoading={followBusy}
            onClick={toggleFollow}
            sx={
              profile.isFollowedByMe
                ? { backgroundColor: 'transparent', color: '#334d00', border: '1px solid #334d00' }
                : { backgroundColor: '#334d00', color: 'white' }
            }
          >
            {profile.isFollowedByMe ? '✓ Вы подписаны' : 'Подписаться'}
          </Button>
        )}
      </Flex>

      {editingBio ? (
        <Box mb="20px">
          <Textarea
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value)}
            placeholder="Расскажите немного о себе и своих читательских вкусах"
            maxLength={500}
            rows={3}
            mb="8px"
          />
          <Button size="sm" isLoading={savingBio} onClick={saveBio} sx={{ backgroundColor: '#334d00', color: 'white' }} mr="8px">
            Сохранить
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingBio(false)}>Отмена</Button>
        </Box>
      ) : (
        <Box mb="20px">
          {profile.bio ? (
            <Text whiteSpace="pre-wrap">{profile.bio}</Text>
          ) : (
            isOwnProfile && <Text color="bw.textMuted" fontSize="sm">Расскажите о себе — нажмите «Изменить», чтобы добавить био.</Text>
          )}
          {isOwnProfile && (
            <Button size="xs" variant="link" mt="4px" sx={{ color: '#334d00' }} onClick={startEditingBio}>
              Изменить
            </Button>
          )}
        </Box>
      )}

      {profile.topGenres?.length > 0 && (
        <Flex gap="6px" mb="20px" flexWrap="wrap">
          <Text fontSize="sm" color="bw.textMuted">Любимые жанры:</Text>
          {profile.topGenres.map((genre) => (
            <Badge key={genre} colorScheme="green">{genre}</Badge>
          ))}
        </Flex>
      )}

      {profile.achievements?.length > 0 && (
        <Box mb="20px">
          <Text fontSize="sm" color="bw.textMuted" mb="8px">Достижения:</Text>
          <Flex gap="8px" flexWrap="wrap">
            {(isOwnProfile ? profile.achievements : profile.achievements.filter((a) => a.achieved)).map((a) => (
              <Badge
                key={a.id}
                title={a.achieved ? a.label : `${a.label}: ${a.progress}/${a.goal}`}
                colorScheme={a.achieved ? 'yellow' : 'gray'}
                opacity={a.achieved ? 1 : 0.5}
                fontSize="0.85em"
                px="8px"
                py="4px"
              >
                {a.icon} {a.label}{!a.achieved && ` (${a.progress}/${a.goal})`}
              </Badge>
            ))}
          </Flex>
        </Box>
      )}

      <Divider my="20px" />

      <Heading as="h2" size="md" mb="16px">Рецензии</Heading>
      {profile.reviews.length === 0 ? (
        <Text color="bw.textMuted">Пока нет рецензий</Text>
      ) : (
        <Stack spacing="14px">
          {profile.reviews.map((review) => (
            <NavLink key={review.id} to={`/books/${review.bookId}`}>
              <Flex
                gap="14px"
                p="12px"
                border="1px solid"
                borderColor="bw.border"
                borderRadius="md"
                _hover={{ borderColor: '#4b5320', boxShadow: 'sm' }}
                transition="border-color 0.15s ease"
              >
                <Image src={coverThumbUrl(review.bookImg)} alt={review.bookTitle} loading="lazy" width="60px" height="84px" objectFit="cover" borderRadius="4px" />
                <Box>
                  <Text fontWeight="bold">{review.bookTitle}</Text>
                  <SpoilerText text={review.body} fontSize="sm" color="bw.textMuted" noOfLines={2} />
                  <Text fontSize="sm">{review.rating} ⭐</Text>
                </Box>
              </Flex>
            </NavLink>
          ))}
        </Stack>
      )}

      {profile.totalPages > 1 && (
        <Flex justifyContent="center" alignItems="center" columnGap="10px" mt="20px">
          <Button
            size="sm"
            isDisabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            sx={{ backgroundColor: '#334d00', color: 'white' }}
          >
            ← Назад
          </Button>
          <Text fontSize="sm" color="bw.textMuted">
            Страница {page} из {profile.totalPages}
          </Text>
          <Button
            size="sm"
            isDisabled={page >= profile.totalPages}
            onClick={() => setPage((p) => Math.min(profile.totalPages, p + 1))}
            sx={{ backgroundColor: '#334d00', color: 'white' }}
          >
            Вперёд →
          </Button>
        </Flex>
      )}
    </PageCard>
  );
}
