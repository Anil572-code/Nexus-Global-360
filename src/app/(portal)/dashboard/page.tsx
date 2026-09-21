import OverviewJourney from "@/components/OverviewJourney";
import styles from "./DashboardOverview.module.css";

export default function DashboardPage() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Overview</h1>
          <p>Learning status, recorded performance and next action.</p>
        </div>
      </header>

      <OverviewJourney />
    </main>
  );
}
