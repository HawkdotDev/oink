# Oink Codebase Deep Analysis, Audit & Optimization Roadmap

This document provides a comprehensive technical audit of the **Oink** desktop application codebase, covering architecture, performance bottlenecks, memory management, security boundaries, and the verified implementation status.

## 1. Critical Performance & Runtime Bottlenecks

### A. Re-render & Redundant Disk Read Loop on File Modifications

- **Status:** **RESOLVED**
- **File & Lines:** [`src/renderer/src/App.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/App.tsx)
- **Resolution:**
  Refactored `loadFileContent` to leverage a synchronized `fileContentsRef` and functional state updates (`setFileContents(prev => ...)`). Removed `fileContents` from the callback's dependency array and optimized the open files re-hydration effect to only load missing entries.

### B. Synchronous Main Thread Freezing during Graph Data Generation

- **Status:** **RESOLVED**
- **File & Lines:** [`src/main/index.ts`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/main/index.ts)
- **Resolution:**
  Converted `getMarkdownFilesAsync` and `fs:getGraphData` to fully asynchronous operations using `fs.promises.readdir` and parallel `fs.promises.readFile`. Implemented an in-memory `Map<string, string>` (lowercase note title $\rightarrow$ node ID) for $O(1)$ link resolution.

### C. Unbounded $O(N^2)$ Canvas Simulation Loop

- **Status:** **RESOLVED**
- **File & Lines:** [`src/renderer/src/components/GraphView.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/GraphView.tsx)
- **Resolution:**
  Integrated kinetic energy calculation ($\sum (v_x^2 + v_y^2)$). When energy drops below the sleep threshold ($\epsilon = 0.005$) and no interaction is active, the animation loop automatically pauses, dropping idle CPU usage to 0%. Dynamic wake triggers re-activate physics on user interactions.

### D. Missing High-DPI (Retina) Canvas Scaling

- **Status:** **RESOLVED**
- **File & Lines:** [`src/renderer/src/components/GraphView.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/GraphView.tsx)
- **Resolution:**
  Canvas dimensions are dynamically scaled by `window.devicePixelRatio` with 2D context scaling (`ctx.scale(dpr, dpr)`), ensuring ultra-crisp node rendering and typography on 4K, Retina, and scaled Windows displays.

## 2. Architecture, State Management & Dead Code

### A. Monolithic `App.tsx` Component

- **Status:** **RESOLVED**
- **File:** [`src/renderer/src/App.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/App.tsx)
- **Resolution:**
  Modularized responsibilities using dedicated hooks (`useWidgetManager`, `useIndexerWorker`, `useSidebarResize`, `usePersistentState`), clean prop interfaces, and isolated components.

### B. Duplicate Heading Extraction in Outline Widget

- **Status:** **RESOLVED**
- **File:** [`src/renderer/src/components/layout/OutlineWidget.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/layout/OutlineWidget.tsx)
- **Resolution:**
  `OutlineWidget` directly consumes worker-parsed `headings` from `useIndexerWorker`, offloading markdown splitting from the main UI thread.

### C. Dead Code & Unused Dependencies

- **Status:** **RESOLVED**
- **Resolution:**
  Removed unused packages (`@monaco-editor/react`), cleaned orphaned components, and ensured all active components are linked and bundled properly.

## 3. Storage, File I/O & Media Handling

### A. Base64 DataURL Image Inlining

- **Status:** **RESOLVED**
- **File & Lines:** [`src/renderer/src/components/BlockEditor.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/BlockEditor.tsx) & [`src/main/index.ts`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/main/index.ts)
- **Resolution:**
  Implemented `fs:saveAttachment` IPC handler. Dropped or pasted media is saved directly to `<workspace>/assets/` with relative markdown image paths (`![image](assets/...)`).

### B. Deprecated DOM APIs in Block Editor

- **Status:** **RESOLVED**
- **File & Lines:** [`src/renderer/src/components/BlockEditor.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/BlockEditor.tsx)
- **Resolution:**
  Replaced deprecated `document.execCommand('insertLineBreak')` with standard Selection/Range DOM element insertions, and replaced `document.caretRangeFromPoint` with modern `document.caretPositionFromPoint` with fallback.

## 4. Security & Electron Hardening

### A. Path Traversal Validation

- **Status:** **RESOLVED**
- **File & Lines:** [`src/main/index.ts`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/main/index.ts)
- **Resolution:**
  All filesystem IPC handlers execute through `validatePath()` to sanitize inputs, normalize directory separators, and prevent null-byte attacks.

### B. Window Control IPC Listener Deduplication

- **Status:** **RESOLVED**
- **File & Lines:** [`src/main/index.ts`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/main/index.ts)
- **Resolution:**
  Window control IPC handlers (`window:minimize`, `window:maximize`, `window:close`, `window:toggleFullScreen`, `window:isFullScreen`) are registered once inside `app.whenReady()` outside `createWindow()`.

---

## Action Matrix & Verification Summary

| Item    | Optimization                                        | Target File(s)                     | Status        | Benefit                                               |
| :------ | :-------------------------------------------------- | :--------------------------------- | :------------ | :---------------------------------------------------- |
| **1.A** | Fix re-render & disk read loop in `loadFileContent` | `App.tsx`                          | **Completed** | Zero redundant disk I/O on keystrokes                 |
| **1.B** | Async graph data generation & $O(1)$ lookup         | `src/main/index.ts`                | **Completed** | UI never freezes when opening Graph                   |
| **1.C** | Graph simulation energy cooling / sleep             | `GraphView.tsx`                    | **Completed** | 0% idle CPU usage on background graph                 |
| **1.D** | High-DPI canvas retina scaling                      | `GraphView.tsx`                    | **Completed** | Ultra-sharp text and nodes on all displays            |
| **2.A** | Modularized state architecture                      | `App.tsx`, `hooks/`                | **Completed** | Clean separation of concerns                          |
| **2.B** | Offload heading parsing to Web Worker               | `OutlineWidget.tsx`                | **Completed** | Smooth typing without main-thread parsing             |
| **2.C** | Dead code and unused dependency cleanup             | `package.json`, `components/`      | **Completed** | Clean bundle and project structure                    |
| **3.A** | Local workspace asset attachment saving             | `BlockEditor.tsx`, `main/index.ts` | **Completed** | Lightweight markdown files without base64 bloat       |
| **3.B** | Modern standard Selection/Range DOM APIs            | `BlockEditor.tsx`                  | **Completed** | Future-proof, standard compliant editor               |
| **4.A** | Path traversal & validation security                | `src/main/index.ts`                | **Completed** | Hardened Electron IPC boundaries                      |
| **4.B** | Window IPC listener deduplication                   | `src/main/index.ts`                | **Completed** | Clean singleton event registration                    |
| **5.A** | Interactive Quick Terminal engine                   | `QuickTerminalWidget.tsx`          | **Completed** | Built-in CLI commands (`help`, `stats`, `calc`, etc.) |
