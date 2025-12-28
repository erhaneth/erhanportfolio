import React, { useEffect, useRef } from 'react';

const MatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);
  const dropsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%' + 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
    const fontSize = 16;

    const initCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const columns = Math.floor(canvas.width / fontSize);
      
      // Initialize drops array
      dropsRef.current = [];
      for (let i = 0; i < columns; i++) {
        dropsRef.current[i] = Math.random() * -100; // Start at random negative positions for staggered effect
      }
    };

    initCanvas();

    const draw = () => {
      if (!ctx || !canvas) return;
      
      // Semi-transparent black to create trail effect
      ctx.fillStyle = 'rgba(2, 2, 2, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00FF41';
      ctx.font = `${fontSize}px monospace`;

      const drops = dropsRef.current;
      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to top with some randomness
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const startAnimation = () => {
      if (intervalRef.current === null) {
        intervalRef.current = window.setInterval(draw, 33); // ~30fps
      }
    };

    const stopAnimation = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Handle visibility change - pause when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    // Handle window resize
    const handleResize = () => {
      initCanvas();
    };

    // Start animation
    startAnimation();

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      stopAnimation();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-rain-bg" />;
};

export default MatrixRain;
