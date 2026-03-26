"use client";

import * as React from "react";
import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/lib/theme";

// Create a fresh Emotion cache for SSR
function createEmotionCache() {
  return createCache({ key: "mui", prepend: true });
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => {
    const c = createEmotionCache();
    c.compat = true;
    return c;
  });

  useServerInsertedHTML(() => {
    const entries = (cache as any).sheet?.tags;
    if (!entries || entries.length === 0) return null;

    // Collect all style tags inserted by Emotion
    const styles: string[] = [];
    for (const tag of entries) {
      if (tag instanceof HTMLStyleElement && tag.textContent) {
        styles.push(tag.textContent);
      }
    }
    if (styles.length === 0) return null;

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${Object.keys((cache as any).inserted).join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles.join("") }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
