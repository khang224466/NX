# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.18 & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("má»—i 1 láº§n up lÃªn lÃ  thay Ä‘á»•i tÃªn phiÃªn báº£n").
- Current live version: **v10.2.18** (Tá»‘i Æ°u Cáº§u Ná»‘i AI Bridge: Kháº¯c phá»¥c treo 32s do 503, ghi nhá»› model chiáº¿n tháº¯ng Flash-Lite, lá»c sáº¡ch Gemma/2.5 lá»—i, Timeout 7.5s).
- **Core Breakthroughs in v10.2.18 (Zero-Hang AI Bridge + Winner Model Caching)**:
  1. **Kháº¯c Phá»¥c Treo Ngháº½n Máº¡ng AI Bridge (Cháº¥m dá»©t lá»—i "Äang xá»­ lÃ½ cÃ¢u há»i trÆ°á»›c Ä‘Ã³, táº¡m hoÃ£n yÃªu cáº§u láº·p...")**:
     - PhÃ¢n tÃ­ch log thá»±c táº¿ tá»« ngÆ°á»i dÃ¹ng: Model `gemini-flash-latest` bá»‹ Google quÃ¡ táº£i (HTTP 503) vÃ  treo fetch tá»›i 32 giÃ¢y, cháº·n Ä‘á»©ng toÃ n bá»™ vÃ²ng láº·p cá»§a Bridge.
     - ThÃªm cÆ¡ cháº¿ ngáº¯t `AbortController` vá»›i thá»i gian chá» tá»‘i Ä‘a 7.5 giÃ¢y: Náº¿u má»™t model treo hoáº·c lá»—i 503, tá»± Ä‘á»™ng chuyá»ƒn ngay sang model tiáº¿p theo chá»‰ trong chá»›p máº¯t.
  2. **Ghi Nhá»› Model Chiáº¿n Tháº¯ng (Preferred Model Caching)**:
     - Log thá»±c táº¿ chá»©ng minh `gemini-flash-lite-latest` pháº£n há»“i siÃªu tá»‘c chá»‰ trong 2 giÃ¢y.
     - v10.2.18 bá»• sung cÆ¡ cháº¿ lÆ°u trá»¯ `preferredModel`: Ngay khi má»™t model tráº£ lá»i thÃ nh cÃ´ng, model Ä‘Ã³ Ä‘Æ°á»£c lÆ°u láº¡i vÃ  luÃ´n Ä‘Æ°á»£c gá»i trá»±c tiáº¿p Ä‘áº§u tiÃªn á»Ÿ má»i cÃ¢u há»i tiáº¿p theo, khÃ´ng pháº£i quÃ©t qua cÃ¡c model lá»—i ná»¯a.
  3. **Lá»c Bá» CÃ¡c Model GÃ¢y Lá»—i 404 & 500**:
     - Loáº¡i bá» cÃ¡c model `gemma` (khÃ´ng há»— trá»£ Vision, gÃ¢y HTTP 500) vÃ  `2.5` (gÃ¢y HTTP 404).
     - Æ¯u tiÃªn nhÃ³m model Flash Vision tá»‘c Ä‘á»™ cao: `gemini-flash-lite-latest`, `gemini-2.0-flash-lite`, `gemini-1.5-flash`.
  4. **Quy TrÃ¬nh Tá»± Äá»™ng KhÃ©p KÃ­n HoÃ n Thiá»‡n**:
     - Báº­t lÃªn tá»± Ä‘á»™ng gÃµ "Sáºµn sÃ ng" vÃ  báº¥m Ná»™p (track trÃºng nÃºt icon bÃºt chÃ¬ gÃ³c pháº£i).
     - Track cÃ¢u há»i bÃ i táº­p má»›i xuáº¥t hiá»‡n vÃ  giáº£i qua Gemini Vision.
     - Láº·p láº¡i liÃªn tá»¥c cho tá»›i khi bÃ¡o hoÃ n thÃ nh bÃ i há»c.

---

## FPT Study Hub â€” Ná»n Táº£ng Há»— Trá»£ Há»c Táº­p & Thi Cá»­ FPT (EduNext â€¢ Kháº£o ThÃ­ â€¢ SEB)
- **Directory**: `d:\BUISINESS\rental_platform\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons.
- **Port**: Development server running at `http://localhost:8443`.
- **Tráº¡ng ThÃ¡i Váº­n HÃ nh Hiá»‡n Táº¡i (Focus EduNext)**:
  1. **FPT EduNext AI Assistant Pro (v10.2.18)**: **ÄANG HOáº T Äá»˜NG CHÃNH THá»¨C**
     - Tráº£i Nghiá»‡m 2 Tiáº¿ng: **Miá»…n PhÃ­ (0â‚«)**.
     - 1 Tuáº§n: **30.000â‚«**.
     - 1 ThÃ¡ng: **69.000â‚«**.
     - 1 Ká»³ Há»c (4 ThÃ¡ng): **220.000â‚«** (GÃ³i khuyÃªn dÃ¹ng).

---

## Past Milestones
- **v10.2.18**: Smart winner model caching (`gemini-flash-lite-latest`), filtered Gemma/2.5 models, added 7.5s abort timeout, eliminating AI Bridge 32s hang.
- **v10.2.10**: Closed-loop automation (Write 'Sáºµn sÃ ng' -> Track submit button -> Solve next question -> Loop until complete), unblocked footer submit button tracker, draggable/collapsible HUD.
- **v10.2.9**: Purged hardcoded regex solvers and traps, fixed auto-submit button detection (Toolbar 'Ná»™p cÃ¢u tráº£ lá»i' + Enter dual-dispatch), auto-submits prefilled textarea text.
- **v10.2.8**: Vision-Only model filtering (eliminated TTS 400 error), Flash priority ordering, and Concurrency lock (eliminated 429 rate limit).
- **v10.2.7**: Auto ListModels Discovery, Cloud AI fallback on 404, and Auto-click Ready button.
- **v10.2.6**: Official Zero-Script Bookmarklet Edition with auto AI Bridge connection and Instant Local Science Solvers.
- **v10.2.5**: Dual-Engine AI Bridge popup for Bookmarklet mode, Tampermonkey native bypass, and Instant Local Science Solvers.
- **v10.2.4**: Added Tampermonkey GM_xmlhttpRequest bridge to window/unsafeWindow and release v10.2.4.
- **v10.2.3**: Support new Google AI Studio Auth Key format AQ... in converter and decrypt engine.
- **v10.2.2**: Direct Google Gemini Studio Vision via GM_xmlhttpRequest, Encrypted Key Engine (`ENC_AI_...`), mandatory screen share & 5s auto-capture, Anti-Sáºµn SÃ ng firewall, and radial submit button auto-click.
- **v10.2.1**: Encrypted key validation & trial guard improvements.
- **v10.2.0**: Added AI bridge & dual mode.


