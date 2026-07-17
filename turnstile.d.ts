// Ambient type for the Cloudflare Turnstile widget's global (loaded via <Script>).
// Shared by the contact + careers forms so the `Window.turnstile` augmentation is declared once.
type TurnstileOptions = {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  language?: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

interface Window {
  turnstile?: {
    render: (el: HTMLElement, opts: TurnstileOptions) => string;
    reset: (id?: string) => void;
    remove: (id?: string) => void;
  };
}
