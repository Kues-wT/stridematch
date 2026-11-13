import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { syncFeedback } from './lib/feedback'
import { ProfileProvider } from './context/ProfileContext'
import { I18nProvider } from './context/I18nContext'
import { ToastProvider } from './components/Toast'
import { MotionProvider } from './motion/MotionProvider'
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
import { Feedback } from './pages/Feedback'

export default function App() {
  // Send any feedback that was saved while offline
  useEffect(() => {
    void syncFeedback()
    const onOnline = () => void syncFeedback()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <MotionProvider>
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
                  <Route path="feedback" element={<Feedback />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </ProfileProvider>
      </I18nProvider>
    </MotionProvider>
  )
}
