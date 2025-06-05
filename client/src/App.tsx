import { Route, Routes } from 'react-router'
import './App.css'
import CheckoutChestDetail from './components/Checkout/Checkout'
import ItemDetail from './components/Detail/ItemDetail'
import MenuBar from './components/MenuBar/MenuBar'
import { ChestProvider } from './context/ChestContext'
import { UserProvider } from './context/UserContext'
import AppWrapper from './pages/AccountabilityWrapper'
import HomePage from './pages/HomePage'
import { ToastContainer } from 'react-toastify';

function App() {
    return (
        <UserProvider>
            <ChestProvider>
                <ToastContainer position='top-center' autoClose={1000}/>
                <MenuBar />
                <Routes>
                    <Route path="accountability" element={<AppWrapper />}>
                        <Route path=":chestSerial/:chestcaseNumber" element={<CheckoutChestDetail />} />
                    </Route>
                    <Route path="/" element={<HomePage />} />
                    <Route path="detail">
                        <Route path="item/:itemId" element={<ItemDetail />} />
                    </Route>
                </Routes>
            </ChestProvider>
        </UserProvider>
    )
}

export default App
