/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Box, Text, Button, Input, Image, Stack, Code, useToast, Badge } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';

export default function TwoFactorSettings({ user, setUser }) {
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [password, setPassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await axiosInstance.post('/auth/2fa/setup');
      setSetupData(res.data);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось начать настройку', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await axiosInstance.post('/auth/2fa/enable', { token: code.trim() });
      setRecoveryCodes(res.data.recoveryCodes);
      setSetupData(null);
      setCode('');
      setUser((prev) => ({ ...prev, twoFactorEnabled: true }));
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Неверный код', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!password.trim()) return;
    setBusy(true);
    try {
      await axiosInstance.post('/auth/2fa/disable', { password: password.trim() });
      setUser((prev) => ({ ...prev, twoFactorEnabled: false }));
      setShowDisableForm(false);
      setPassword('');
      toast({ title: 'Двухфакторная аутентификация отключена', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Неверный пароль', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  if (recoveryCodes) {
    return (
      <Box border="1px solid" borderColor="bw.border" borderRadius="md" p="20px" bg="bw.cardBg">
        <Text fontWeight="bold" mb="10px">✓ Двухфакторная аутентификация включена</Text>
        <Text fontSize="sm" color="bw.textMuted" mb="10px">
          Сохраните эти резервные коды в надёжном месте — каждый работает один раз и поможет войти, если вы потеряете доступ к приложению-аутентификатору. Они больше не будут показаны.
        </Text>
        <Stack spacing="4px" mb="14px">
          {recoveryCodes.map((rc) => (
            <Code key={rc} fontSize="sm">{rc}</Code>
          ))}
        </Stack>
        <Button size="sm" bg="bw.accentSolid" color="bw.accentSolidText" onClick={() => setRecoveryCodes(null)}>
          Я сохранил коды
        </Button>
      </Box>
    );
  }

  if (setupData) {
    return (
      <Box border="1px solid" borderColor="bw.border" borderRadius="md" p="20px" bg="bw.cardBg">
        <Text fontWeight="bold" mb="10px">Настройка двухфакторной аутентификации</Text>
        <Text fontSize="sm" color="bw.textMuted" mb="10px">
          Отсканируйте QR-код в приложении-аутентификаторе (Google Authenticator, Authy и т.п.) или введите код вручную:
        </Text>
        <Image src={setupData.qrCodeDataUrl} alt="QR-код для 2FA" width="180px" height="180px" mb="10px" />
        <Code mb="14px" display="block" fontSize="xs" p="6px">{setupData.secret}</Code>
        <Input
          placeholder="Код из приложения"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxW="200px"
          mb="10px"
          onKeyDown={(e) => e.key === 'Enter' && confirmEnable()}
        />
        <Box>
          <Button size="sm" isLoading={busy} onClick={confirmEnable} bg="bw.accentSolid" color="bw.accentSolidText" mr="10px">
            Подтвердить и включить
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSetupData(null)}>Отмена</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box border="1px solid" borderColor="bw.border" borderRadius="md" p="20px" bg="bw.cardBg">
      <Text fontWeight="bold" mb="6px">
        Двухфакторная аутентификация{' '}
        {user.twoFactorEnabled ? <Badge colorScheme="green">включена</Badge> : <Badge>выключена</Badge>}
      </Text>
      <Text fontSize="sm" color="bw.textMuted" mb="14px">
        Дополнительная защита входа кодом из приложения-аутентификатора.
      </Text>
      {user.twoFactorEnabled ? (
        showDisableForm ? (
          <Box>
            <Input
              type="password"
              placeholder="Ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxW="240px"
              mb="10px"
              onKeyDown={(e) => e.key === 'Enter' && disable()}
            />
            <Box>
              <Button size="sm" isLoading={busy} onClick={disable} colorScheme="red" mr="10px">
                Отключить
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDisableForm(false)}>Отмена</Button>
            </Box>
          </Box>
        ) : (
          <Button size="sm" variant="outline" colorScheme="red" onClick={() => setShowDisableForm(true)}>
            Отключить 2FA
          </Button>
        )
      ) : (
        <Button size="sm" isLoading={busy} onClick={startSetup} bg="bw.accentSolid" color="bw.accentSolidText">
          Включить 2FA
        </Button>
      )}
    </Box>
  );
}
