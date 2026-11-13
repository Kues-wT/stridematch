import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCopy, CloudUpload, Download, Trash2 } from 'lucide-react'
import {
  clearFeedback,
  feedbackTally,
  feedbackToCsv,
  loadFeedback,
  syncFeedback,
  type FeedbackEntry,
} from '../lib/feedback'
import { shoes } from '../data/shoes'
import { useI18n } from '../context/I18nContext'
import { useToast } from '../components/Toast'

const shoeName = (id: string) => {
  const shoe = shoes.find((s) => s.id === id)
  return shoe ? `${shoe.brand} ${shoe.name}` : id
}

/**
 * Facilitator view for moderated tests — not linked from the main nav.
 * Lists this device's answers; everyone's answers live in the Supabase feedback table.
 */
export function Feedback() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setEntries(loadFeedback())
    setHydrated(true)
    void syncFeedback().then(() => setEntries(loadFeedback()))
  }, [])

  const pending = entries.filter((e) => !e.synced).length

  const retry = async () => {
    const left = await syncFeedback()
    setEntries(loadFeedback())
    toast(left === 0 ? t('feedbackAllSent') : t('feedbackPending', { count: left }))
  }

  const csv = useMemo(() => feedbackToCsv(entries), [entries])
  const tally = useMemo(() => feedbackTally(entries), [entries])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(t('feedbackCopied'))
    } catch {
      toast(t('toastShareFail'))
    }
  }

  const download = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kasutku-feedback-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const wipe = () => {
    if (!window.confirm(t('feedbackClearConfirm'))) return
    clearFeedback()
    setEntries([])
    toast(t('feedbackCleared'))
  }

  if (!hydrated) {
    return (
      <div className="page narrow">
        <div className="panel center-panel">
          <p className="muted">{t('loadingProfile')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('feedbackAdminEyebrow')}</p>
        <h1>{t('feedbackAdminTitle')}</h1>
        <p className="lede">{t('feedbackAdminLede')}</p>
      </header>

      {entries.length === 0 ? (
        <div className="panel center-panel">
          <h2>{t('feedbackAdminEmptyTitle')}</h2>
          <p className="muted">{t('feedbackAdminEmptyBody')}</p>
          <Link to="/analyze" className="btn btn-primary">
            {t('startAnalysis')}
          </Link>
        </div>
      ) : (
        <>
          <div className="panel">
            <div className="feedback-tally">
              <span className="feedback-tally-item">
                <strong>{entries.length}</strong> {t('feedbackCount')}
              </span>
              <span className="feedback-tally-item">
                <strong>{tally['spot-on']}</strong> {t('feedbackSpotOn')}
              </span>
              <span className="feedback-tally-item">
                <strong>{tally.close}</strong> {t('feedbackClose')}
              </span>
              <span className="feedback-tally-item">
                <strong>{tally.off}</strong> {t('feedbackOff')}
              </span>
            </div>
            <p className="muted">
              {pending === 0 ? t('feedbackAllSent') : t('feedbackPending', { count: pending })}
            </p>
            <div className="row-actions">
              {pending > 0 && (
                <button type="button" className="btn btn-primary" onClick={() => void retry()}>
                  <CloudUpload size={16} /> {t('feedbackRetry')}
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => void copy(csv)}>
                <ClipboardCopy size={16} /> {t('feedbackCopyCsv')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={download}>
                <Download size={16} /> {t('feedbackDownloadCsv')}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void copy(JSON.stringify(entries, null, 2))}
              >
                <ClipboardCopy size={16} /> {t('feedbackCopyJson')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={wipe}>
                <Trash2 size={16} /> {t('feedbackClear')}
              </button>
            </div>
          </div>

          <div className="feedback-list">
            {entries.map((e) => (
              <article key={e.id} className="panel feedback-entry">
                <header className="feedback-entry-head">
                  <span className={`feedback-badge rating-${e.rating}`}>
                    {t(
                      e.rating === 'spot-on'
                        ? 'feedbackSpotOn'
                        : e.rating === 'close'
                          ? 'feedbackClose'
                          : 'feedbackOff',
                    )}
                  </span>
                  <time className="muted" dateTime={e.at}>
                    {new Date(e.at).toLocaleString()}
                  </time>
                </header>

                <p className="feedback-profile muted">
                  {[
                    `${e.profile.arch} arch (${e.profile.archSource})`,
                    e.profile.pronation,
                    e.profile.widthHint,
                    e.profile.experience,
                    e.profile.weeklyDistance,
                    e.profile.surface,
                    `${e.profile.cushion} cushion`,
                    e.profile.budget,
                    e.lang.toUpperCase(),
                  ].join(' · ')}
                </p>

                <p className="feedback-top">
                  {e.top.map((s, i) => (
                    <span key={s.id}>
                      {i > 0 && ' · '}
                      {shoeName(s.id)} <span className="muted">{s.score}%</span>
                    </span>
                  ))}
                </p>

                {e.wouldTry && (
                  <p className="feedback-would-try">
                    {t('feedbackWouldTry')} <strong>{shoeName(e.wouldTry)}</strong>
                  </p>
                )}

                {e.note && <blockquote className="feedback-quote">{e.note}</blockquote>}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
