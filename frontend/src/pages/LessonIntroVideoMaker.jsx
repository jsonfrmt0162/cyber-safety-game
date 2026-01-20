import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * LessonIntroVideoMaker
 * - Renders a canvas "lesson video" using LESSON_INTRO[topicId]
 * - Records narration via microphone
 * - Exports a single WebM video that includes the narration audio
 *
 * Usage:
 * <LessonIntroVideoMaker topicId={numericGameId} lessonIntro={LESSON_INTRO} />
 */
export default function LessonIntroVideoMaker({
  topicId,
  lessonIntro,
  width = 720,
  height = 1280,
}) {
  const data = lessonIntro?.[topicId];
  const lines = useMemo(() => {
    if (!data) return [];
    return [data.title, ...data.text, `Quick Tip: ${data.quickTip}`];
  }, [data]);

  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoBlob, setVideoBlob] = useState(null);

  // mic recorder
  const mediaRecRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioChunksRef = useRef([]);

  // helper: draw nice slide
  const drawSlide = (ctx, slideText, slideIndex, totalSlides, progress01) => {
    // background gradient
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#071523");
    g.addColorStop(1, "#050a12");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // soft glow blobs
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.ellipse(width * 0.75, height * 0.22, 220, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#62aeda";
    ctx.beginPath();
    ctx.ellipse(width * 0.25, height * 0.35, 260, 210, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // card
    const pad = 40;
    const cardW = width - pad * 2;
    const cardH = height * 0.58;
    const cardX = pad;
    const cardY = height * 0.22;

    roundRect(ctx, cardX, cardY, cardW, cardH, 26);
    ctx.fillStyle = "rgba(2,6,23,0.62)";
    ctx.fill();

    ctx.strokeStyle = "rgba(148,163,184,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // header
    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = `900 ${Math.round(width * 0.055)}px system-ui`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Topic ${topicId} Story Lesson`, cardX + 24, cardY + 22);

    // slide counter
    ctx.textAlign = "right";
    ctx.font = `800 ${Math.round(width * 0.035)}px system-ui`;
    ctx.fillStyle = "rgba(226,232,240,0.85)";
    ctx.fillText(
      `${slideIndex + 1} / ${totalSlides}`,
      cardX + cardW - 24,
      cardY + 28
    );

    // body text (wrap)
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(226,232,240,0.92)";
    ctx.font = `800 ${Math.round(width * 0.045)}px system-ui`;
    const textX = cardX + 24;
    const textY = cardY + 92;
    const maxW = cardW - 48;
    wrapText(ctx, slideText, textX, textY, maxW, Math.round(width * 0.06));

    // progress bar bottom
    const barX = cardX + 24;
    const barY = cardY + cardH - 34;
    const barW = cardW - 48;
    const barH = 12;

    roundRect(ctx, barX, barY, barW, barH, 999);
    ctx.fillStyle = "rgba(148,163,184,0.18)";
    ctx.fill();

    roundRect(ctx, barX, barY, barW * progress01, barH, 999);
    ctx.fillStyle = "rgba(34,197,94,0.9)";
    ctx.fill();

    // footer hint
    ctx.fillStyle = "rgba(226,232,240,0.85)";
    ctx.font = `700 ${Math.round(width * 0.032)}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(
      "🎙️ Recorded narration will be merged into this video",
      width / 2,
      height - 64
    );
  };

  // start mic recording
  const startAudioRecording = async () => {
    setVideoUrl("");
    setVideoBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecRef.current = rec;
      audioChunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // get duration
        const d = await getMediaDuration(url);
        setAudioDuration(d);

        // stop mic tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      rec.start();
      setRecording(true);
    } catch (err) {
      alert("Mic permission denied or no mic found.");
      console.error(err);
    }
  };

  const stopAudioRecording = () => {
    if (!mediaRecRef.current) return;
    mediaRecRef.current.stop();
    setRecording(false);
  };

  // generate combined video (canvas + recorded audio)
  const generateVideo = async () => {
    if (!lines.length) return alert("No lesson text found for this topic.");
    if (!audioBlob || !audioUrl) return alert("Record narration first.");

    setGenerating(true);
    setVideoUrl("");
    setVideoBlob(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // video stream from canvas
    const videoStream = canvas.captureStream(60);

    // build audio track using AudioContext so MediaRecorder captures it
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();

    const audioEl = new Audio(audioUrl);
    audioEl.crossOrigin = "anonymous";

    const src = audioCtx.createMediaElementSource(audioEl);
    src.connect(dest);
    src.connect(audioCtx.destination); // so you can hear while generating (optional)

    // combine into 1 stream
    const combined = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    const mime = pickSupportedMime([
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ]);

    const recorder = new MediaRecorder(combined, { mimeType: mime });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const out = new Blob(chunks, { type: mime });
      setVideoBlob(out);
      setVideoUrl(URL.createObjectURL(out));
      setGenerating(false);

      // cleanup
      try {
        audioCtx.close();
      } catch {}
    };

    // slide timing: divide audio duration across slides
    const total = Math.max(audioDuration || 1, 1);
    const slideCount = lines.length;
    const perSlide = total / slideCount;

    let startTs = null;

    const render = (ts) => {
      if (!startTs) startTs = ts;
      const t = (ts - startTs) / 1000;

      // which slide
      const idx = Math.min(slideCount - 1, Math.floor(t / perSlide));
      const slideT = t - idx * perSlide;
      const progress01 = Math.min(1, Math.max(0, slideT / perSlide));

      drawSlide(ctx, lines[idx], idx, slideCount, progress01);

      if (t < total) {
        rafRef.current = requestAnimationFrame(render);
      }
    };

    // start
    recorder.start(250);

    // play audio (must resume audio context on user gesture - we're inside click)
    await audioCtx.resume();
    await audioEl.play();

    rafRef.current = requestAnimationFrame(render);

    // stop when audio ends
    audioEl.onended = () => {
      cancelAnimationFrame(rafRef.current);
      recorder.stop();
    };
  };

  const downloadVideo = () => {
    if (!videoBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(videoBlob);
    a.download = `topic-${topicId}-lesson.webm`;
    a.click();
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!data) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.title}>🎬 Lesson Intro Video Maker</div>
          <div style={styles.sub}>
            Topic {topicId}: <b>{data.title}</b>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left: Script */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Script (auto from LESSON_INTRO)</div>
          <ol style={styles.list}>
            {lines.map((l, i) => (
              <li key={i} style={styles.li}>
                {l}
              </li>
            ))}
          </ol>

          <div style={styles.actions}>
            {!recording ? (
              <button style={styles.btnPrimary} onClick={startAudioRecording}>
                🎙️ Start recording narration
              </button>
            ) : (
              <button style={styles.btnDanger} onClick={stopAudioRecording}>
                ⏹ Stop recording
              </button>
            )}

            <button
              style={{
                ...styles.btnPrimary,
                opacity: audioBlob && !generating ? 1 : 0.55,
                pointerEvents: audioBlob && !generating ? "auto" : "none",
              }}
              onClick={generateVideo}
            >
              {generating ? "Generating..." : "✨ Generate video"}
            </button>
          </div>

          {audioUrl && (
            <div style={styles.previewBox}>
              <div style={styles.smallLabel}>Narration preview</div>
              <audio controls src={audioUrl} style={{ width: "100%" }} />
              <div style={styles.smallNote}>
                Duration: {audioDuration ? audioDuration.toFixed(1) : "—"}s
              </div>
            </div>
          )}

          {videoUrl && (
            <div style={styles.previewBox}>
              <div style={styles.smallLabel}>Video preview</div>
              <video controls src={videoUrl} style={{ width: "100%", borderRadius: 12 }} />
              <div style={styles.actions}>
                <button style={styles.btnPrimary} onClick={downloadVideo}>
                  ⬇️ Download video
                </button>
              </div>
              <div style={styles.smallNote}>
                Save it to your project (example: <code>public/videos/topic-{topicId}.webm</code>) and
                show it in Story Lesson tab.
              </div>
            </div>
          )}
        </div>

        {/* Right: Canvas preview */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Live Canvas Preview</div>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 18,
              border: "1px solid rgba(148,163,184,0.22)",
              background: "rgba(2,6,23,0.55)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.35)",
            }}
          />
          <div style={styles.smallNote}>
            Tip: record narration while reading the script above.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  let yy = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, yy);
      line = words[n] + " ";
      yy += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, yy);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function pickSupportedMime(candidates) {
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

function getMediaDuration(url) {
  return new Promise((resolve) => {
    const a = document.createElement("audio");
    a.preload = "metadata";
    a.src = url;
    a.onloadedmetadata = () => resolve(a.duration || 0);
    a.onerror = () => resolve(0);
  });
}

const styles = {
  wrapper: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,6,23,0.45)",
  },
  headerRow: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  title: { fontWeight: 900, fontSize: 18, color: "#e2e8f0" },
  sub: { opacity: 0.85, marginTop: 4, color: "#cbd5e1" },
  grid: { display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 },
  card: {
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.16)",
    background: "rgba(2,6,23,0.35)",
    padding: 12,
  },
  cardTitle: { fontWeight: 900, marginBottom: 8, color: "#e2e8f0" },
  list: { margin: 0, paddingLeft: 18, color: "#e2e8f0" },
  li: { marginBottom: 8, opacity: 0.95, lineHeight: 1.45 },
  actions: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 },
  btnPrimary: {
    border: "none",
    borderRadius: 999,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 900,
    color: "#04111c",
    background: "linear-gradient(135deg, #62aeda, #22c55e)",
  },
  btnDanger: {
    border: "none",
    borderRadius: 999,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 900,
    color: "#0b1020",
    background: "linear-gradient(135deg, #fb7185, #f59e0b)",
  },
  previewBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.16)",
    background: "rgba(2,6,23,0.25)",
  },
  smallLabel: { fontWeight: 900, marginBottom: 8, color: "#e2e8f0" },
  smallNote: { opacity: 0.85, marginTop: 8, color: "#cbd5e1", fontSize: 12 },
};

