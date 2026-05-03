interface Props {
  grid: string[][];
  scale?: number;
  paletteOverrides?: Record<string, string>;
  className?: string;
  style?: React.CSSProperties;
}

export default function PixelSprite({ grid, scale = 4, paletteOverrides, className, style }: Props) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  const shadows = grid.flatMap((row, y) =>
    row.map((color, x) => {
      if (color === 'transparent') return null;
      const finalColor = paletteOverrides?.[color] ?? color;
      return `${x * scale}px ${y * scale}px 0 ${scale - 1}px ${finalColor}`;
    })
  ).filter(Boolean).join(',');

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: width * scale,
        height: height * scale,
        imageRendering: 'pixelated',
        flexShrink: 0,
        ...style,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: scale,
        height: scale,
        boxShadow: shadows,
      }} />
    </div>
  );
}
