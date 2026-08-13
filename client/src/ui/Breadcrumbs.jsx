/* eslint-disable react/prop-types */
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';

// items: [{ label, to }, ...] — the last item is rendered as plain text
// (the current page), everything before it as a link.
export default function Breadcrumbs({ items }) {
  return (
    <Breadcrumb fontSize="sm" color="bw.textMuted" mb="16px">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <BreadcrumbItem key={i} isCurrentPage={isLast}>
            {isLast ? (
              <Text as="span" noOfLines={1} maxW="320px" display="inline-block" verticalAlign="bottom">
                {item.label}
              </Text>
            ) : (
              <BreadcrumbLink as={NavLink} to={item.to}>
                {item.label}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}
