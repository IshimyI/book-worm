import { useToast, Flex, Text, Button } from '@chakra-ui/react';

const DELAY_MS = 5000;

// Optimistic delete-with-undo: the item disappears from the UI right away,
// the actual API call is delayed behind a toast with an "Отменить" button —
// clicking it cancels the pending call and restores the item. Works the
// same whether the backend soft- or hard-deletes, since nothing is ever
// sent to the server until the window closes.
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
        <Flex bg="#334d00" color="white" p="12px 16px" borderRadius="md" justify="space-between" align="center" gap="14px">
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
