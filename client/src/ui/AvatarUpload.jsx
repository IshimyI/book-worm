/* eslint-disable react/prop-types */
import { useRef, useState } from 'react';
import { Avatar, Box, Button, Flex, Text, useToast } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import { resolveAvatarUrl } from '../utils/avatarUrl';

const MAX_SIZE_BYTES = 3 * 1024 * 1024;

export default function AvatarUpload({ user, setUser }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const toast = useToast();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      toast({ title: 'Файл слишком большой (максимум 3 МБ)', status: 'error', duration: 2500, isClosable: true });
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const res = await axiosInstance.post('/users/me/avatar', formData);
      setUser((prev) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      toast({ title: 'Фото профиля обновлено', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось загрузить фото', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Flex align="center" gap="16px">
      <Avatar name={user.name} src={resolveAvatarUrl(user.avatarUrl)} size="xl" />
      <Box>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <Button
          size="sm"
          isLoading={uploading}
          onClick={() => inputRef.current?.click()}
          bg="bw.accentSolid"
          color="bw.accentSolidText"
        >
          Изменить фото
        </Button>
        <Text fontSize="xs" color="bw.textMuted" mt="6px">JPG, PNG или WebP, до 3 МБ</Text>
      </Box>
    </Flex>
  );
}
