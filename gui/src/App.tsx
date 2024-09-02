import './App.css'
import { BoardUI } from './BoardUI'
import { CssVarsProvider, extendTheme } from '@mui/joy'

function App() {

  const theme = extendTheme({
    colorSchemes: {
      dark: {
        palette: {
          primary: {
            50: '#b270e9',
            100: '#a760e0',
            200: '#9d4edd',
            300: '#8d46c7',
            400: '#7e3eb1',
            500: '#6e379b', // TODO: adapt others
            600: '#5e2f85',
            700: '#4f276f',
            800: '#3f1f58',
            900: '#2f1742',
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
