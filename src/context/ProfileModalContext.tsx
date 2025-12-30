import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileModalContextType {
  isOpen: boolean;
  userId: string | null;
  username: string;
  avatar: string;
  openProfileModal: (userId: string, username: string, avatar: string) => void;
  closeProfileModal: () => void;
}

const ProfileModalContext = createContext<ProfileModalContextType | undefined>(undefined);

export const ProfileModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');

  const openProfileModal = (userId: string, username: string, avatar: string) => {
    setUserId(userId);
    setUsername(username);
    setAvatar(avatar);
    setIsOpen(true);
  };

  const closeProfileModal = () => {
    setIsOpen(false);
  };

  return (
    <ProfileModalContext.Provider value={{ isOpen, userId, username, avatar, openProfileModal, closeProfileModal }}>
      {children}
    </ProfileModalContext.Provider>
  );
};

export const useProfileModal = () => {
  const context = useContext(ProfileModalContext);
  if (!context) {
    throw new Error('useProfileModal must be used within ProfileModalProvider');
  }
  return context;
};
