(() => {
    const canvas = document.querySelector(".fractal-bg");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seed = 17.318;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let lastDraw = 0;

    const fade = (t) => t * t * (3 - 2 * t);
    const lerp = (a, b, t) => a + (b - a) * t;
    const fract = (n) => n - Math.floor(n);

    function hash(x, y) {
        return fract(Math.sin(x * 127.1 + y * 311.7 + seed * 19.19) * 43758.5453) * 2 - 1;
    }

    function noise(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = fade(x - ix);
        const fy = fade(y - iy);
        const a = hash(ix, iy);
        const b = hash(ix + 1, iy);
        const c = hash(ix, iy + 1);
        const d = hash(ix + 1, iy + 1);
        return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
    }

    function field(x, y, t) {
        let value = 0;
        let amplitude = 0.58;
        let frequency = 1.1;

        for (let octave = 0; octave < 5; octave += 1) {
            const driftX = Math.cos(t * 0.00012 + octave * 1.7) * (0.9 + octave * 0.15);
            const driftY = Math.sin(t * 0.0001 + octave * 1.3) * (0.8 + octave * 0.12);
            value += noise(x * frequency + driftX, y * frequency + driftY) * amplitude;
            frequency *= 1.92;
            amplitude *= 0.5;
        }

        const radius = Math.hypot(x * 0.88, y * 1.08);
        value += Math.sin(radius * 7.2 - t * 0.00028) * 0.16;
        value += Math.sin((x * 1.9 - y * 1.2) + t * 0.00018) * 0.08;
        return value;
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.max(1, Math.round(rect.width));
        height = Math.max(1, Math.round(rect.height));
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(performance.now());
    }

    function pointOnEdge(level, a, b) {
        const t = (level - a.value) / (b.value - a.value || 1);
        return {
            x: lerp(a.x, b.x, t),
            y: lerp(a.y, b.y, t)
        };
    }

    function drawContour(corners, level) {
        const edges = [
            [corners[0], corners[1]],
            [corners[1], corners[2]],
            [corners[2], corners[3]],
            [corners[3], corners[0]]
        ];
        const intersections = [];

        edges.forEach(([a, b]) => {
            if ((a.value < level && b.value >= level) || (a.value >= level && b.value < level)) {
                intersections.push(pointOnEdge(level, a, b));
            }
        });

        if (intersections.length === 2) {
            ctx.moveTo(intersections[0].x, intersections[0].y);
            ctx.lineTo(intersections[1].x, intersections[1].y);
        } else if (intersections.length === 4) {
            ctx.moveTo(intersections[0].x, intersections[0].y);
            ctx.lineTo(intersections[1].x, intersections[1].y);
            ctx.moveTo(intersections[2].x, intersections[2].y);
            ctx.lineTo(intersections[3].x, intersections[3].y);
        }
    }

    function draw(time = 0) {
        ctx.clearRect(0, 0, width, height);

        const cell = width < 620 ? 14 : 18;
        const cols = Math.ceil(width / cell) + 2;
        const rows = Math.ceil(height / cell) + 2;
        const values = [];
        const levels = [-0.48, -0.32, -0.16, 0, 0.16, 0.32, 0.48];
        const scale = Math.min(width, height) / 2.4;

        for (let y = 0; y <= rows; y += 1) {
            values[y] = [];
            for (let x = 0; x <= cols; x += 1) {
                const px = (x - 1) * cell;
                const py = (y - 1) * cell;
                values[y][x] = {
                    x: px,
                    y: py,
                    value: field((px - width * 0.5) / scale, (py - height * 0.5) / scale, time)
                };
            }
        }

        ctx.lineWidth = 0.9;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        levels.forEach((level, index) => {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(32, 27, 25, ${index % 2 === 0 ? 0.125 : 0.085})`;

            for (let y = 0; y < rows; y += 1) {
                for (let x = 0; x < cols; x += 1) {
                    drawContour([
                        values[y][x],
                        values[y][x + 1],
                        values[y + 1][x + 1],
                        values[y + 1][x]
                    ], level);
                }
            }

            ctx.stroke();
        });
    }

    function animate(time) {
        if (time - lastDraw > 64) {
            draw(time);
            lastDraw = time;
        }

        if (!reducedMotion.matches) {
            frame = requestAnimationFrame(animate);
        }
    }

    window.addEventListener("resize", resize);
    reducedMotion.addEventListener("change", () => {
        cancelAnimationFrame(frame);
        draw(performance.now());
        if (!reducedMotion.matches) {
            frame = requestAnimationFrame(animate);
        }
    });

    resize();
    if (!reducedMotion.matches) {
        frame = requestAnimationFrame(animate);
    }
})();
