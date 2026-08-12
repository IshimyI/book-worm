import { Box, Center, Heading, Text, Stack, ListItem, OrderedList } from '@chakra-ui/react';
import useSeoMeta from '../utils/useSeoMeta';

export default function TermsPage() {
  useSeoMeta({
    title: 'Пользовательское соглашение',
    description: 'Пользовательское соглашение Mr Book Worm: правила использования каталога книг и публикации рецензий.',
  });

  return (
    <Center py="40px" px="20px">
      <Box maxW="800px" width="100%" bg="#fffdf7" borderRadius="lg" boxShadow="md" p="30px" borderTop="4px solid #4b5320">
        <Heading as="h1" size="lg" mb="6px">Пользовательское соглашение</Heading>
        <Text color="gray.500" fontSize="sm" mb="24px">Действует с 12 августа 2026 года</Text>

        <Stack spacing="20px" color="gray.700">
          <Text>Регистрируясь на Mr Book Worm, вы соглашаетесь с условиями ниже. Мы старались написать их по-человечески, без лишнего юридического жаргона.</Text>

          <Box>
            <Heading as="h2" size="sm" mb="8px">1. Что можно делать на сайте</Heading>
            <OrderedList spacing="6px">
              <ListItem>Создавать аккаунт, добавлять книги в каталог, оставлять рецензии и оценки</ListItem>
              <ListItem>Сохранять книги в избранное</ListItem>
              <ListItem>Свободно читать чужие рецензии — без регистрации доступен просмотр каталога</ListItem>
            </OrderedList>
          </Box>

          <Box>
            <Heading as="h2" size="sm" mb="8px">2. Чего делать нельзя</Heading>
            <OrderedList spacing="6px">
              <ListItem>Публиковать оскорбления, спам, рекламу или незаконный контент в рецензиях</ListItem>
              <ListItem>Создавать несколько аккаунтов для накрутки рейтингов</ListItem>
              <ListItem>Использовать чужие данные при регистрации</ListItem>
            </OrderedList>
          </Box>

          <Box>
            <Heading as="h2" size="sm" mb="8px">3. Ответственность за контент рецензий</Heading>
            <Text>Рецензии отражают личное мнение их авторов и не являются позицией администрации сайта. Мы оставляем за собой право удалить рецензию, нарушающую пункт 2.</Text>
          </Box>

          <Box>
            <Heading as="h2" size="sm" mb="8px">4. Изменение условий</Heading>
            <Text>Если условия существенно изменятся, мы предупредим об этом на сайте заранее.</Text>
          </Box>

          <Box>
            <Heading as="h2" size="sm" mb="8px">5. Контакты</Heading>
            <Text>По всем вопросам — ivanborisenko.msk@gmail.com.</Text>
          </Box>
        </Stack>
      </Box>
    </Center>
  );
}
