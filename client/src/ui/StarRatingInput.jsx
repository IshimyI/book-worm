/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';

// A row of 5 stars, each a real keyboard-focusable button with an aria-label
// ("Оценка 3 из 5") — a plain <StarIcon onClick> is invisible to keyboard and
// screen-reader users, since an SVG click handler has no button semantics.
export default function StarRatingInput({ rating, onChange, size = '25px' }) {
  const [hover, setHover] = useState(0);

  return (
    <Box role="radiogroup" aria-label="Оценка">
      {[...Array(5)].map((_, index) => {
        const value = index + 1;
        const filled = value <= (hover || rating);
        return (
          <Box
            as="button"
            type="button"
            key={value}
            role="radio"
            aria-checked={rating === value}
            aria-label={`Оценка ${value} из 5`}
            onClick={() => onChange(value)}
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(value)}
            onBlur={() => setHover(0)}
            bg="transparent"
            border="none"
            p="2px"
            cursor="pointer"
            _focusVisible={{ outline: '2px solid', outlineColor: 'bw.accent', outlineOffset: '2px', borderRadius: '4px' }}
          >
            <StarIcon fontSize={size} color={filled ? 'gold' : 'gray.300'} />
          </Box>
        );
      })}
    </Box>
  );
}
