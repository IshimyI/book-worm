import { useRef, useState } from 'react';
import { Box, Text, Heading, Button, useToast } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';

export default function ImportBooksCard() {
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const openPicker = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axiosInstance.post('/import/goodreads', formData);
      const { matched, created, skipped, skippedTitles } = res.data;
      toast({
        title: 'Импорт завершён',
        description: `Найдено в каталоге: ${matched}. Добавлено новых (на модерации): ${created}.${
          skipped > 0 ? ` Пропущено: ${skipped}.` : ''
        }`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      });
      if (skippedTitles?.length > 0) {
        toast({
          title: 'Пропущенные строки',
          description: skippedTitles.join('; '),
          status: 'warning',
          duration: 8000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: error.response?.data?.message || 'Не удалось импортировать файл',
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box border="1px solid" borderColor="bw.border" borderRadius="md" p="20px" bg="bw.cardBg">
      <Heading as="h3" size="sm" mb="10px">Импорт из Goodreads</Heading>
      <Text fontSize="sm" color="bw.textMuted" mb="14px">
        Загрузите CSV-экспорт своей библиотеки (Profile → My Books → Import/Export → Export Library).
        Книги, которых нет в нашем каталоге, попадут на модерацию.
      </Text>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button size="sm" onClick={openPicker} isLoading={busy} loadingText="Импортируем…" sx={{ backgroundColor: '#334d00', color: 'white' }}>
        Выбрать CSV-файл
      </Button>
    </Box>
  );
}
