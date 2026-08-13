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
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
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
      setComments((prev) => [...(prev || []), { ...res.data, replies: [] }]);
      setBody('');
      onCountChange?.(review.id, (review.commentCount || 0) + 1);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось отправить комментарий', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentCommentId) => {
    if (!user) {
      toast({ title: 'Войдите, чтобы ответить', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    const trimmed = replyBody.trim();
    if (!trimmed) return;
    setSubmittingReply(true);
    try {
      const res = await axiosInstance.post(`/review/${review.id}/comments`, { body: trimmed, parentCommentId });
      setComments((prev) =>
        prev.map((c) => (c.id === parentCommentId ? { ...c, replies: [...c.replies, res.data] } : c))
      );
      setReplyBody('');
      setReplyingTo(null);
      onCountChange?.(review.id, (review.commentCount || 0) + 1);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось отправить ответ', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setSubmittingReply(false);
    }
  };

  const remove = async (comment, isReply, parentCommentId) => {
    try {
      await axiosInstance.delete(`/review/${review.id}/comments/${comment.id}`);
      const removedCount = isReply ? 1 : 1 + comment.replies.length;
      if (isReply) {
        setComments((prev) =>
          prev.map((c) => (c.id === parentCommentId ? { ...c, replies: c.replies.filter((r) => r.id !== comment.id) } : c))
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== comment.id));
      }
      onCountChange?.(review.id, Math.max(0, (review.commentCount || 0) - removedCount));
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось удалить комментарий', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const renderComment = (comment, isReply, parentCommentId) => (
    <Flex key={comment.id} gap="8px" mb="10px" align="flex-start">
      <Avatar name={comment.userName} size="xs" />
      <Box flex="1">
        <Flex justify="space-between" align="center">
          <Text fontSize="sm" fontWeight="bold">{comment.userName}</Text>
          {user && user.id === comment.userId && (
            <Button size="xs" variant="link" sx={{ color: '#a4522a' }} onClick={() => remove(comment, isReply, parentCommentId)}>
              Удалить
            </Button>
          )}
        </Flex>
        <Text fontSize="sm">{comment.body}</Text>
        {!isReply && (
          <Button size="xs" variant="link" color="bw.textMuted" mt="2px" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
            Ответить
          </Button>
        )}

        {!isReply && comment.replies?.length > 0 && (
          <Box mt="8px" pl="14px" borderLeft="2px solid" borderColor="bw.border">
            {comment.replies.map((reply) => renderComment(reply, true, comment.id))}
          </Box>
        )}

        {!isReply && replyingTo === comment.id && (
          <Flex gap="8px" mt="8px" pl="14px">
            <Textarea
              size="sm"
              placeholder={user ? 'Написать ответ…' : 'Войдите, чтобы ответить'}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              isDisabled={!user}
              rows={2}
            />
            <Button size="sm" isLoading={submittingReply} onClick={() => submitReply(comment.id)} sx={{ backgroundColor: '#334d00', color: 'white' }} flexShrink={0}>
              Ответить
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );

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
              {(comments || []).map((comment) => renderComment(comment, false, null))}
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
