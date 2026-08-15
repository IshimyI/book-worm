import { useEffect, useState } from 'react';
import { IconButton } from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <IconButton
      aria-label="Наверх"
      icon={<ArrowUpIcon />}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      position="fixed"
      bottom="24px"
      right="24px"
      zIndex="overlay"
      borderRadius="full"
      size="lg"
      boxShadow="md"
      bg="bw.accentSolid"
      color="bw.accentSolidText"
      _hover={{ bg: 'bw.accent' }}
    />
  );
}
