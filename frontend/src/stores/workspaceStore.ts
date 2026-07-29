import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  selectedWorkspaceId: string | null;
  selectedWorkspaceName: string | null;
  setWorkspace: (id: string, name: string) => void;
  clear: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      selectedWorkspaceId: null,
      selectedWorkspaceName: null,
      setWorkspace: (id, name) => set({ selectedWorkspaceId: id, selectedWorkspaceName: name }),
      clear: () => set({ selectedWorkspaceId: null, selectedWorkspaceName: null }),
    }),
    { name: "tolab_workspace" },
  ),
);