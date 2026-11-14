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
  Ruler,
  Sparkles,
} from 'lucide-react'
import {
  analyzeFootPhoto,
  analyzeWearPhoto,
  combineFootAnalyses,
  type ArchType,
  type FootAnalysisResult,
  type WearAnalysisResult,
} from '../lib/analysis'
import { aiCheckPhoto, scanFootprintFile, scanPaperFile, type AiCheckError } from '../lib/footscan/browser'
import type { ScanIssue, ScanIssueCode } from '../lib/footscan/footprint'
import type { SizeScan } from '../lib/footscan/sizing'
import { loadJson, saveJson } from '../lib/storage'
import { useProfile } from '../context/ProfileContext'
import { StepIndicator } from '../components/StepIndicator'
import { OptionCard } from '../components/OptionCard'
import { useI18n } from '../context/I18nContext'
import type { TranslationKey } from '../i18n/translations'

const ISSUE_KEYS: Record<ScanIssueCode, TranslationKey> = {
  'low-contrast': 'issueLowContrast',
  'not-found': 'issueNotFound',
  'cut-off': 'issueCutOff',
  'too-small': 'issueTooSmall',
  'not-foot-shape': 'issueNotFootShape',
  blurry: 'issueBlurry',
  'no-paper': 'issueNoPaper',
  'paper-cut-off': 'issuePaperCutOff',
  'toes-off-paper': 'issueToesOffPaper',
  'side-off-paper': 'issueSideOffPaper',
}

const AI_ERROR_KEYS: Record<AiCheckError, TranslationKey> = {
  'not-configured': 'aiNotConfigured',
  'limit-reached': 'aiLimit',
  offline: 'aiFailed',
  failed: 'aiFailed',
}

const AI_PREF_KEY = 'stridematch.aiCheck.v1'

