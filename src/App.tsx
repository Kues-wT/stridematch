import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, useRoutes, type RouteObject } from 'react-router-dom'
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

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'analyze', element: <Analyze /> },
      { path: 'results', element: <Results /> },
      { path: 'results/:id', element: <ShoeDetail /> },
      { path: 'catalog', element: <Catalog /> },
      { path: 'shortlist', element: <Shortlist /> },
      { path: 'compare', element: <Compare /> },
      { path: 'stores', element: <Stores /> },
      { path: 'how-it-works', element: <HowItWorks /> },
      { path: 'feedback', element: <Feedback /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]

/** Everything the pages need above the router (also used by tests). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <I18nProvider>
        <ProfileProvider>
          <ToastProvider>{children}</ToastProvider>
        </ProfileProvider>
      </I18nProvider>
    </MotionProvider>
  )
}

function AppRoutes() {
  return useRoutes(routes)
}

export default function App() {
  // Send any feedback that was saved while offline
  useEffect(() => {
    void syncFeedback()
    const onOnline = () => void syncFeedback()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  )
}
