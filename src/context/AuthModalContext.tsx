import React, { createContext, useContext, useState, useCallback } from 'react';

export type AuthModalMode = 'login' | 'signup' | 'forgot';

export interface OpenAuthModalOptions {
  mode?: AuthModalMode;
  title?: string;
  subtitle?: string;
  showGuestOption?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

interface AuthModalContextType {
  isOpen: boolean;
  mode: AuthModalMode;
  title: string | null;
  subtitle: string | null;
  showGuestOption: boolean;
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
  setMode: (mode: AuthModalMode) => void;
  onSuccessCallback: (() => void) | null;
  onCloseCallback: (() => void) | null;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setModeState] = useState<AuthModalMode>('login');
  const [title, setTitle] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [showGuestOption, setShowGuestOption] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | null>(null);

  const openAuthModal = useCallback((options?: OpenAuthModalOptions) => {
    setModeState(options?.mode || 'login');
    setTitle(options?.title || null);
    setSubtitle(options?.subtitle || null);
    setShowGuestOption(options?.showGuestOption || false);
    setOnSuccessCallback(() => options?.onSuccess || null);
    setOnCloseCallback(() => options?.onClose || null);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    if (onCloseCallback) {
      onCloseCallback();
    }
  }, [onCloseCallback]);

  const setMode = useCallback((newMode: AuthModalMode) => {
    setModeState(newMode);
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        title,
        subtitle,
        showGuestOption,
        openAuthModal,
        closeAuthModal,
        setMode,
        onSuccessCallback,
        onCloseCallback,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
