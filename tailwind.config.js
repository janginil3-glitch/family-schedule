  /** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  safelist: [
    ...['eungyeol', 'nagyeom', 'mom', 'dad'].flatMap(color => [
      `bg-${color}-50`, `bg-${color}-100`, `bg-${color}-200`, `bg-${color}-300`, `bg-${color}-400`, `bg-${color}-500`,
      `text-${color}-500`, `text-${color}-600`, `text-${color}-700`,
      `border-${color}-200`, `border-${color}-300`, `border-${color}-400`,
    ]),
    ...['amber', 'orange', 'indigo', 'red', 'pink', 'blue', 'purple', 'green', 'gray'].flatMap(color => [
      `bg-${color}-50`, `bg-${color}-100`, `bg-${color}-200`, `bg-${color}-300`, `bg-${color}-400`, `bg-${color}-500`,
      `text-${color}-500`, `text-${color}-600`, `text-${color}-700`,
      `border-${color}-200`, `border-${color}-300`, `border-${color}-400`,
    ]),
  ],
  theme: {
    extend: {
      colors: {
        eungyeol: {
          50: '#F0F9FF', 100: '#E0F2FE', 200: '#BAE6FD',
          300: '#7DD3FC', 400: '#38BDF8', 500: '#0EA5E9',
        },
        nagyeom: {
          50: '#FDF4FF', 100: '#FAE8FF', 200: '#F5D0FE',
          300: '#F0ABFC', 400: '#E879F9', 500: '#D946EF',
        },
        mom: {
          50: '#FFF1F2', 100: '#FFE4E6', 200: '#FECDD3',
          300: '#FDA4AF', 400: '#FB7185', 500: '#F43F5E',
        },
        dad: {
          50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0',
          300: '#86EFAC', 400: '#4ADE80', 500: '#22C55E',
        },
        cream: '#FFF9F0',
        peach: '#FFE5D9',
        mint: '#D4F4DD',
        lavender: '#E8DFF5',
      },
      fontFamily: {
        cute: ['"Gaegu"', '"Jua"', 'cursive'],
        sans: ['"Pretendard"', '"Noto Sans KR"', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'pop': 'pop 0.3s ease-out',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
