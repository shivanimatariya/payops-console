/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{js,jsx}', './{components,pages,layouts,hooks,services,state,routes,lib}/**/*.{js,jsx}'],
  theme: { extend: {
    "colors": {
      "primary": {
        "50": "#eaeaf7",
        "100": "#dfdef4",
        "200": "#cbc9ef",
        "300": "#b0adea",
        "400": "#8d88e6",
        "500": "#6962e5",
        "600": "#4f46e5",
        "700": "#3931c5",
        "800": "#342e99",
        "900": "#2a2671",
        "950": "#211e4f"
      },
      "secondary": {
        "50": "#e1f5f3",
        "100": "#caeeeb",
        "200": "#a5e5e0",
        "300": "#70dcd3",
        "400": "#2bd5c8",
        "500": "#199f95",
        "600": "#0f766e",
        "700": "#165c56",
        "800": "#154b47",
        "900": "#133b38",
        "950": "#112e2c"
      },
      "sidebar": {
        "DEFAULT": "#0f172a",
        "foreground": "#cbd5e1"
      },
      "topbar": {
        "DEFAULT": "#ffffff",
        "foreground": "#334155"
      },
      "card": {
        "DEFAULT": "#ffffff",
        "border": "#e2e8f0"
      }
    }
  } },
  plugins: [],
};
