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
import { ProfileDialogProvider } from './context/ProfileDialogContext'
import UserCheckinItemPage from './pages/UserCheckinItemPage'
import ChestInventoryPage from './pages/ChestInventoryPage'
import QrReaderC from './pages/QrReader'
import QRScanner from './pages/QrReader'

function App() {
    return (
        <ProfileDialogProvider>
            <UserProvider>
                <ChestProvider>
                    <ToastContainer position='top-center' autoClose={2000} className={'w-full'} pauseOnHover={false}
                        pauseOnFocusLoss={false} />
                    <MenuBar />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="accountability" element={<AppWrapper />}>
                            <Route path="checkout/:chestSerial/:chestcaseNumber" element={<CheckoutChestDetail />} />
                            <Route path="checkin" element={<UserCheckinItemPage />} />
                            <Route path="inventory/chest/:chestSerial/:chestcaseNumber" element={<ChestInventoryPage />}/>
                        </Route>
                        <Route path="detail">
                            <Route path="item/:itemId" element={<ItemDetail />} />
                        </Route>
                        <Route path="qr" element={<QRScanner />}/>
                    </Routes>
                </ChestProvider>
            </UserProvider>
        </ProfileDialogProvider>
    )
}

export default App
