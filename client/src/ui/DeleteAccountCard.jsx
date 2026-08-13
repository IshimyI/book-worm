/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Box, Text, Heading, Button, Input, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axiosInstance, { setAccessToken } from '../axiosInstance';

export default function DeleteAccountCard({ setUser }) {
  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const deleteAccount = async () => {
    if (!password) return;
    setBusy(true);
    try {
      await axiosInstance.delete('/auth/account', { data: { password } });
      setAccessToken('');
      setUser(null);
      toast({ title: 'Аккаунт удалён', status: 'success', duration: 2500, isClosable: true });
      navigate('/');
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось удалить аккаунт', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setBusy(false);
      setPassword('');
    }
  };

  return (
    <Box border="1px solid" borderColor="#a4522a" borderRadius="md" p="20px" bg="bw.cardBg">
      <Heading as="h3" size="sm" mb="10px" color="#a4522a">Удалить аккаунт</Heading>
      <Text fontSize="sm" color="bw.textMuted" mb="14px">
        Все рецензии, цитаты, подписки и настройки будут удалены безвозвратно. Экспортируйте данные заранее, если хотите их сохранить.
      </Text>
      {expanded ? (
        <>
          <Input
            type="password"
            placeholder="Введите пароль для подтверждения"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            mb="10px"
            size="sm"
          />
          <Button size="sm" colorScheme="red" isLoading={busy} isDisabled={!password} onClick={deleteAccount} mr="8px">
            Удалить навсегда
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setExpanded(false); setPassword(''); }}>
            Отмена
          </Button>
        </>
      ) : (
        <Button size="sm" variant="outline" colorScheme="red" onClick={() => setExpanded(true)}>
          Удалить аккаунт
        </Button>
      )}
    </Box>
  );
}
