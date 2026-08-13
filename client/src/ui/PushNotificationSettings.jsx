import { useEffect, useState } from 'react';
import { Box, Text, Button, Badge, useToast } from '@chakra-ui/react';
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';

export default function PushNotificationSettings() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false);
      setChecked(true);
      return;
    }
    getExistingSubscription()
      .then((sub) => setSubscribed(Boolean(sub)))
      .finally(() => setChecked(true));
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      await subscribeToPush();
      setSubscribed(true);
      toast({ title: 'Push-уведомления включены', status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.message || 'Не удалось включить уведомления', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      toast({ title: 'Push-уведомления отключены', status: 'success', duration: 2000, isClosable: true });
    } catch {
      toast({ title: 'Не удалось отключить уведомления', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  if (!checked || !supported) return null;

  return (
    <Box border="1px solid" borderColor="bw.border" borderRadius="md" p="20px" bg="bw.cardBg">
      <Text fontWeight="bold" mb="6px">
        Push-уведомления{' '}
        {subscribed ? <Badge colorScheme="green">включены</Badge> : <Badge>выключены</Badge>}
      </Text>
      <Text fontSize="sm" color="bw.textMuted" mb="14px">
        Получайте уведомления о новых подписчиках и комментариях, даже когда сайт не открыт.
      </Text>
      {subscribed ? (
        <Button size="sm" variant="outline" colorScheme="red" isLoading={busy} onClick={disable}>
          Отключить
        </Button>
      ) : (
        <Button size="sm" isLoading={busy} onClick={enable} sx={{ backgroundColor: '#334d00', color: 'white' }}>
          Включить push-уведомления
        </Button>
      )}
    </Box>
  );
}
