import { Link } from 'react-router-dom'
import { Camera, BrainCircuit, ListChecks, Shield, Footprints, SportShoe } from 'lucide-react'

export function HowItWorks() {
  return (
    <div className="page narrow">
      <header className="page-header">
        <p className="eyebrow">Transparent by design</p>
        <h1>How StrideMatch works</h1>
        <p className="lede">
          We combine multi-photo foot estimates with a short running profile quiz, then score real
          shoe models against what matters for fit and feel.
        </p>
      </header>

      <div className="info-stack">
        <section className="info-card">
          <Camera size={22} className="info-icon" />
          <div>
            <h2>Top-down photo</h2>
            <p>
              Wet-test style sampling of heel / midfoot / forefoot brightness and midfoot contact
              span estimates arch category and width. You can always override.
            </p>
          </div>
        </section>

        <section className="info-card">
          <Footprints size={22} className="info-icon" />
          <div>
            <h2>Side-view photo (optional)</h2>
            <p>
              Estimates midfoot clearance relative to foot height for a second arch signal. Combined
              with top-down when both are present for higher confidence.
            </p>
          </div>
        </section>

        <section className="info-card">
          <SportShoe size={22} className="info-icon" />
          <div>
            <h2>Old-shoe wear photo (optional)</h2>
            <p>
              Compares medial vs lateral outsole brightness/smoothness as a rough pronation cue
              (inner wear → overpronation tendency; outer wear → underpronation).
            </p>
          </div>
        </section>

        <section className="info-card">
          <ListChecks size={22} className="info-icon" />
          <div>
            <h2>Gait & goals quiz</h2>
            <p>
              Pronation, weekly distance, surface, experience, cushion feel, and MYR budget refine
              the match beyond foot shape alone.
            </p>
          </div>
        </section>

        <section className="info-card">
          <BrainCircuit size={22} className="info-icon" />
          <div>
            <h2>Recommendation scoring</h2>
            <p>Each real-world shoe model is scored with weighted factors:</p>
            <ul className="plain-list">
              <li>25% arch support fit</li>
              <li>25% stability vs pronation</li>
              <li>20% cushion + mileage</li>
              <li>15% surface</li>
              <li>10% budget</li>
              <li>5% experience / use case</li>
            </ul>
            <p>
              Catalog includes ASICS, Brooks, HOKA, Saucony, Nike, New Balance, adidas, Altra, On —
              with estimated MYR prices and research links.
            </p>
          </div>
        </section>

        <section className="info-card">
          <Shield size={22} className="info-icon" />
          <div>
            <h2>Privacy & safety</h2>
            <p>
              Photo pixels are processed locally with the Canvas API. Images are not uploaded or
              persisted. Recommendations are educational and do not replace a clinician or specialty
              running store assessment for pain or injury.
            </p>
          </div>
        </section>
      </div>

      <div className="page-actions">
        <Link to="/analyze" className="btn btn-primary btn-lg">
          Start analysis
        </Link>
      </div>
    </div>
  )
}
