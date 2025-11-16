interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export const useToast = () => {
  const toast = (opts: ToastOptions) => {
    // Minimal placeholder toast: log to console for now.
    console.log("[toast]", opts.title, opts.description ?? "");
  };
  return { toast };
};
