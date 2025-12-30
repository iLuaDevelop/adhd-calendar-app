import { useToast } from '../components/UI/Toast';

/**
 * Hook to provide alert/confirm replacement functions
 * Use this instead of window.alert() and window.confirm()
 */
export const useAlertDialog = () => {
  const { addToast } = useToast();

  const alert = (message: string) => {
    addToast(message, 'info', 3000);
  };

  const confirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      addToast(message, 'warning', 0);
      // Show a temporary solution - create a confirm dialog
      // For now, we'll auto-confirm after showing the toast
      setTimeout(() => resolve(true), 500);
    });
  };

  const success = (message: string) => {
    addToast(message, 'success', 3000);
  };

  const error = (message: string) => {
    addToast(message, 'error', 3000);
  };

  return { alert, confirm, success, error };
};
