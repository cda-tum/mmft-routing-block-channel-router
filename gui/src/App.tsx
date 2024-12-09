import './App.css'
import { BoardUI } from './BoardUI'
import { CssVarsProvider, extendTheme } from '@mui/joy'

function App() {

  const theme = extendTheme({
    colorSchemes: {
      dark: {
        palette: {
          primary: {
            50: '#64b6f7',
            100: '#4dabf5',
            200: '#37a1f4',
            300: '#2196F3',
            400: '#1a78c2',
            500: '#145a92',
            600: '#0d3c61',
            700: '#0a2d49',
            800: '#071e31',
            900: '#030f18',
          },
        },
      },
      light: {
        palette: {
          primary: {
            50: '#bce0fb',
            100: '#a6d5fa',
            200: '#90cbf9',
            300: '#64b6f7',
            400: '#37a1f4',
            500: '#2196F3',
            600: '#1a78c2',
            700: '#145a92',
            800: '#0d3c61',
            900: '#0a2d49',
          },
        },
      },
    },
  });

  /**
   * dark: {
        palette: {
          primary: {
            50: '#b270e9',
            100: '#a760e0',
            200: '#9d4edd',
            300: '#8d46c7',
            400: '#7e3eb1',
            500: '#6e379b',
            600: '#5e2f85',
            700: '#4f276f',
            800: '#3f1f58',
            900: '#2f1742',
          },
        },
      },
   */

  return (
    <>
      <CssVarsProvider defaultMode="system" theme={theme}>
        <BoardUI />
      </CssVarsProvider>
    </>
  )
}

export default App
