import './App.css'
import { Link, Route, Routes } from 'react-router'
import CheckoutChestDetail from './components/Checkout/Checkout'
import AppWrapper from './pages/AccountabilityWrapper'
import { ChestProvider } from './context/ChestContext'
import HomePage from './pages/HomePage'
import Home from '@/assets/home.svg'
import ItemDetail from './components/Detail/ItemDetail'

function App() {
    return (
        <ChestProvider>
            <div className="bg-background h-[50px] absolute top-0 left-0 w-full flex flex-row align-items-center px-4 shadow-md">
                <Link to="/" className='flex items-center gap-2'>
                    <img src={Home} alt="Home" height={30} width={30} />
                </Link>
            </div>
            <Routes>
                <Route path="accountability" element={<AppWrapper />}>
                    <Route path=":chestSerial/:chestcaseNumber" element={<CheckoutChestDetail />} />
                </Route>
                <Route path="/" element={<HomePage />} />
                <Route path="detail">
                    {/* <Route path="chest/:chestId" element={<ChestDetail />} /> */}
                    <Route path="item/:itemId" element={<ItemDetail/>} />
                </Route>
            </Routes>
        </ChestProvider>
    )
}

export default App
