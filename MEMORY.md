# Persistent Memory - FPT Study Hub & EduNext Assistant

## Active Version: v10.2.1

### Key Milestones & Architecture:
1. **Auto-Vision 5s Frame Loop & Screen Share Guard (v10.2.1):**
   - Screen sharing (`navigator.mediaDevices.getDisplayMedia`) is prominently prompted with a high-visibility alert banner if not yet granted.
   - Takes screenshots every 4.5s – 5s via `capturePersistentVisionFrame()`.
   - Sends the frame to Google Gemini 2.5 Flash Vision via the secure Cloud AI endpoint (`/api/v1/ai/solve`) using encrypted keys.
2. **Encrypted Gemini Key & Anti-Bypass License:**
   - Raw Gemini API Keys are strictly kept on the server or encrypted (`ENC_AES_...` / `ENC_FPT_...`).
   - Users cannot inspect F12 to steal the Gemini key and cannot paste their own un-licensed keys to bypass payment.
   - Only validated license keys (`TRIAL-...`, `VIP-...`) are authorized to solve exercises.
3. **Anti-Sẵn Sàng Firewall:**
   - Blocks returning `"Sẵn sàng"` whenever the question contains academic exercise keywords.
   - Fallback domain heuristic solver handles $Z$ isotope matching, neutron calculations, and electron configurations.
4. **DOM Auto-Typing & Single Submit Lock:**
   - Injects answers into textarea via React property descriptors.
   - Triggers Radial Menu $\rightarrow$ tracks `[data-intent="SUBMIT_ANSWER"]` / `Nộp câu trả lời` $\rightarrow$ atomic click.
   - Single submit lock with 6s - 8s interval prevents 429 gateway rate limits.
5. **Deployment:**
   - Vercel production: `https://fpt-studyhub.vercel.app`.
   - Turbopack Next.js 16 build running for v10.2.1.
