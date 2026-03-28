import React from "react";
import { useAppStore } from "../../store/useAppStore";
import type { Role } from "../../api/cache";
import styles from "./DevOverlay.module.scss";
import type { DataStrategy } from "../../store/useAppStore";

export const DevOverlay: React.FC = () => {
  const currentRole = useAppStore((state) => state.activeRole);
  const isSyncing = useAppStore((state) => state.isSyncing);
  const setRole = useAppStore((state) => state.setRole);
  const dataStrategy = useAppStore((state) => state.dataStrategy);
  const setDataStrategy = useAppStore((state) => state.setDataStrategy);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as Role);
  };

  const handleReset = () => {
    if (window.confirm("Wipe local data and reset to factory defaults?")) {
      localStorage.removeItem("RESOLVE_DEMO_DB");
      window.location.reload(); // Hard reload to re-seed
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.tag}>DEV MODE</div>
      <div className={styles.content}>
        <label htmlFor="role-switcher">Simulate Role:</label>
        <select
          id="role-switcher"
          value={currentRole}
          onChange={handleRoleChange}
        >
          <option value="Admin">Admin</option>
          <option value="Editor">Editor</option>
          <option value="Viewer">Viewer</option>
        </select>

        <label htmlFor="strategy-switcher">Provider:</label>
        <select
          id="strategy-switcher"
          value={dataStrategy}
          onChange={(e) => setDataStrategy(e.target.value as DataStrategy)}
        >
          <option value="APOLLO">Apollo (GQL)</option>
          <option value="TANSTACK">TanStack (REST)</option>
        </select>

        <button onClick={handleReset} className={styles.resetBtn}>
          Reset DB
        </button>
        <span
          className={`${styles.statusDot} ${isSyncing ? styles.isSyncing : ""}`}
        />
      </div>
    </div>
  );
};
