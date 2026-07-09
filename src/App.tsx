import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileContext'
import { I18nProvider } from './context/I18nContext'
import { ToastProvider } from './components/Toast'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Analyze } from './pages/Analyze'
import { Results } from './pages/Results'
import { ShoeDetail } from './pages/ShoeDetail'
import { HowItWorks } from './pages/HowItWorks'
import { Catalog } from './pages/Catalog'
import { Shortlist } from './pages/Shortlist'
import { Compare } from './pages/Compare'
import { Stores } from './pages/Stores'

export default function App() {
  return (
    <I18nProvider>
      <ProfileProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="analyze" element={<Analyze />} />
                <Route path="results" element={<Results />} />
                <Route path="results/:id" element={<ShoeDetail />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="shortlist" element={<Shortlist />} />
                <Route path="compare" element={<Compare />} />
                <Route path="stores" element={<Stores />} />
                <Route path="how-it-works" element={<HowItWorks />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ProfileProvider>
    </I18nProvider>
  )
}
