"use client";

import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
}

export function GarageBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const particleCount = 80;
        const colors = ["#3b82f6", "#f97316", "#22c55e", "#8b5cf6", "#06b6d4"];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    size: Math.random() * 3 + 1,
                    opacity: Math.random() * 0.6 + 0.2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                });
            }
        };

        const drawHexGrid = () => {
            const hexSize = 50;
            const hexHeight = hexSize * Math.sqrt(3);
            ctx.lineWidth = 0.5;

            for (let row = -1; row < canvas.height / hexHeight + 1; row++) {
                for (let col = -1; col < canvas.width / (hexSize * 1.5) + 1; col++) {
                    const x = col * hexSize * 1.5;
                    const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);

                    // Gradient opacity based on position
                    const distFromCenter = Math.sqrt(
                        Math.pow(x - canvas.width / 2, 2) + Math.pow(y - canvas.height / 2, 2)
                    );
                    const maxDist = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2));
                    const opacity = 0.03 + (1 - distFromCenter / maxDist) * 0.05;

                    ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
                    drawHexagon(x, y, hexSize * 0.9);
                }
            }
        };

        const drawHexagon = (x: number, y: number, size: number) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hx = x + size * Math.cos(angle);
                const hy = y + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.stroke();
        };

        const drawParticles = () => {
            particles.forEach((p) => {
                // Convert hex to rgba
                const hex = p.color.replace("#", "");
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);

                // Draw glow
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.5})`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Draw core
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
                ctx.fill();
            });
        };

        const updateParticles = () => {
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            });
        };

        const drawConnections = () => {
            const maxDistance = 180;
            ctx.lineWidth = 0.5;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        const opacity = (1 - distance / maxDistance) * 0.25;
                        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const drawScanlines = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
            for (let y = 0; y < canvas.height; y += 3) {
                ctx.fillRect(0, y, canvas.width, 1);
            }
        };

        const drawVignette = () => {
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
                canvas.width / 2, canvas.height / 2, canvas.width * 0.8
            );
            gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
            gradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Base gradient background
            const bgGradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width
            );
            bgGradient.addColorStop(0, "rgba(10, 15, 30, 1)");
            bgGradient.addColorStop(0.5, "rgba(5, 10, 25, 1)");
            bgGradient.addColorStop(1, "rgba(2, 5, 15, 1)");
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawHexGrid();
            drawConnections();
            drawParticles();
            updateParticles();
            drawScanlines();
            drawVignette();

            animationFrameId = requestAnimationFrame(animate);
        };

        resizeCanvas();
        createParticles();
        animate();

        const handleResize = () => {
            resizeCanvas();
            createParticles();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 pointer-events-none"
        />
    );
}
