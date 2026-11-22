import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
// Cyrillic (Russian, Kazakh) — downloaded only when such characters appear (unicode-range).
import '@fontsource/cormorant-garamond/cyrillic-400.css';
import '@fontsource/cormorant-garamond/cyrillic-500.css';
import '@fontsource/cormorant-garamond/cyrillic-400-italic.css';
import '@fontsource/cormorant-garamond/cyrillic-ext-400.css';
import '@fontsource/cormorant-garamond/cyrillic-ext-500.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import { AccountRoot } from './Account';
import './styles.css';
import './ui-theme.css';
import './theme';
createRoot(document.getElementById('root')!).render(<StrictMode><AccountRoot /></StrictMode>);
