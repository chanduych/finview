import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedNumber - Smooth counting animation for numbers
 * @param {number} value - The target value to animate to
 * @param {string} format - 'currency' | 'percent' | 'number'
 * @param {number} duration - Animation duration in ms (default 800)
 * @param {string} className - Additional CSS classes
 */
export default function AnimatedNumber({ 
  value, 
  format = 'number', 
  duration = 800, 
  className = '',
  decimals = 2
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Skip animation if value hasn't changed
    if (previousValue.current === value) return;

    const startValue = previousValue.current;
    const endValue = value;
    const difference = endValue - startValue;

    // Easing function (ease-out cubic)
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      const currentValue = startValue + (difference * easedProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValue.current = endValue;
        startTimeRef.current = null;
      }
    };

    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  // Initial mount - set the value without animation
  useEffect(() => {
    setDisplayValue(value);
    previousValue.current = value;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatValue = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '—';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(val);
      case 'percent':
        return `${val >= 0 ? '+' : ''}${val.toFixed(decimals)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(val);
    }
  };

  const isPositive = displayValue >= 0;
  const colorClass = format === 'percent' 
    ? (isPositive ? 'text-emerald-500' : 'text-red-500')
    : '';

  return (
    <span className={`tabular-nums transition-colors duration-300 ${colorClass} ${className}`}>
      {formatValue(displayValue)}
    </span>
  );
}
