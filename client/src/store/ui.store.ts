import { create } from 'zustand';

interface UIStore {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isAssignModalOpen: boolean;
  isNoteModalOpen: boolean;
  selectedCustomerId: string | null;

  openCreateModal: () => void;
  openEditModal: (id: string) => void;
  openAssignModal: (id: string) => void;
  openNoteModal: (id: string) => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isAssignModalOpen: false,
  isNoteModalOpen: false,
  selectedCustomerId: null,

  openCreateModal: () => set({ isCreateModalOpen: true }),
  openEditModal: (id) => set({ isEditModalOpen: true, selectedCustomerId: id }),
  openAssignModal: (id) => set({ isAssignModalOpen: true, selectedCustomerId: id }),
  openNoteModal: (id) => set({ isNoteModalOpen: true, selectedCustomerId: id }),
  closeAllModals: () =>
    set({
      isCreateModalOpen: false,
      isEditModalOpen: false,
      isAssignModalOpen: false,
      isNoteModalOpen: false,
      selectedCustomerId: null,
    }),
}));
