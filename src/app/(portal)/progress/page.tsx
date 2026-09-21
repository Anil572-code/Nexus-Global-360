import ResetProgressButton from "@/components/ResetProgressButton";
import ProgressModuleTable from "@/components/ProgressModuleTable";
import ProgressSummary from "@/components/ProgressSummary";

export default function ProgressPage() {
  return (
    <div className="page-stack page-stack-v6">
      <section className="page-heading page-heading-v6">
        <div>
          <div className="eyebrow">Learning record</div>
          <h1>Progress and performance</h1>
          <p>Review completion, best scores, knowledge accuracy, attempts and best training times across both immersive modules.</p>
        </div>
        <ResetProgressButton />
      </section>

      <ProgressSummary />

      <section className="table-card table-card-v6">
        <div className="table-card-heading table-card-heading-v6"><div><span className="eyebrow">Module performance</span><strong>Training history</strong></div><span>Saved on this device</span></div>
        <ProgressModuleTable />
      </section>

      <section className="progress-foundation-note progress-foundation-note-v6">
        <div className="local-authority-icon">⌁</div>
        <div><strong>Demo progress</strong><span>Your scores, completion and achievements are saved in this browser so the training can be resumed during the demonstration.</span></div>
        <small>Local demo storage</small>
      </section>
    </div>
  );
}
