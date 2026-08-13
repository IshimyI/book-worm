/* eslint-disable react/prop-types */
import { Select, useToast } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';

const LABELS = {
  '': 'Не отмечено',
  want_to_read: 'Хочу прочитать',
  reading: 'Читаю',
  read: 'Прочитано',
};

export default function ReadingStatusSelect({ user, bookId, status, onChange }) {
  const toast = useToast();

  const handleChange = async (e) => {
    const value = e.target.value || null;
    if (!user) {
      toast({ title: 'Войдите, чтобы отмечать статус чтения', status: 'info', duration: 2500, isClosable: true });
      return;
    }
    try {
      const res = await axiosInstance.post(`/book/${bookId}/reading-status`, { status: value });
      onChange(res.data.status);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось сохранить статус', status: 'error', duration: 2500, isClosable: true });
    }
  };

  return (
    <Select
      value={status || ''}
      onChange={handleChange}
      width="auto"
      minW="170px"
      bg="bw.cardBg"
      sx={{ borderColor: '#334d00', color: '#334d00', fontWeight: 'bold' }}
    >
      {Object.entries(LABELS).map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </Select>
  );
}
