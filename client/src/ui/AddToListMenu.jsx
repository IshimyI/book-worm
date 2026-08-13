/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Menu, MenuButton, MenuList, MenuItem, MenuDivider, Button, Input, Flex, Text, useToast } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';

export default function AddToListMenu({ user, bookId }) {
  const [lists, setLists] = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const loadLists = async () => {
    try {
      const res = await axiosInstance.get('/lists');
      setLists(res.data);
    } catch {
      setLists([]);
    }
  };

  const handleOpen = () => {
    if (user && lists === null) loadLists();
  };

  const addToList = async (listId, listName) => {
    try {
      await axiosInstance.post(`/lists/${listId}/books`, { bookId });
      toast({ title: `Добавлено в «${listName}»`, status: 'success', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось добавить в список', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const createAndAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await axiosInstance.post('/lists', { name });
      await axiosInstance.post(`/lists/${res.data.id}/books`, { bookId });
      setLists((prev) => [{ ...res.data, bookCount: 1 }, ...(prev || [])]);
      setNewName('');
      toast({ title: `Список «${name}» создан, книга добавлена`, status: 'success', duration: 2500, isClosable: true });
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Не удалось создать список', status: 'error', duration: 2500, isClosable: true });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Menu onOpen={handleOpen}>
      <MenuButton
        as={Button}
        variant="outline"
        onClick={(e) => {
          if (!user) {
            e.preventDefault();
            toast({ title: 'Войдите, чтобы использовать списки чтения', status: 'info', duration: 2500, isClosable: true });
          }
        }}
        sx={{ color: '#334d00', borderColor: '#334d00' }}
      >
        + В список
      </MenuButton>
      {user && (
        <MenuList minW="260px" p="8px">
          {lists === null ? (
            <MenuItem isDisabled>Загрузка…</MenuItem>
          ) : lists.length === 0 ? (
            <MenuItem isDisabled>Пока нет списков</MenuItem>
          ) : (
            lists.map((list) => (
              <MenuItem key={list.id} onClick={() => addToList(list.id, list.name)}>
                {list.name}
                <Text as="span" color="bw.textMuted" fontSize="xs" ml="6px">
                  ({list.bookCount})
                </Text>
              </MenuItem>
            ))
          )}
          <MenuDivider />
          <Flex px="8px" gap="6px" onClick={(e) => e.stopPropagation()}>
            <Input
              size="sm"
              placeholder="Новый список"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createAndAdd()}
            />
            <Button size="sm" isLoading={creating} onClick={createAndAdd} sx={{ backgroundColor: '#334d00', color: 'white' }}>
              +
            </Button>
          </Flex>
        </MenuList>
      )}
    </Menu>
  );
}
