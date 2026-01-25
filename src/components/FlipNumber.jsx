import { useState, useEffect, useRef } from 'react';

/**
 * FlipNumber - Flip animation like departure boards when numbers change
 * Each digit flips individually for a smooth effect
 */
const FlipNumber = ({ value, format = 'number', className = '', decimals = 2 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (previousValue.current !== value) {
      setIsFlipping(true);
      setTimeout(() => {
        setDisplayValue(value);
        previousValue.current = value;
        setIsFlipping(false);
      }, 150);
    }
  }, [value]);

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

  return (
    <span className={`inline-block tabular-nums ${className} ${isFlipping ? 'flip-animation' : ''}`}>
      {formatValue(displayValue)}
    </span>
  );
};

export default FlipNumber;
