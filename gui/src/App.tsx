import './App.css'
import { BoardUI } from './BoardUI'
import { CssVarsProvider, extendTheme } from '@mui/joy'

function App() {

  const baseColor = '#016fb6'
  const lf = 0.2

  const theme = extendTheme({
    colorSchemes: {
      dark: {
        palette: {
          primary: {
            50: `hsl(from ${baseColor} h s calc(l + l * ${5 * lf}))`,
            100: `hsl(from ${baseColor} h s calc(l + l * ${4 * lf}))`,
            200: `hsl(from ${baseColor} h s calc(l + l * ${3 * lf}))`,
            300: `hsl(from ${baseColor} h s calc(l + l * ${2 * lf}))`,
            400: `hsl(from ${baseColor} h s calc(l + l * ${lf}))`,
            500: baseColor,
            600: `hsl(from ${baseColor} h s calc(l - l * ${lf}))`,
            700: `hsl(from ${baseColor} h s calc(l - l * ${2 * lf}))`,
            800: `hsl(from ${baseColor} h s calc(l - l * ${3 * lf}))`,
            900: `hsl(from ${baseColor} h s calc(l - l * ${4 * lf}))`,
          },
        },
      },
      light: {
        palette: {
          primary: {
            50: `hsl(from ${baseColor} h s calc(l + l * ${5 * lf}))`,
            100: `hsl(from ${baseColor} h s calc(l + l * ${4 * lf}))`,
            200: `hsl(from ${baseColor} h s calc(l + l * ${3 * lf}))`,
            300: `hsl(from ${baseColor} h s calc(l + l * ${2 * lf}))`,
            400: `hsl(from ${baseColor} h s calc(l + l * ${lf}))`,
            500: baseColor,
            600: `hsl(from ${baseColor} h s calc(l - l * ${lf}))`,
            700: `hsl(from ${baseColor} h s calc(l - l * ${2 * lf}))`,
            800: `hsl(from ${baseColor} h s calc(l - l * ${3 * lf}))`,
            900: `hsl(from ${baseColor} h s calc(l - l * ${4 * lf}))`,
          },
        },
      },
    },
  });

  return (
    <>
      <CssVarsProvider defaultMode="system" theme={theme}>
        <BoardUI />
      </CssVarsProvider>
    </>
  )
}

export default App
