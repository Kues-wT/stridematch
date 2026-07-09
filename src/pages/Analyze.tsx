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

const STEPS = ['Photos', 'Confirm', 'Goals', 'Results']

export function Analyze() {
  const navigate = useNavigate()
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

  const runTop = async (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, or WebP).')
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
      setError('Could not analyse that top-down photo. Try better lighting.')
    } finally {
      setBusy(null)
    }
  }

  const runSide = async (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, or WebP).')
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
      setError('Could not analyse that side photo. Keep the full foot in frame.')
    } finally {
      setBusy(null)
    }
  }

  const runWear = async (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, or WebP).')
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
      setError('Could not analyse the wear photo. You can set pronation manually.')
    } finally {
      setBusy(null)
    }
  }

  const applyFootResult = (result: FootAnalysisResult) => {
    setAnalysis(result)
    setProfile({
      arch: result.arch,
      archSource: 'photo',
      widthHint: result.widthHint === 'standard' && profile.widthHint ? profile.widthHint : result.widthHint,
      photoAnalysis: result,
    })
  }

  const continueFromPhotos = () => {
    if (!analysis && !profile.arch) {
      // allow manual path
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
      setError('Pick an arch type to continue.')
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
        setError('Please answer every question to get recommendations.')
        return
      }
    }
    if (!profile.archSource) {
      setProfile({ archSource: analysis ? 'photo' : 'manual' })
    }
    setError(null)
    navigate('/results')
  }

  return (
    <div className="page narrow">
      <header className="page-header">
        <p className="eyebrow">Foot analysis</p>
        <h1>Let&apos;s match your shoes</h1>
        <StepIndicator steps={STEPS} current={step} />
      </header>

      {step === 0 && (
        <section className="panel">
          <h2>Photo analysis (optional extras unlock better confidence)</h2>
          <p className="muted">
            All processing stays on this device. Add one photo or stack top-down + side + old-shoe
            wear for a stronger estimate.
          </p>

          <div className="photo-slots">
            <PhotoSlot
              title="1. Top-down foot"
              icon={<Footprints size={20} />}
              hint="Bare foot on contrasting floor, camera straight above."
              busy={busy === 'top'}
              preview={topResult?.previewDataUrl || photoPreview}
              resultLabel={topResult ? `${topResult.arch} arch · ${topResult.widthHint} width` : null}
              inputRef={topRef}
              onFile={(f) => void runTop(f)}
            />
            <PhotoSlot
              title="2. Side view (optional)"
              icon={<PersonStanding size={20} />}
              hint="Inside of the foot, phone level with ankle, full sole on floor."
              busy={busy === 'side'}
              preview={sideResult?.previewDataUrl || sidePreview}
              resultLabel={
                sideResult
                  ? `${sideResult.arch} arch · clearance ${Math.round((sideResult.sideArchRatio ?? 0) * 100)}%`
                  : null
              }
              inputRef={sideRef}
              onFile={(f) => void runSide(f)}
            />
            <PhotoSlot
              title="3. Old shoe outsole wear (optional)"
              icon={<SportShoe size={20} />}
              hint="Photo of the worn outsole, heel at the bottom of the frame."
              busy={busy === 'wear'}
              preview={wearResult?.previewDataUrl || wearPreview}
              resultLabel={
                wearResult
                  ? `${wearResult.pronationHint} wear cue · ${Math.round(wearResult.confidence * 100)}% conf.`
                  : null
              }
              inputRef={wearRef}
              onFile={(f) => void runWear(f)}
            />
          </div>

          <div className="tip-box">
            <Lightbulb size={18} />
            <div>
              <strong>Photo tips</strong>
              <ul>
                <li>Even lighting, no heavy shadows under the arch</li>
                <li>One foot fully in frame; remove socks for arch photos</li>
                <li>Wear photo: clean-ish outsole, both medial & lateral edges visible</li>
              </ul>
            </div>
          </div>

          <div className="row-actions">
            <button type="button" className="btn btn-secondary" onClick={skipPhotos}>
              Skip photos — set manually
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={continueFromPhotos}
              disabled={!!busy}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
      )}

      {step === 1 && (
        <section className="panel">
          <h2>Confirm arch, width & gait cues</h2>
          <p className="muted">
            {analysis
              ? `Estimate: ${analysis.arch} arch (~${Math.round(analysis.archConfidence * 100)}% confidence, ${analysis.mode}). Adjust if it feels wrong.`
              : 'No photo used — pick the descriptions that match you best.'}
          </p>

          {(analysis?.previewDataUrl || photoPreview || sidePreview || wearPreview) && (
            <div className="preview-mosaic">
              {(analysis?.previewDataUrl || photoPreview) && (
                <img
                  src={analysis?.previewDataUrl || photoPreview || ''}
                  alt="Top-down or combined preview"
                  className="preview-img"
                />
              )}
              {(sideResult?.previewDataUrl || sidePreview) && (
                <img
                  src={sideResult?.previewDataUrl || sidePreview || ''}
                  alt="Side-view preview"
                  className="preview-img"
                />
              )}
              {(wearResult?.previewDataUrl || wearPreview) && (
                <img
                  src={wearResult?.previewDataUrl || wearPreview || ''}
                  alt="Wear analysis preview"
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

          <h3 className="field-label">Arch type</h3>
          <div className="option-grid">
            {(
              [
                {
                  id: 'low' as ArchType,
                  title: 'Low arch / flat',
                  description: 'Most of the midfoot touches the ground; footprints look filled in.',
                },
                {
                  id: 'normal' as ArchType,
                  title: 'Normal arch',
                  description: 'A moderate curve; classic half-filled footprint.',
                },
                {
                  id: 'high' as ArchType,
                  title: 'High arch',
                  description: 'Clear gap under the midfoot; footprint is mostly heel + ball.',
                },
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

          <h3 className="field-label">Width</h3>
          <div className="option-grid three">
            {(
              [
                { id: 'narrow' as const, title: 'Narrow' },
                { id: 'standard' as const, title: 'Standard width' },
                { id: 'wide' as const, title: 'Wide' },
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
              Wear photo suggests <strong>{wearResult.pronationHint}</strong> tendency — you can
              still change this in the next step.
            </p>
          )}

          <div className="row-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(0)}>
              <RefreshCw size={16} /> Back to photos
            </button>
            <button type="button" className="btn btn-primary" onClick={goQuiz}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
      )}

      {step === 2 && (
        <section className="panel">
          <h2>Gait & running goals</h2>
          <p className="muted">Answer based on how you usually run — there are no wrong picks.</p>

          <Field label="When you run, your foot tends to…">
            <div className="option-grid">
              <OptionCard
                selected={profile.pronation === 'over'}
                title="Roll inward (overpronate)"
                description={
                  wearResult?.pronationHint === 'over'
                    ? 'Suggested by your wear photo · shoes wear on the inner edge'
                    : 'Shoes wear on the inner edge; ankles feel like they collapse in.'
                }
                onClick={() => setProfile({ pronation: 'over' })}
              />
              <OptionCard
                selected={profile.pronation === 'neutral'}
                title="Stay fairly centered"
                description="Even wear under the shoe; comfortable in neutral trainers."
                onClick={() => setProfile({ pronation: 'neutral' })}
              />
              <OptionCard
                selected={profile.pronation === 'under'}
                title="Roll outward (underpronate)"
                description={
                  wearResult?.pronationHint === 'under'
                    ? 'Suggested by your wear photo · outer-edge wear'
                    : 'Outer-edge wear; you may prefer cushioned neutrals.'
                }
                onClick={() => setProfile({ pronation: 'under' })}
              />
            </div>
          </Field>

          <Field label="Experience level">
            <div className="option-grid three">
              <OptionCard
                selected={profile.experience === 'beginner'}
                title="Beginner"
                onClick={() => setProfile({ experience: 'beginner' })}
              />
              <OptionCard
                selected={profile.experience === 'intermediate'}
                title="Intermediate"
                onClick={() => setProfile({ experience: 'intermediate' })}
              />
              <OptionCard
                selected={profile.experience === 'advanced'}
                title="Advanced"
                onClick={() => setProfile({ experience: 'advanced' })}
              />
            </div>
          </Field>

          <Field label="Weekly running volume">
            <div className="option-grid three">
              <OptionCard
                selected={profile.weeklyDistance === 'short'}
                title="Under 15 km"
                description="Short runs & walk-run"
                onClick={() => setProfile({ weeklyDistance: 'short' })}
              />
              <OptionCard
                selected={profile.weeklyDistance === 'moderate'}
                title="15–40 km"
                description="Regular training"
                onClick={() => setProfile({ weeklyDistance: 'moderate' })}
              />
              <OptionCard
                selected={profile.weeklyDistance === 'long'}
                title="40+ km"
                description="High mileage"
                onClick={() => setProfile({ weeklyDistance: 'long' })}
              />
            </div>
          </Field>

          <Field label="Primary surface">
            <div className="option-grid">
              <OptionCard
                selected={profile.surface === 'road'}
                title="Road / pavement"
                onClick={() => setProfile({ surface: 'road' })}
              />
              <OptionCard
                selected={profile.surface === 'trail'}
                title="Trail"
                onClick={() => setProfile({ surface: 'trail' })}
              />
              <OptionCard
                selected={profile.surface === 'mixed'}
                title="Mixed"
                onClick={() => setProfile({ surface: 'mixed' })}
              />
              <OptionCard
                selected={profile.surface === 'track'}
                title="Track / speedwork"
                onClick={() => setProfile({ surface: 'track' })}
              />
            </div>
          </Field>

          <Field label="Cushion feel you prefer">
            <div className="option-grid three">
              <OptionCard
                selected={profile.cushion === 'firm'}
                title="Firm / ground feel"
                onClick={() => setProfile({ cushion: 'firm' })}
              />
              <OptionCard
                selected={profile.cushion === 'balanced'}
                title="Balanced"
                onClick={() => setProfile({ cushion: 'balanced' })}
              />
              <OptionCard
                selected={profile.cushion === 'max'}
                title="Max plush"
                onClick={() => setProfile({ cushion: 'max' })}
              />
            </div>
          </Field>

          <Field label="Budget (MYR)">
            <div className="option-grid">
              <OptionCard
                selected={profile.budget === 'budget'}
                title="Under RM 350"
                description="Value picks"
                onClick={() => setProfile({ budget: 'budget' })}
              />
              <OptionCard
                selected={profile.budget === 'mid'}
                title="RM 350–650"
                description="Most daily trainers"
                onClick={() => setProfile({ budget: 'mid' })}
              />
              <OptionCard
                selected={profile.budget === 'premium'}
                title="RM 650+"
                description="Premium foams & race shoes"
                onClick={() => setProfile({ budget: 'premium' })}
              />
              <OptionCard
                selected={profile.budget === 'any'}
                title="Any budget"
                onClick={() => setProfile({ budget: 'any' })}
              />
            </div>
          </Field>

          <div className="row-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={finishQuiz}>
              <Camera size={16} /> See my matches
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
  inputRef,
  onFile,
}: {
  title: string
  icon: ReactNode
  hint: string
  busy: boolean
  preview: string | null
  resultLabel: string | null
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
            <p>Analysing…</p>
          </>
        ) : preview ? (
          <>
            <img src={preview} alt="" className="slot-thumb" />
            <p>{resultLabel ?? 'Tap to replace'}</p>
          </>
        ) : (
          <>
            <ImagePlus size={28} />
            <p>
              <strong>Add photo</strong>
            </p>
          </>
        )}
      </button>
    </div>
  )
}
