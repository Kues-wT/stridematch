import { useState } from 'react'
import { Check, ChevronDown, MessageSquareHeart } from 'lucide-react'
import type { ShoeMatch } from '../lib/recommend'
import type { UserProfile } from '../lib/analysis'
import { saveFeedback, type FeedbackRating } from '../lib/feedback'
import { useI18n } from '../context/I18nContext'
import { useToast } from '../components/Toast'

interface FeedbackPromptProps {
  matches: ShoeMatch[]
  profile: UserProfile
}

const RATINGS: { value: FeedbackRating; labelKey: 'feedbackSpotOn' | 'feedbackClose' | 'feedbackOff' }[] = [
  { value: 'spot-on', labelKey: 'feedbackSpotOn' },
  { value: 'close', labelKey: 'feedbackClose' },
  { value: 'off', labelKey: 'feedbackOff' },
]

/**
 * Short in-app prompt for moderated user tests. Answers stay in localStorage;
 * the facilitator exports them from /feedback at the end of a session.
 */
export function FeedbackPrompt({ matches, profile }: FeedbackPromptProps) {
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const [rating, setRating] = useState<FeedbackRating | null>(null)
  const [wouldTry, setWouldTry] = useState('')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const submit = () => {
    if (!rating) {
      toast(t('feedbackPickRating'))
      return
    }
    saveFeedback({
      rating,
      wouldTry,
      note: note.trim(),
      lang,
      profile: {
        arch: profile.arch,
        archSource: profile.archSource,
        widthHint: profile.widthHint,
        pronation: profile.pronation,
        experience: profile.experience,
        weeklyDistance: profile.weeklyDistance,
        surface: profile.surface,
        cushion: profile.cushion,
        budget: profile.budget,
      },
      top: matches.slice(0, 3).map((m) => ({ id: m.shoe.id, score: m.score })),
    })
    setSent(true)
    toast(t('feedbackThanksTitle'))
  }

  if (sent) {
    return (
      <section className="panel feedback-panel" aria-live="polite">
        <h2 className="feedback-heading">
          <Check size={18} /> {t('feedbackThanksTitle')}
        </h2>
        <p className="muted">{t('feedbackThanksBody')}</p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setSent(false)
            setRating(null)
            setWouldTry('')
            setNote('')
          }}
        >
          {t('feedbackAgain')}
        </button>
      </section>
    )
  }

  return (
    <section className="panel feedback-panel">
      <h2 className="feedback-heading">
        <MessageSquareHeart size={18} /> {t('feedbackTitle')}
      </h2>
      <p className="muted">{t('feedbackLede')}</p>

      <div className="feedback-ratings" role="group" aria-label={t('feedbackTitle')}>
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            className={`feedback-chip${rating === r.value ? ' selected' : ''}`}
            aria-pressed={rating === r.value}
            onClick={() => setRating(r.value)}
          >
            {t(r.labelKey)}
          </button>
        ))}
      </div>

      <label className="select-field">
        <span>{t('feedbackWouldTry')}</span>
        <div className="select-shell">
          <select value={wouldTry} onChange={(e) => setWouldTry(e.target.value)}>
            <option value="">{t('feedbackWouldTryNone')}</option>
            {matches.map((m) => (
              <option key={m.shoe.id} value={m.shoe.id}>
                {m.shoe.brand} {m.shoe.name}
              </option>
            ))}
          </select>
          <ChevronDown className="select-chevron" size={16} aria-hidden />
        </div>
      </label>

      <label className="select-field">
        <span>{t('feedbackNote')}</span>
        <textarea
          className="feedback-note"
          rows={3}
          maxLength={400}
          value={note}
          placeholder={t('feedbackNotePlaceholder')}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <button type="button" className="btn btn-primary" onClick={submit}>
        {t('feedbackSubmit')}
      </button>
    </section>
  )
}
