import React from "react";
import { activeRoleVar } from "../../api/cache";
import type { Role } from "../../api/cache";
import { useReactiveVar } from "@apollo/client";
import { isSyncingVar } from "../../api/cache";
import styles from "./DevOverlay.module.scss";

export const DevOverlay: React.FC = () => {
  const currentRole = useReactiveVar(activeRoleVar);
  const isSyncing = useReactiveVar(isSyncingVar);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    activeRoleVar(e.target.value as Role);
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

        <button onClick={handleReset} className={styles.resetBtn}>
          Reset DB
        </button>
        <span className={`${styles.statusDot} ${isSyncing ? styles.isSyncing : ""}`} />
      </div>
    </div>
  );
};
