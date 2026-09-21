import Link from "next/link";
import type { TrainingModule } from "@/data/training";

export default function TrainingModuleIntro({
  module,
  launchHref,
  launchLabel,
}: {
  module: TrainingModule;
  launchHref?: string;
  launchLabel?: string;
}) {
  return (
    <div className="page-stack narrow-stack module-page-v6">
      <Link className="back-link back-link-v6" href="/training">← Training library</Link>

      <section className={`module-intro module-intro-v2 module-intro-v6 ${module.id === "working-at-height" ? "height-module" : "hazard-module"}`}>
        <div className="module-intro-copy module-intro-copy-v6">
          <div className="module-title-row module-title-row-v6">
            <span className="pill available">Live module</span>
            <span className="module-number-label">Module {module.number}</span>
          </div>
          <div className="module-hero-accent-v6"><span>{module.accent}</span><small>{module.category}</small></div>
          <h1>{module.shortTitle}</h1>
          <p>{module.objectiveSummary}</p>

          <div className="module-details-grid module-details-grid-v2 module-details-grid-v6">
            <div><span>Estimated time</span><strong>{module.duration}</strong></div>
            <div><span>Difficulty</span><strong>{module.difficulty}</strong></div>
            {module.metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
          </div>
        </div>

        <div className="module-objectives module-objectives-v2 module-objectives-v6">
          <div><div className="eyebrow">Learning flow</div><h2>{module.modeLabel}</h2><p className="module-objective-intro">Complete the scenario, review the safety feedback and reinforce the learning through a short knowledge check.</p></div>
          <ul className="check-list check-list-v6">{module.objectives.map((objective) => <li key={objective}><span>✓</span>{objective}</li>)}</ul>
          {launchHref ? <Link className="primary-button full-button module-launch-button-v6" href={launchHref}>{launchLabel ?? "Launch training →"}</Link> : null}
        </div>
      </section>
    </div>
  );
}
