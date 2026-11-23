import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Octahedral forged core vertices (normalized 3D coordinates)
const CORE_VERTICES = [
  [0, -1.32, 0],
  [0.86, -0.18, 0.5],
  [0.0, -0.18, 1.0],
  [-0.86, -0.18, 0.5],
  [-0.86, -0.18, -0.5],
  [0.0, -0.18, -1.0],
  [0.86, -0.18, -0.5],
  [0.58, 0.56, 0.34],
  [0.0, 0.56, 0.68],
  [-0.58, 0.56, 0.34],
  [-0.58, 0.56, -0.34],
  [0.0, 0.56, -0.68],
  [0.58, 0.56, -0.34],
  [0, 1.38, 0],
];

const CORE_FACES = [
  // Upper crown facets
  [0, 1, 2],
  [0, 2, 3],
  [0, 3, 4],
  [0, 4, 5],
  [0, 5, 6],
  [0, 6, 1],
  // Mid bevel bands
  [1, 7, 8, 2],
  [2, 8, 9, 3],
  [3, 9, 10, 4],
  [4, 10, 11, 5],
  [5, 11, 12, 6],
  [6, 12, 7, 1],
  // Lower tapered facets
  [13, 8, 7],
  [13, 9, 8],
  [13, 10, 9],
  [13, 11, 10],
  [13, 12, 11],
  [13, 7, 12],
];

const RING_SEGMENTS = 36;
const OUTER_RING = Array.from({ length: RING_SEGMENTS }, (_, i) => {
  const a = (i / RING_SEGMENTS) * Math.PI * 2;
  return [Math.cos(a) * 1.48, Math.sin(a) * 0.24, Math.sin(a) * 1.48];
});

const INNER_RING = Array.from({ length: RING_SEGMENTS }, (_, i) => {
  const a = (i / RING_SEGMENTS) * Math.PI * 2;
  return [Math.cos(a) * 1.18, Math.sin(a) * -0.48, Math.sin(a) * 1.18];
});

const EMBERS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const radius = 1.25 + (i % 3) * 0.22;
  const yOffset = ((i % 5) - 2) * 0.34;
  return { angle, radius, yOffset, speed: 0.25 + (i % 4) * 0.08, size: 1.2 + (i % 3) * 0.55 };
});

function rotatePoint(p, rx, ry, rz = 0) {
  let [x, y, z] = p;

  // Rotate Y
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  x = x1;
  z = z1;

  // Rotate X
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const y1 = y * cosX - z * sinX;
  const z2 = y * sinX + z * cosX;
  y = y1;
  z = z2;

  if (rz !== 0) {
    const cosZ = Math.cos(rz);
    const sinZ = Math.sin(rz);
    const x2 = x * cosZ - y * sinZ;
    const y2 = x * sinZ + y * cosZ;
    x = x2;
    y = y2;
  }

  return [x, y, z];
}

