/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Text, Box } from '@chakra-ui/react';

function SpoilerSpan({ content }) {
  const [revealed, setRevealed] = useState(false);
  if (revealed) {
    return <Box as="span">{content}</Box>;
  }
  return (
    <Box
      as="span"
      role="button"
      tabIndex={0}
      aria-label="Показать спойлер"
      onClick={() => setRevealed(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setRevealed(true);
        }
      }}
      cursor="pointer"
      bg="bw.border"
      color="transparent"
      borderRadius="sm"
      px="2px"
      _hover={{ opacity: 0.8 }}
    >
      {content}
    </Box>
  );
}

// Reviews can mark spoilers with ||double pipes||, Reddit/Discord-style.
// Rendered as a blurred/hidden span that reveals on click, everywhere a
// review body is shown.
export default function SpoilerText({ text, ...textProps }) {
  if (!text) return null;
  const parts = text.split(/(\|\|[^|]+\|\|)/g);
  return (
    <Text {...textProps}>
      {parts.map((part, i) => {
        const match = part.match(/^\|\|([^|]+)\|\|$/);
        if (!match) return <Box as="span" key={i}>{part}</Box>;
        return <SpoilerSpan key={i} content={match[1]} />;
      })}
    </Text>
  );
}
