import { useEffect, useState } from 'react';
import { Box, Text, Heading, Button, Input, Flex, useToast } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';

export default function ReadingChallenge() {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = () => {
    axiosInstance
      .get('/reading-challenge')
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  };

  useEffect(() => {
    load();
  }, []);

  const saveGoal = async (e) => {
    e.preventDefault();
    const goal = Number(goalInput);
    if (!Number.isInteger(goal) || goal < 1) return;
    setBusy(true);
    try {
      const res = await axiosInstance.post('/reading-challenge', { goal });
      setData((prev) => ({ ...prev, goal: res.data.goal }));
      setEditing(false);
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось сохранить цель', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  if (!data) return null;

  const pct = data.goal ? Math.min(100, Math.round((data.completed / data.goal) * 100)) : 0;

  return (
    <Box border="1px solid" borderColor="bw.border" borderRadius="md" p="20px" bg="bw.cardBg">
      <Heading as="h3" size="sm" mb="10px">Читательский вызов {data.year}</Heading>

      {data.goal ? (
        <>
          <Text fontSize="sm" color="bw.textMuted" mb="10px">
            Прочитано {data.completed} из {data.goal} книг
          </Text>
          <Box bg="bw.border" borderRadius="full" h="10px" overflow="hidden" mb="10px">
            <Box bg="bw.accentSolid" h="100%" width={`${Math.max(pct, data.completed > 0 ? 3 : 0)}%`} />
          </Box>
          {editing ? (
            <form onSubmit={saveGoal}>
              <Flex gap="10px">
                <Input size="sm" type="number" min="1" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} w="120px" />
                <Button size="sm" type="submit" isLoading={busy} bg="bw.accentSolid" color="bw.accentSolidText">Сохранить</Button>
              </Flex>
            </form>
          ) : (
            <Button size="xs" variant="link" color="bw.accent" onClick={() => { setGoalInput(String(data.goal)); setEditing(true); }}>
              Изменить цель
            </Button>
          )}
        </>
      ) : editing ? (
        <form onSubmit={saveGoal}>
          <Flex gap="10px">
            <Input size="sm" type="number" min="1" placeholder="Сколько книг?" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} w="160px" />
            <Button size="sm" type="submit" isLoading={busy} bg="bw.accentSolid" color="bw.accentSolidText">Начать</Button>
          </Flex>
        </form>
      ) : (
        <Button size="sm" onClick={() => { setGoalInput('12'); setEditing(true); }} bg="bw.accentSolid" color="bw.accentSolidText">
          Поставить цель на год
        </Button>
      )}
    </Box>
  );
}
