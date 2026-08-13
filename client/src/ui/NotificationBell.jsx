/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Button, Text, IconButton } from '@chakra-ui/react';
import axiosInstance from '../axiosInstance';
import { relativeTime } from '../utils/relativeTime';

const POLL_INTERVAL_MS = 30_000;

function describe(n) {
  if (n.type === 'new_follower') return `${n.name || 'Кто-то'} подписался на вас`;
  if (n.type === 'review_comment') return `${n.name || 'Кто-то'} прокомментировал(а) вашу рецензию на «${n.bookTitle || 'книгу'}»`;
  if (n.type === 'comment_reply') return `${n.name || 'Кто-то'} ответил(а) на ваш комментарий к «${n.bookTitle || 'книге'}»`;
  return 'Новое уведомление';
}

function linkFor(n) {
  if (n.type === 'new_follower' && n.actorId) return `/users/${n.actorId}`;
  if ((n.type === 'review_comment' || n.type === 'comment_reply') && n.bookId) return `/books/${n.bookId}`;
  return null;
}

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const load = () => {
    axiosInstance
      .get('/notifications')
      .then((res) => {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!user) return undefined;
    load();
    timerRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  const openNotification = async (n) => {
    if (!n.isRead) {
      try {
        await axiosInstance.post(`/notifications/${n.id}/read`);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // non-critical — worst case it stays unread until next poll
      }
    }
    const link = linkFor(n);
    if (link) navigate(link);
  };

  const markAllRead = async (e) => {
    e.stopPropagation();
    try {
      await axiosInstance.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // non-critical
    }
  };

  return (
    <Menu onOpen={load}>
      <Box position="relative" display="inline-block">
        <MenuButton
          as={IconButton}
          aria-label="Уведомления"
          icon={<span style={{ fontSize: '16px' }}>🔔</span>}
          size="sm"
          variant="ghost"
          color="#f5f0dc"
          _hover={{ bg: 'whiteAlpha.200' }}
        />
        {unreadCount > 0 && (
          <Box
            position="absolute"
            top="-2px"
            right="-2px"
            bg="#a4522a"
            color="white"
            fontSize="10px"
            fontWeight="bold"
            borderRadius="full"
            minW="16px"
            h="16px"
            textAlign="center"
            lineHeight="16px"
            pointerEvents="none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Box>
        )}
      </Box>
      <MenuList maxH="360px" overflowY="auto" minW="300px">
        {notifications.length > 0 && (
          <>
            <Button size="xs" variant="link" ml="12px" mb="6px" sx={{ color: '#334d00' }} onClick={markAllRead}>
              Прочитать все
            </Button>
            <MenuDivider />
          </>
        )}
        {notifications.length === 0 ? (
          <MenuItem isDisabled>Пока нет уведомлений</MenuItem>
        ) : (
          notifications.map((n) => (
            <MenuItem key={n.id} onClick={() => openNotification(n)} bg={n.isRead ? undefined : 'bw.reviewHighlight'}>
              <Box>
                <Text fontSize="sm" noOfLines={2}>{describe(n)}</Text>
                <Text fontSize="xs" color="bw.textMuted">{relativeTime(n.createdAt)}</Text>
              </Box>
            </MenuItem>
          ))
        )}
      </MenuList>
    </Menu>
  );
}
