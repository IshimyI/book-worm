import { useState } from 'react';
import { Box, Text, Heading, Button, useToast } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';

export default function ExportDataCard() {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const download = async () => {
    setBusy(true);
    try {
      const res = await axiosInstance.get('/users/me/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'book-worm-data.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Не удалось экспортировать данные', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box border="1px solid" borderColor="bw.border" borderRadius="md" p="20px" bg="bw.cardBg">
      <Heading as="h3" size="sm" mb="10px">Мои данные</Heading>
      <Text fontSize="sm" color="bw.textMuted" mb="14px">
        Скачайте архив своих рецензий, цитат, статусов чтения и профиля в формате JSON.
      </Text>
      <Button size="sm" onClick={download} isLoading={busy} bg="bw.accentSolid" color="bw.accentSolidText">
        Экспортировать мои данные
      </Button>
    </Box>
  );
}
