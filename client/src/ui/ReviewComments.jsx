/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Box, Button, Text, Textarea, Flex, Avatar, useToast, Spinner } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';

export default function ReviewComments({ user, review, onCountChange }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    axiosInstance
      .get(`/review/${review.id}/comments`)
      .then((res) => setComments(res.data))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && comments === null) load();
  };

  const submit = async () => {
    if (!user) {
      toast({ title: 'Войдите, чтобы оставить комментарий', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post(`/review/${review.id}/comments`, { body: trimmed });
      setComments((prev) => [...(prev || []), res.data]);
      setBody('');
      onCountChange?.(review.id, (review.commentCount || 0) + 1);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось отправить комментарий', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (commentId) => {
    try {
      await axiosInstance.delete(`/review/${review.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCountChange?.(review.id, Math.max(0, (review.commentCount || 0) - 1));
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось удалить комментарий', status: 'error', duration: 2500, isClosable: true });
    }
  };

  return (
    <Box mt="6px">
      <Button size="xs" variant="link" color="bw.textMuted" onClick={toggleOpen}>
        💬 {open ? 'Скрыть комментарии' : 'Комментарии'} {review.commentCount > 0 ? `(${review.commentCount})` : ''}
      </Button>

      {open && (
        <Box mt="10px" pl="14px" borderLeft="2px solid" borderColor="bw.border">
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <>
              {(comments || []).length === 0 && (
                <Text fontSize="sm" color="bw.textMuted" mb="8px">Пока нет комментариев</Text>
              )}
              {(comments || []).map((comment) => (
                <Flex key={comment.id} gap="8px" mb="10px" align="flex-start">
                  <Avatar name={comment.userName} size="xs" />
                  <Box flex="1">
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="bold">{comment.userName}</Text>
                      {user && user.id === comment.userId && (
                        <Button size="xs" variant="link" sx={{ color: '#a4522a' }} onClick={() => remove(comment.id)}>
                          Удалить
                        </Button>
                      )}
                    </Flex>
                    <Text fontSize="sm">{comment.body}</Text>
                  </Box>
                </Flex>
              ))}
              <Flex gap="8px" mt="8px">
                <Textarea
                  size="sm"
                  placeholder={user ? 'Написать комментарий…' : 'Войдите, чтобы комментировать'}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  isDisabled={!user}
                  rows={2}
                />
                <Button size="sm" isLoading={submitting} onClick={submit} sx={{ backgroundColor: '#334d00', color: 'white' }} flexShrink={0}>
                  Отправить
                </Button>
              </Flex>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
