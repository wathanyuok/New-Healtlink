"use client";

import { styled, Switch, type SwitchProps } from "@mui/material";

/**
 * GreenSwitch — Nuxt-style toggle (h-6 w-11, green active, white thumb, pill shape).
 *
 * Drop-in replacement for MUI <Switch>.
 * Usage:  <GreenSwitch checked={val} onChange={fn} />
 */
const GreenSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(() => ({
  width: 44, // w-11 (2.75rem)
  height: 24, // h-6  (1.5rem)
  padding: 0,

  "& .MuiSwitch-switchBase": {
    padding: 2,
    transitionDuration: "200ms",

    "&.Mui-checked": {
      transform: "translateX(20px)", // translate-x-5
      color: "#fff",

      "& + .MuiSwitch-track": {
        backgroundColor: "#22c55e", // Tailwind green-500 (Nuxt bg-green)
        opacity: 1,
        border: 0,
      },

      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.5,
      },
    },

    "&.Mui-focusVisible .MuiSwitch-thumb": {
      color: "#22c55e",
      border: "4px solid #fff",
    },

    "&.Mui-disabled .MuiSwitch-thumb": {
      color: "#e5e7eb", // gray-200
    },

    "&.Mui-disabled + .MuiSwitch-track": {
      opacity: 0.5,
    },
  },

  "& .MuiSwitch-thumb": {
    boxSizing: "border-box",
    width: 20, // w-5
    height: 20, // h-5
    boxShadow: "none",
  },

  "& .MuiSwitch-track": {
    borderRadius: 24 / 2, // rounded-full
    backgroundColor: "#9ca3af", // Tailwind gray-400 (Nuxt bg-gray-60)
    opacity: 1,
    transition: "background-color 200ms ease-in-out",
  },
}));

export default GreenSwitch;
