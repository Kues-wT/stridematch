import { useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera,
  ImagePlus,
  Loader2,
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Footprints,
  PersonStanding,
  SportShoe,
} from 'lucide-react'
import {
  analyzeFootPhoto,
  analyzeWearPhoto,
  combineFootAnalyses,
  type ArchType,
  type FootAnalysisResult,
  type WearAnalysisResult,
} from '../lib/analysis'
import { useProfile } from '../context/ProfileContext'
import { StepIndicator } from '../components/StepIndicator'
import { OptionCard } from '../components/OptionCard'
import { useI18n } from '../context/I18nContext'
import type { TranslationKey } from '../i18n/translations'

export function Analyze() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const topRef = useRef<HTMLInputElement>(null)
  const sideRef = useRef<HTMLInputElement>(null)
  const wearRef = useRef<HTMLInputElement>(null)
  const {
    profile,
    setProfile,
    photoPreview,
    setPhotoPreview,
    analysis,
    setAnalysis,
    setWearAnalysis,
  } = useProfile()

  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState<'top' | 'side' | 'wear' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [topResult, setTopResult] = useState<FootAnalysisResult | null>(null)
  const [sideResult, setSideResult] = useState<FootAnalysisResult | null>(null)
  const [wearResult, setWearResult] = useState<WearAnalysisResult | null>(null)
  const [sidePreview, setSidePreview] = useState<string | null>(null)
  const [wearPreview, setWearPreview] = useState<string | null>(null)

  const STEPS = [t('stepPhotos'), t('stepConfirm'), t('stepGoals'), t('stepResults')]

  const archWord = (a: ArchType) =>
    t(
      (a === 'low' ? 'archLowLabel' : a === 'high' ? 'archHighLabel' : 'archNormalLabel') as TranslationKey,
    )

  const runTop = async (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(t('errImageType'))
      return
    }
    setError(null)
    setBusy('top')
    try {
      const localUrl = URL.createObjectURL(file)
      setPhotoPreview(localUrl)
      const result = await analyzeFootPhoto(file, 'top-down')
      setTopResult(result)
      const combined = combineFootAnalyses(result, sideResult)
      applyFootResult(combined ?? result)
    } catch {
      setError(t('errTopPhoto'))
    } finally {
      setBusy(null)
    }
  }

  const runSide = async (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(t('errImageType'))
      return
    }
    setError(null)
    setBusy('side')
    try {
      const localUrl = URL.createObjectURL(file)
      setSidePreview(localUrl)
      const result = await analyzeFootPhoto(file, 'side')
      setSideResult(result)
      const combined = combineFootAnalyses(topResult, result)
      applyFootResult(combined ?? result)
    } catch {
      setError(t('errSidePhoto'))
    } finally {
      setBusy(null)
    }
  }

  const runWear = async (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(t('errImageType'))
      return
    }
    setError(null)
    setBusy('wear')
    try {
      const localUrl = URL.createObjectURL(file)
      setWearPreview(localUrl)
      const result = await analyzeWearPhoto(file)
      setWearResult(result)
      setWearAnalysis(result)
      setProfile({
        wearAnalysis: result,
        pronation: profile.pronation ?? result.pronationHint,
      })
    } catch {
      setError(t('errWearPhoto'))
    } finally {
      setBusy(null)
    }
  }

  const applyFootResult = (result: FootAnalysisResult) => {
    setAnalysis(result)
    setProfile({
      arch: result.arch,
      archSource: 'photo',
      widthHint:
        result.widthHint === 'standard' && profile.widthHint ? profile.widthHint : result.widthHint,
      photoAnalysis: result,
    })
  }

  const continueFromPhotos = () => {
    if (!analysis && !profile.arch) {
      setProfile({
        arch: profile.arch ?? 'normal',
        archSource: 'manual',
        widthHint: profile.widthHint ?? 'standard',
      })
    }
    setError(null)
    setStep(1)
  }

  const skipPhotos = () => {
    setTopResult(null)
    setSideResult(null)
    setAnalysis(null)
    setPhotoPreview(null)
    setSidePreview(null)
    setProfile({
      arch: profile.arch ?? 'normal',
      archSource: 'manual',
      widthHint: profile.widthHint ?? 'standard',
    })
    setStep(1)
  }

  const goQuiz = () => {
    if (!profile.arch) {
      setError(t('errPickArch'))
      return
    }
    setError(null)
    setStep(2)
  }

  const finishQuiz = () => {
    const required = [
      'pronation',
      'experience',
      'weeklyDistance',
      'surface',
      'cushion',
      'budget',
      'arch',
      'widthHint',
    ] as const
    for (const key of required) {
      if (!profile[key]) {
        setError(t('errAnswerAll'))
        return
      }
    }
    if (!profile.archSource) {
      setProfile({ archSource: analysis ? 'photo' : 'manual' })
    }
    setError(null)
    navigate('/results')
  }

  const topLabel = topResult
    ? `${archWord(topResult.arch)} · ${topResult.widthHint}`
    : null
  const sideLabel = sideResult
    ? `${archWord(sideResult.arch)} · ${Math.round((sideResult.sideArchRatio ?? 0) * 100)}%`
    : null
  const wearLabel = wearResult
    ? `${wearResult.pronationHint} · ${Math.round(wearResult.confidence * 100)}%`
    : null

  return (
    <div className="page narrow">
      <header className="page-header">
        <p className="eyebrow">{t('analyzeEyebrow')}</p>
        <h1>{t('analyzeTitle')}</h1>
        <StepIndicator steps={STEPS} current={step} />
      </header>

      {step === 0 && (
        <section className="panel">
          <h2>{t('photoSectionTitle')}</h2>
          <p className="muted">{t('photoSectionBody')}</p>

          <div className="photo-slots">
            <PhotoSlot
              title={t('photoTopTitle')}
              icon={<Footprints size={20} />}
              hint={t('photoTopHint')}
              busy={busy === 'top'}
              preview={topResult?.previewDataUrl || photoPreview}
              resultLabel={topLabel}
              analysingLabel={t('analysing')}
              addLabel={t('addPhoto')}
              replaceLabel={t('tapReplace')}
              inputRef={topRef}
              onFile={(f) => void runTop(f)}
            />
            <PhotoSlot
              title={t('photoSideTitle')}
              icon={<PersonStanding size={20} />}
              hint={t('photoSideHint')}
              busy={busy === 'side'}
              preview={sideResult?.previewDataUrl || sidePreview}
              resultLabel={sideLabel}
              analysingLabel={t('analysing')}
              addLabel={t('addPhoto')}
              replaceLabel={t('tapReplace')}
              inputRef={sideRef}
              onFile={(f) => void runSide(f)}
            />
            <PhotoSlot
              title={t('photoWearTitle')}
              icon={<SportShoe size={20} />}
              hint={t('photoWearHint')}
              busy={busy === 'wear'}
              preview={wearResult?.previewDataUrl || wearPreview}
              resultLabel={wearLabel}
              analysingLabel={t('analysing')}
              addLabel={t('addPhoto')}
              replaceLabel={t('tapReplace')}
              inputRef={wearRef}
              onFile={(f) => void runWear(f)}
            />
          </div>

          <div className="tip-box">
            <Lightbulb size={18} />
            <div>
              <strong>{t('photoTips')}</strong>
              <ul>
                <li>{t('photoTip1')}</li>
                <li>{t('photoTip2')}</li>
                <li>{t('photoTip3')}</li>
              </ul>
            </div>
          </div>

          <div className="row-actions">
            <button type="button" className="btn btn-secondary" onClick={skipPhotos}>
              {t('skipPhotos')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={continueFromPhotos}
              disabled={!!busy}
            >
              {t('continue')} <ArrowRight size={16} />
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
      )}

      {step === 1 && (
        <section className="panel">
          <h2>{t('confirmTitle')}</h2>
          <p className="muted">
            {analysis
              ? t('confirmWithPhoto', {
                  arch: archWord(analysis.arch),
                  confidence: Math.round(analysis.archConfidence * 100),
                  mode: analysis.mode,
                })
              : t('confirmNoPhoto')}
          </p>

          {(analysis?.previewDataUrl || photoPreview || sidePreview || wearPreview) && (
            <div className="preview-mosaic">
              {(analysis?.previewDataUrl || photoPreview) && (
                <img
                  src={analysis?.previewDataUrl || photoPreview || ''}
                  alt=""
                  className="preview-img"
                />
              )}
              {(sideResult?.previewDataUrl || sidePreview) && (
                <img
                  src={sideResult?.previewDataUrl || sidePreview || ''}
                  alt=""
                  className="preview-img"
                />
              )}
              {(wearResult?.previewDataUrl || wearPreview) && (
                <img
                  src={wearResult?.previewDataUrl || wearPreview || ''}
                  alt=""
                  className="preview-img"
                />
              )}
              <ul className="note-list">
                {(analysis?.notes ?? []).slice(0, 4).map((n) => (
                  <li key={n}>{n}</li>
                ))}
                {(wearResult?.notes ?? []).slice(0, 2).map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <h3 className="field-label">{t('archType')}</h3>
          <div className="option-grid">
            {(
              [
                { id: 'low' as ArchType, title: t('archLow'), description: t('archLowDesc') },
                {
                  id: 'normal' as ArchType,
                  title: t('archNormal'),
                  description: t('archNormalDesc'),
                },
                { id: 'high' as ArchType, title: t('archHigh'), description: t('archHighDesc') },
              ] as const
            ).map((opt) => (
              <OptionCard
                key={opt.id}
                selected={profile.arch === opt.id}
                title={opt.title}
                description={opt.description}
                onClick={() =>
                  setProfile({
                    arch: opt.id,
                    archSource: analysis ? 'photo' : 'manual',
                  })
                }
              />
            ))}
          </div>

          <h3 className="field-label">{t('widthLabel')}</h3>
          <div className="option-grid three">
            {(
              [
                { id: 'narrow' as const, title: t('widthNarrow') },
                { id: 'standard' as const, title: t('widthStandard') },
                { id: 'wide' as const, title: t('widthWide') },
              ] as const
            ).map((opt) => (
              <OptionCard
                key={opt.id}
                selected={profile.widthHint === opt.id}
                title={opt.title}
                onClick={() => setProfile({ widthHint: opt.id })}
              />
            ))}
          </div>

          {wearResult && (
            <p className="muted wear-hint">
              {t('wearSuggests', { hint: wearResult.pronationHint })}
            </p>
          )}

          <div className="row-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(0)}>
              <RefreshCw size={16} /> {t('backToPhotos')}
            </button>
            <button type="button" className="btn btn-primary" onClick={goQuiz}>
              {t('continue')} <ArrowRight size={16} />
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
      )}

      {step === 2 && (
        <section className="panel">
          <h2>{t('goalsTitle')}</h2>
          <p className="muted">{t('goalsBody')}</p>

          <Field label={t('qPronation')}>
            <div className="option-grid">
              <OptionCard
                selected={profile.pronation === 'over'}
                title={t('pronationOver')}
                description={
                  wearResult?.pronationHint === 'over'
                    ? t('pronationOverWear')
                    : t('pronationOverDesc')
                }
                onClick={() => setProfile({ pronation: 'over' })}
              />
              <OptionCard
                selected={profile.pronation === 'neutral'}
                title={t('pronationNeutral')}
                description={t('pronationNeutralDesc')}
                onClick={() => setProfile({ pronation: 'neutral' })}
              />
              <OptionCard
                selected={profile.pronation === 'under'}
                title={t('pronationUnder')}
                description={
                  wearResult?.pronationHint === 'under'
                    ? t('pronationUnderWear')
                    : t('pronationUnderDesc')
                }
                onClick={() => setProfile({ pronation: 'under' })}
              />
            </div>
          </Field>

          <Field label={t('qExperience')}>
            <div className="option-grid three">
              <OptionCard
                selected={profile.experience === 'beginner'}
                title={t('expBeginner')}
                onClick={() => setProfile({ experience: 'beginner' })}
              />
              <OptionCard
                selected={profile.experience === 'intermediate'}
                title={t('expIntermediate')}
                onClick={() => setProfile({ experience: 'intermediate' })}
              />
              <OptionCard
                selected={profile.experience === 'advanced'}
                title={t('expAdvanced')}
                onClick={() => setProfile({ experience: 'advanced' })}
              />
            </div>
          </Field>

          <Field label={t('qDistance')}>
            <div className="option-grid three">
              <OptionCard
                selected={profile.weeklyDistance === 'short'}
                title={t('distShort')}
                description={t('distShortDesc')}
                onClick={() => setProfile({ weeklyDistance: 'short' })}
              />
              <OptionCard
                selected={profile.weeklyDistance === 'moderate'}
                title={t('distModerate')}
                description={t('distModerateDesc')}
                onClick={() => setProfile({ weeklyDistance: 'moderate' })}
              />
              <OptionCard
                selected={profile.weeklyDistance === 'long'}
                title={t('distLong')}
                description={t('distLongDesc')}
                onClick={() => setProfile({ weeklyDistance: 'long' })}
              />
            </div>
          </Field>

          <Field label={t('qSurface')}>
            <div className="option-grid">
              <OptionCard
                selected={profile.surface === 'road'}
                title={t('surfaceRoad')}
                onClick={() => setProfile({ surface: 'road' })}
              />
              <OptionCard
                selected={profile.surface === 'trail'}
                title={t('surfaceTrail')}
                onClick={() => setProfile({ surface: 'trail' })}
              />
              <OptionCard
                selected={profile.surface === 'mixed'}
                title={t('surfaceMixed')}
                onClick={() => setProfile({ surface: 'mixed' })}
              />
              <OptionCard
                selected={profile.surface === 'track'}
                title={t('surfaceTrack')}
                onClick={() => setProfile({ surface: 'track' })}
              />
            </div>
          </Field>

          <Field label={t('qCushion')}>
            <div className="option-grid three">
              <OptionCard
                selected={profile.cushion === 'firm'}
                title={t('cushionFirm')}
                onClick={() => setProfile({ cushion: 'firm' })}
              />
              <OptionCard
                selected={profile.cushion === 'balanced'}
                title={t('cushionBalanced')}
                onClick={() => setProfile({ cushion: 'balanced' })}
              />
              <OptionCard
                selected={profile.cushion === 'max'}
                title={t('cushionMax')}
                onClick={() => setProfile({ cushion: 'max' })}
              />
            </div>
          </Field>

          <Field label={t('qBudget')}>
            <div className="option-grid">
              <OptionCard
                selected={profile.budget === 'budget'}
                title={t('budgetLow')}
                description={t('budgetLowDesc')}
                onClick={() => setProfile({ budget: 'budget' })}
              />
              <OptionCard
                selected={profile.budget === 'mid'}
                title={t('budgetMid')}
                description={t('budgetMidDesc')}
                onClick={() => setProfile({ budget: 'mid' })}
              />
              <OptionCard
                selected={profile.budget === 'premium'}
                title={t('budgetPremium')}
                description={t('budgetPremiumDesc')}
                onClick={() => setProfile({ budget: 'premium' })}
              />
              <OptionCard
                selected={profile.budget === 'any'}
                title={t('budgetAny')}
                onClick={() => setProfile({ budget: 'any' })}
              />
            </div>
          </Field>

          <div className="row-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              {t('back')}
            </button>
            <button type="button" className="btn btn-primary" onClick={finishQuiz}>
              <Camera size={16} /> {t('seeMatches')}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <h3 className="field-label">{label}</h3>
      {children}
    </div>
  )
}

function PhotoSlot({
  title,
  icon,
  hint,
  busy,
  preview,
  resultLabel,
  analysingLabel,
  addLabel,
  replaceLabel,
  inputRef,
  onFile,
}: {
  title: string
  icon: ReactNode
  hint: string
  busy: boolean
  preview: string | null
  resultLabel: string | null
  analysingLabel: string
  addLabel: string
  replaceLabel: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onFile: (file: File | null | undefined) => void
}) {
  return (
    <div className="photo-slot">
      <div className="photo-slot-head">
        <span className="photo-slot-icon">{icon}</span>
        <div>
          <h3>{title}</h3>
          <p className="muted">{hint}</p>
        </div>
      </div>
      <button
        type="button"
        className={`dropzone compact ${preview ? 'has-preview' : ''}`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {busy ? (
          <>
            <Loader2 className="spin" size={28} />
            <p>{analysingLabel}</p>
          </>
        ) : preview ? (
          <>
            <img src={preview} alt="" className="slot-thumb" />
            <p>{resultLabel ?? replaceLabel}</p>
          </>
        ) : (
          <>
            <ImagePlus size={28} />
            <p>
              <strong>{addLabel}</strong>
            </p>
          </>
        )}
      </button>
    </div>
  )
}
