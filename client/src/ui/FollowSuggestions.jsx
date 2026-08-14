import { useEffect, useState } from 'react';
import { Box, Heading, Flex, Avatar, Text, Button, useToast } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { withCount } from '../utils/pluralize';

export default function FollowSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const toast = useToast();

  useEffect(() => {
    axiosInstance
      .get('/users/suggestions')
      .then((res) => setSuggestions(res.data))
      .catch(() => setSuggestions([]));
  }, []);

  const follow = async (id) => {
    try {
      await axiosInstance.post(`/users/${id}/follow`);
      setFollowingIds((prev) => [...prev, id]);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось подписаться', status: 'error', duration: 2500, isClosable: true });
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <Box mb="20px" p="14px" border="1px solid" borderColor="bw.border" borderRadius="md" bg="bw.cardBg">
      <Heading as="h2" size="sm" mb="10px">Возможно, вам интересны</Heading>
      <Flex direction="column" gap="10px">
        {suggestions.map((s) => (
          <Flex key={s.id} align="center" justify="space-between" gap="10px">
            <NavLink to={`/users/${s.id}`}>
              <Flex align="center" gap="8px">
                <Avatar name={s.name} src={resolveAvatarUrl(s.avatarUrl)} size="sm" />
                <Box>
                  <Text fontSize="sm" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>{s.name}</Text>
                  <Text fontSize="xs" color="bw.textMuted">{withCount(s.reviewCount, ['рецензия', 'рецензии', 'рецензий'])}</Text>
                </Box>
              </Flex>
            </NavLink>
            {followingIds.includes(s.id) ? (
              <Text fontSize="xs" color="bw.textMuted">✓ Подписаны</Text>
            ) : (
              <Button size="xs" onClick={() => follow(s.id)} sx={{ backgroundColor: '#334d00', color: 'white' }}>
                Подписаться
              </Button>
            )}
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}