export function Analyze() {
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const topRef = useRef<HTMLInputElement>(null)
  const sizeRef = useRef<HTMLInputElement>(null)
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
  const [busy, setBusy] = useState<'top' | 'size' | 'side' | 'wear' | null>(null)
  const [printIssues, setPrintIssues] = useState<string[]>([])
  const [printNotes, setPrintNotes] = useState<string[]>([])
  const [sizeScan, setSizeScan] = useState<SizeScan | null>(null)
  const [sizePreview, setSizePreview] = useState<string | null>(null)
  const [sizeIssues, setSizeIssues] = useState<string[]>([])
  const [sizeNotes, setSizeNotes] = useState<string[]>([])
  const [aiOn, setAiOn] = useState(() => loadJson<boolean>(AI_PREF_KEY, false))
  const [aiBusy, setAiBusy] = useState<'top' | 'size' | null>(null)
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
    setPrintIssues([])
    setPrintNotes([])
    try {
      const { scan, previewDataUrl } = await scanFootprintFile(file)
      setPhotoPreview(previewDataUrl)
      setPrintIssues(issueText(scan.issues))
      if (!scan.ok || !scan.arch || scan.csi === undefined) {
        setTopResult(null)
        return
      }

      const csiPct = Math.round(scan.csi * 100)
      let result: FootAnalysisResult = {
        arch: scan.arch,
        archConfidence: scan.confidence ?? 0.6,
        widthHint: sizeScan?.widthClass ?? profile.widthHint ?? 'standard',
        brightness: 0,
        notes: [
          `Footprint arch index ${csiPct}% (midfoot ÷ forefoot print width) → ${scan.arch} arch.`,
          'Under 25% usually means a high arch, 45% or more a low / flat arch.',
        ],
        previewDataUrl,
        mode: 'footprint',
        csi: scan.csi,
      }
      setTopResult(result)
      applyFootResult(combineFootAnalyses(result, sideResult) ?? result)

      if (aiOn) {
        setAiBusy('top')
        const ai = await aiCheckPhoto(file, 'footprint', lang, { arch: scan.arch, csi: scan.csi })
        setAiBusy(null)
        if (!ai.ok) {
          setPrintNotes([t(AI_ERROR_KEYS[ai.error])])
          return
        }
        const { check } = ai
        const notes = check.explanation ? [t('aiSays', { text: check.explanation })] : []
        if (!check.usable) {
          setPrintIssues((prev) => [...prev, ...(check.retakeTip ? [check.retakeTip] : check.problems)])
          result = { ...result, archConfidence: Math.min(result.archConfidence, 0.45) }
        } else if (check.archGuess !== 'unknown' && check.archGuess !== scan.arch) {
          notes.unshift(t('aiDisagree', { arch: archWord(check.archGuess) }))
          result = { ...result, archConfidence: Math.min(result.archConfidence, 0.5) }
        } else if (check.archGuess === scan.arch) {
          notes.unshift(t('aiAgree'))
          result = { ...result, archConfidence: Math.min(0.92, result.archConfidence + 0.05) }
        }
        result = { ...result, notes: [...result.notes, ...notes] }
        setPrintNotes(notes)
        setTopResult(result)
        applyFootResult(combineFootAnalyses(result, sideResult) ?? result)
      }
    } catch {
      setError(t('errPrintPhoto'))
    } finally {
      setBusy(null)
      setAiBusy(null)
    }
  }

  const runSize = async (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(t('errImageType'))
      return
    }
    setError(null)
    setBusy('size')
    setSizeIssues([])
    setSizeNotes([])
    try {
      const { scan, previewDataUrl } = await scanPaperFile(file)
      setSizePreview(previewDataUrl)
      setSizeIssues(issueText(scan.issues))
      if (!scan.ok || !scan.size || !scan.lengthMm || !scan.widthMm || !scan.widthClass) {
        setSizeScan(null)
        setProfile({ footMeasure: undefined })
        return
      }
      setSizeScan(scan)
      setProfile({
        widthHint: scan.widthClass,
        footMeasure: {
          lengthMm: Math.round(scan.lengthMm),
          widthMm: Math.round(scan.widthMm),
          widthClass: scan.widthClass,
          size: scan.size,
        },
      })
      if (analysis) setAnalysis({ ...analysis, widthHint: scan.widthClass })

      if (aiOn) {
        setAiBusy('size')
        const ai = await aiCheckPhoto(file, 'paper', lang, {
          lengthMm: Math.round(scan.lengthMm),
          widthMm: Math.round(scan.widthMm),
        })
        setAiBusy(null)
        if (!ai.ok) {
          setSizeNotes([t(AI_ERROR_KEYS[ai.error])])
          return
        }
        const { check } = ai
        if (!check.usable) {
          setSizeIssues((prev) => [...prev, ...(check.retakeTip ? [check.retakeTip] : check.problems)])
        }
        setSizeNotes(check.explanation ? [t('aiSays', { text: check.explanation })] : [])
      }
    } catch {
      setError(t('errSizePhoto'))
    } finally {
      setBusy(null)
      setAiBusy(null)
    }
  }

  const issueText = (issues: ScanIssue[]) => issues.map((i) => t(ISSUE_KEYS[i.code]))

  const toggleAi = (on: boolean) => {
    setAiOn(on)
    saveJson(AI_PREF_KEY, on)
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
    setSizeScan(null)
    setSizePreview(null)
    setPrintIssues([])
    setSizeIssues([])
    setProfile({
      arch: profile.arch ?? 'normal',
      archSource: 'manual',
      widthHint: profile.widthHint ?? 'standard',
      footMeasure: undefined,
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
    ? t('scanArchResult', {
        arch: archWord(topResult.arch),
        csi: Math.round((topResult.csi ?? 0) * 100),
      })
    : printIssues.length
      ? t('retakeNeeded')
      : null
  const sizeLabel = sizeScan?.size
    ? t('scanSizeResult', {
        length: Math.round(sizeScan.lengthMm ?? 0),
        eu: sizeScan.size.eu,
        us: sizeScan.size.usMen,
      })
    : sizeIssues.length
      ? t('retakeNeeded')
      : null
  const measure = profile.footMeasure
  const widthWord = (w: 'narrow' | 'standard' | 'wide') =>
    t(w === 'narrow' ? 'widthNarrow' : w === 'wide' ? 'widthWide' : 'widthStandard')
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
          <div className="trust-banner" role="note">
            <strong>{t('photoTrustTitle')}</strong>
            <p>{t('photoTrustBody')}</p>
          </div>

          <h2>{t('photoSectionTitle')}</h2>
          <p className="muted">{t('photoSectionBody')}</p>

          <label className="ai-toggle">
            <input type="checkbox" checked={aiOn} onChange={(e) => toggleAi(e.target.checked)} />
            <span>
              <strong>
                <Sparkles size={16} aria-hidden /> {t('aiToggleTitle')}
              </strong>
              <span className="muted">{t('aiToggleBody')}</span>
            </span>
          </label>

          <div className="photo-slots">
            <PhotoSlot
              title={t('photoPrintTitle')}
              icon={<Footprints size={20} />}
              hint={t('photoPrintHint')}
              busy={busy === 'top'}
              preview={topResult?.previewDataUrl || photoPreview}
              resultLabel={topLabel}
              analysingLabel={t('analysing')}
              addLabel={t('addPhoto')}
              replaceLabel={t('tapReplace')}
              inputRef={topRef}
              onFile={(f) => void runTop(f)}
              issues={printIssues}
              notes={aiBusy === 'top' ? [t('aiChecking')] : printNotes}
            />
            <PhotoSlot
              title={t('photoSizeTitle')}
              icon={<Ruler size={20} />}
              hint={t('photoSizeHint')}
              busy={busy === 'size'}
              preview={sizePreview}
              resultLabel={sizeLabel}
              analysingLabel={t('analysing')}
              addLabel={t('addPhoto')}
              replaceLabel={t('tapReplace')}
              inputRef={sizeRef}
              onFile={(f) => void runSize(f)}
              issues={sizeIssues}
              notes={aiBusy === 'size' ? [t('aiChecking')] : sizeNotes}
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
              icon={<Footprints size={20} />}
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

          <div className="tip-box tip-box-strong">
            <Lightbulb size={18} />
            <div>
              <strong>{t('photoTips')}</strong>
              <p className="tip-lead">{t('photoTipsLead')}</p>
              <ul>
                <li>{t('photoTip1')}</li>
                <li>{t('photoTip2')}</li>
                <li>{t('photoTip3')}</li>
                <li>{t('photoTip4')}</li>
                <li>{t('photoTip5')}</li>
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

          <div className="confirm-callout">
            <p className="confirm-callout-title">{t('confirmAdjustTitle')}</p>
            <p className="muted">
              {analysis
                ? t('confirmWithPhoto', {
                    arch: archWord(analysis.arch),
                    confidence: Math.round(analysis.archConfidence * 100),
                    mode: analysis.mode,
                  })
                : t('confirmNoPhoto')}
            </p>
            <p className="confirm-callout-cta">{t('confirmAdjustBody')}</p>
          </div>

          {measure && (
            <div className="tip-box measured-size">
              <Ruler size={18} />
              <div>
                <strong>{t('measuredSizeTitle')}</strong>
                <p>
                  {t('measuredSizeBody', {
                    length: measure.lengthMm,
                    width: measure.widthMm,
                    widthClass: widthWord(measure.widthClass),
                    eu: measure.size.eu,
                    uk: measure.size.ukMen,
                    us: measure.size.usMen,
                    usw: measure.size.usWomen,
                  })}
                </p>
              </div>
            </div>
          )}

          {(analysis?.previewDataUrl || photoPreview || sizePreview || sidePreview || wearPreview) && (
            <div className="preview-mosaic">
              {(analysis?.previewDataUrl || photoPreview) && (
                <img
                  src={analysis?.previewDataUrl || photoPreview || ''}
                  alt=""
                  className="preview-img"
                />
              )}
              {sizePreview && <img src={sizePreview} alt="" className="preview-img" />}
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
  issues = [],
  notes = [],
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
  /** Retake advice from the scanner / AI check */
  issues?: string[]
  /** Extra info such as the AI second opinion */
  notes?: string[]
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
          onChange={(e) => {
            onFile(e.target.files?.[0])
            // Let the same file be picked again after a retake
            e.target.value = ''
          }}
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
      {issues.length > 0 && (
        <ul className="scan-issues" role="alert">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
      {notes.length > 0 && (
        <ul className="scan-notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
