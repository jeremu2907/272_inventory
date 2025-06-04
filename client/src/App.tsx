import './App.css'
import { Route, Routes } from 'react-router'
import ChestDetail from './components/ChestItemDetail/ChestDetail'
import AppWrapper from './pages/AppWrapper'
import { ChestProvider } from './context/ChestContext'

function App() {
    return (
        <ChestProvider>
            <Routes>
                <Route element={<AppWrapper />}>
                    <Route path=":plt/:chestSerial/:chestSetNumber" element={<ChestDetail />} />
                </Route>
            </Routes>
        </ChestProvider>
    )
}

export default App