function faceNormal(pts) {
  const [a, b, c] = pts;
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

export default function MythicPrism3D() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const stateRef = useRef({
    rotX: 0.32,
    rotY: 0.65,
    velX: 0,
    velY: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    time: 0,
    isInView: true,
    isTabVisible: typeof document !== "undefined" ? !document.hidden : true,
    reducedMotion: false,
  });

  const drawRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    stateRef.current.reducedMotion = mediaQuery.matches;
    setReducedMotion(mediaQuery.matches);

    let width = 260;
    let height = 210;
    let rafId = null;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(200, Math.floor(rect.width));
      height = Math.max(180, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = (pt) => {
      const fov = 4.6;
      const scale = Math.min(width, height) * 0.29;
      const depth = fov / (fov + pt[2] + 1.1);
      return {
        x: width * 0.5 + pt[0] * scale * depth,
        y: height * 0.5 + pt[1] * scale * depth,
        z: pt[2],
      };
    };

    const drawRing = (ringPoints, rx, ry, rz, color, lineWidth) => {
      ctx.beginPath();
      ringPoints.forEach((pt, idx) => {
        const rotated = rotatePoint(pt, rx, ry, rz);
        const p = project(rotated);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    const drawFrame = () => {
      const st = stateRef.current;
      ctx.clearRect(0, 0, width, height);

      // Subtle warm metallic radial stage glow behind the prism (zero indigo/violet)
      const bgGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        8,
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.48
      );
      bgGlow.addColorStop(0, "rgba(245, 158, 11, 0.22)");
      bgGlow.addColorStop(0.55, "rgba(217, 119, 6, 0.06)");
      bgGlow.addColorStop(1, "rgba(18, 19, 22, 0)");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // Back orbital rings
      drawRing(
        OUTER_RING,
        st.rotX + 0.55,
        st.rotY - st.time * 0.25,
        0.35,
        "rgba(245, 158, 11, 0.34)",
        1.15
      );
      drawRing(
        INNER_RING,
        st.rotX - 0.65,
        st.rotY + st.time * 0.4,
        -0.42,
        "rgba(229, 228, 223, 0.22)",
        1
      );

      // Project & depth-sort metallic faces
      const transformed = CORE_VERTICES.map((v) => rotatePoint(v, st.rotX, st.rotY));
      const lightDir = [-0.45, -0.62, -0.64];

      const sortedFaces = CORE_FACES.map((indices) => {
        const pts3d = indices.map((idx) => transformed[idx]);
        const avgZ = pts3d.reduce((acc, p) => acc + p[2], 0) / pts3d.length;
        return { indices, pts3d, avgZ };
      }).sort((a, b) => b.avgZ - a.avgZ);

      sortedFaces.forEach(({ pts3d }) => {
        const normal = faceNormal(pts3d);
        const dot = Math.max(
          0,
          normal[0] * lightDir[0] + normal[1] * lightDir[1] + normal[2] * lightDir[2]
        );
        const rim = Math.pow(1 - Math.abs(normal[2]), 2);

        // Forged obsidian steel base with molten gold specular highlight
        const r = Math.round(24 + dot * 54 + rim * 145);
        const g = Math.round(25 + dot * 46 + rim * 96);
        const b = Math.round(30 + dot * 32 + rim * 14);

        const projected = pts3d.map(project);
        ctx.beginPath();
        projected.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();

        ctx.fillStyle = `rgba(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)}, 0.92)`;
        ctx.fill();

        const edgeAlpha = 0.22 + dot * 0.42 + rim * 0.28;
        ctx.strokeStyle = `rgba(251, 191, 36, ${Math.min(0.88, edgeAlpha).toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Subtle orbiting amber ember motes
      EMBERS.forEach((mote) => {
        const a = mote.angle + st.time * mote.speed;
        const rawPt = [
          Math.cos(a) * mote.radius,
          mote.yOffset + Math.sin(st.time * 0.9 + mote.angle) * 0.08,
          Math.sin(a) * mote.radius,
        ];
        const rotated = rotatePoint(rawPt, st.rotX * 0.45, st.rotY * 0.45);
        const p = project(rotated);
        const alpha = Math.max(0.15, Math.min(0.85, (1.4 - p.z) * 0.42));
        ctx.beginPath();
        ctx.arc(p.x, p.y, mote.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha.toFixed(2)})`;
        ctx.fill();
      });
    };

    drawRef.current = drawFrame;

    const shouldAnimate = () => {
      const st = stateRef.current;
      return !st.reducedMotion && st.isTabVisible && st.isInView;
    };

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const tick = () => {
      const st = stateRef.current;
      if (!shouldAnimate()) {
        stopLoop();
        return;
      }

      if (!st.dragging) {
        st.rotY += 0.0065 + st.velY;
        st.rotX += st.velX;
        st.velX *= 0.92;
        st.velY *= 0.92;
      }
      st.time += 0.016;
      drawFrame();
      rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafId === null && shouldAnimate()) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const handleVisibilityChange = () => {
      stateRef.current.isTabVisible = !document.hidden;
      if (document.hidden) {
        stopLoop();
      } else if (shouldAnimate()) {
        startLoop();
      } else {
        drawFrame();
      }
    };

    const handleReducedMotionChange = (event) => {
      stateRef.current.reducedMotion = event.matches;
      setReducedMotion(event.matches);
      if (event.matches) {
        stopLoop();
        drawFrame();
      } else {
        startLoop();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = Boolean(entries[0]?.isIntersecting);
        stateRef.current.isInView = visible;
        if (visible) {
          if (shouldAnimate()) startLoop();
          else drawFrame();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );

    resize();
    drawFrame();
    if (shouldAnimate()) {
      startLoop();
    }

    observer.observe(container);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    mediaQuery.addEventListener("change", handleReducedMotionChange);

    return () => {
      stopLoop();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      mediaQuery.removeEventListener("change", handleReducedMotionChange);
    };
  }, []);

  const handlePointerDown = (event) => {
    const st = stateRef.current;
    st.dragging = true;
    st.lastX = event.clientX;
    st.lastY = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const st = stateRef.current;
    if (!st.dragging) return;
    const dx = event.clientX - st.lastX;
    const dy = event.clientY - st.lastY;
    st.lastX = event.clientX;
    st.lastY = event.clientY;

    st.rotY += dx * 0.012;
    st.rotX += dy * 0.012;
    st.velY = dx * 0.0022;
    st.velX = dy * 0.0022;

    if (st.reducedMotion && drawRef.current) {
      drawRef.current();
    }
  };

  const handlePointerUp = (event) => {
    stateRef.current.dragging = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleReset = () => {
    const st = stateRef.current;
    st.rotX = 0.32;
    st.rotY = 0.65;
    st.velX = 0;
    st.velY = 0;
    drawRef.current?.();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[200px] sm:h-[220px] rounded-xl bg-[#16181D] border border-stone-700/80 overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive 3D forged geometric prism — drag to rotate"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleReset}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
      />

      <div className="pointer-events-none absolute inset-x-3 bottom-2.5 flex items-center justify-between text-[11px] text-stone-400">
        <span>{reducedMotion ? "Static 3D view · Drag to rotate" : "Drag to inspect 3D"}</span>
        <button
          type="button"
          onClick={handleReset}
          className="pointer-events-auto inline-flex items-center gap-1 text-stone-300 hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded px-1 py-0.5"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
