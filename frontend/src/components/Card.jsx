import { useState } from 'react';
import { COLORS } from '../tokens';

export default function Card({ children, style: s, hover = false, onClick, padding = 20 }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: hov ? COLORS.cardHover : COLORS.card,
        border: `1px solid ${hov ? COLORS.borderLight : COLORS.border}`,
        borderRadius: 12, padding,
        transition: 'all 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...s,
      }}
    >
      {children}
    </div>
  );
}
