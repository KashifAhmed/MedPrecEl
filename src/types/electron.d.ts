interface ElectronAPI {
    getToken: () => Promise<{ token: string | null }>;
    saveToken: (token: string) => Promise<{ success: boolean; error?: string }>;
  }
  
  declare global {
    interface Window {
      electron: ElectronAPI;
    }
  }
  
  export {};