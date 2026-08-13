import { Box, Heading, Text, Stack, ListItem, UnorderedList } from '@chakra-ui/react';
import useSeoMeta from '../utils/useSeoMeta';
import PageCard from '../ui/PageCard';

export default function PrivacyPage() {
  useSeoMeta({
    title: 'Политика конфиденциальности',
    description: 'Политика конфиденциальности Mr Book Worm: какие данные мы собираем и как их используем.',
  });

  return (
    <PageCard>
      <Heading as="h1" size="lg" mb="6px">Политика конфиденциальности</Heading>
      <Text color="bw.textMuted" fontSize="sm" mb="24px">Действует с 12 августа 2026 года</Text>

      <Stack spacing="24px" color="bw.textMuted">
        <Box>
          <Heading as="h2" size="sm" mb="8px">Кто мы</Heading>
          <Text>Mr Book Worm — некоммерческий личный проект, каталог книг с рецензиями. Владелец и оператор данных: Иван Борисенко, ivanborisenko.msk@gmail.com.</Text>
        </Box>

        <Box>
          <Heading as="h2" size="sm" mb="8px">Какие данные мы собираем</Heading>
          <UnorderedList spacing="6px">
            <ListItem>Имя и email — при регистрации</ListItem>
            <ListItem>Пароль — хранится в виде хэша (bcrypt), в открытом виде не сохраняется и никому не доступен</ListItem>
            <ListItem>Рецензии, оценки и список избранных книг — то, что вы сами добавляете</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="sm" mb="8px">Как мы используем данные</Heading>
          <Text>Только для работы сайта: авторизация, отображение ваших рецензий и избранного, отправка письма подтверждения email и писем восстановления пароля. Данные не продаются и не передаются третьим лицам для рекламы — рекламы на сайте нет вовсе.</Text>
        </Box>

        <Box>
          <Heading as="h2" size="sm" mb="8px">Cookies</Heading>
          <Text>Используется один технический cookie с refresh-токеном для авторизации (httpOnly, недоступен из JavaScript). Аналитических и рекламных cookies нет.</Text>
        </Box>

        <Box>
          <Heading as="h2" size="sm" mb="8px">Обложки книг</Heading>
          <Text>Обложки загружаются с Open Library (openlibrary.org) — некоммерческого проекта Internet Archive.</Text>
        </Box>

        <Box>
          <Heading as="h2" size="sm" mb="8px">Ваши права</Heading>
          <Text>Вы можете запросить удаление аккаунта и всех связанных данных в любой момент — напишите на ivanborisenko.msk@gmail.com.</Text>
        </Box>
      </Stack>
    </PageCard>
  );
}
