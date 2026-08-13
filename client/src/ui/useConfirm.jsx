import { useCallback, useRef, useState } from 'react';
import {
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, Button,
} from '@chakra-ui/react';

// Promise-based replacement for window.confirm() that matches the site's
// styling instead of a native browser dialog. Usage:
//   const { confirm, ConfirmDialog } = useConfirm();
//   if (!(await confirm('Удалить рецензию?'))) return;
//   return <>{ConfirmDialog}...</>;
export default function useConfirm() {
  const [state, setState] = useState(null);
  const cancelRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setState({ message, resolve, confirmLabel: options.confirmLabel || 'Удалить' });
    });
  }, []);

  const close = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const ConfirmDialog = (
    <AlertDialog isOpen={Boolean(state)} leastDestructiveRef={cancelRef} onClose={() => close(false)} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">Подтверждение</AlertDialogHeader>
          <AlertDialogBody>{state?.message}</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => close(false)}>
              Отмена
            </Button>
            <Button colorScheme="red" onClick={() => close(true)} ml={3}>
              {state?.confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );

  return { confirm, ConfirmDialog };
}
