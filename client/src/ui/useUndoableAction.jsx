import { useToast, Flex, Text, Button } from '@chakra-ui/react';

const DELAY_MS = 5000;

export default function useUndoableAction() {
  const toast = useToast();

  return function runUndoable({ message, onCommit, onUndo }) {
    let undone = false;
    const timer = setTimeout(() => {
      if (!undone) onCommit();
    }, DELAY_MS);

    toast({
      duration: DELAY_MS,
      isClosable: true,
      render: ({ onClose }) => (
        <Flex bg="bw.accentSolid" color="bw.accentSolidText" p="12px 16px" borderRadius="md" justify="space-between" align="center" gap="14px">
          <Text fontSize="sm">{message}</Text>
          <Button
            size="xs"
            variant="outline"
            color="white"
            borderColor="whiteAlpha.600"
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={() => {
              undone = true;
              clearTimeout(timer);
              onUndo?.();
              onClose();
            }}
          >
            Отменить
          </Button>
        </Flex>
      ),
    });
  };
}
