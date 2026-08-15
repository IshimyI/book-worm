/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import {
  Box, Text, Heading, Stack, Flex, Button, Textarea, Input, IconButton, useToast, Center, Spinner,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import axiosInstance from '../axiosInstance';
import useUndoableAction from './useUndoableAction';

export default function BookQuotes({ bookId, user }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const runUndoable = useUndoableAction();

  const load = () => {
    axiosInstance
      .get(`/book/${bookId}/quotes`)
      .then((res) => setQuotes(res.data))
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post(`/book/${bookId}/quotes`, { text, page: page || undefined });
      setQuotes((prev) => [res.data, ...prev]);
      setText('');
      setPage('');
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось сохранить цитату', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    const removedIndex = quotes.findIndex((q) => q.id === id);
    const removed = quotes[removedIndex];
    setQuotes((prev) => prev.filter((q) => q.id !== id));

    const restore = () => setQuotes((prev) => {
      if (prev.some((q) => q.id === id)) return prev;
      const next = [...prev];
      next.splice(Math.min(removedIndex, next.length), 0, removed);
      return next;
    });

    runUndoable({
      message: 'Цитата удалена',
      onUndo: restore,
      onCommit: async () => {
        try {
          await axiosInstance.delete(`/quotes/${id}`);
        } catch (error) {
          restore();
          toast({ title: error.response?.data?.message || 'Не удалось удалить цитату', status: 'error', duration: 2500, isClosable: true });
        }
      },
    });
  };

  return (
    <Box>
      <Heading as="h2" size="md" mb="16px">Цитаты</Heading>

      {user && (
        <form onSubmit={handleSubmit}>
          <Textarea
            placeholder="Сохранить понравившийся отрывок из книги"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            mb="4px"
          />
          <Text fontSize="xs" color="bw.textMuted" mb="10px" textAlign="right">{text.length}/1000</Text>
          <Flex gap="10px" mb="16px" align="center" flexWrap="wrap">
            <Input placeholder="Страница (необязательно)" type="number" min="1" value={page} onChange={(e) => setPage(e.target.value)} w="200px" size="sm" />
            <Button type="submit" size="sm" isLoading={submitting} bg="bw.accentSolid" color="bw.accentSolidText">
              Сохранить цитату
            </Button>
          </Flex>
        </form>
      )}

      {loading ? (
        <Center py="20px"><Spinner /></Center>
      ) : quotes.length === 0 ? (
        <Text color="bw.textMuted" fontSize="sm" mb="10px">Пока нет сохранённых цитат.</Text>
      ) : (
        <Stack spacing={3} mb="10px">
          {quotes.map((q) => (
            <Box key={q.id} p="3" borderLeft="3px solid" borderColor="bw.accent" bg="bw.cardBg" borderRadius="sm">
              <Flex justify="space-between" align="flex-start" gap="10px">
                <Text fontStyle="italic">«{q.text}»</Text>
                {user && user.id === q.author.id && (
                  <IconButton
                    aria-label="Удалить цитату"
                    icon={<DeleteIcon />}
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDelete(q.id)}
                  />
                )}
              </Flex>
              <Text fontSize="xs" color="bw.textMuted" mt="6px">
                {q.author.name}
                {q.page ? `, стр. ${q.page}` : ''}
              </Text>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
