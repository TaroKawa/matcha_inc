// ============================
// Matcha Inc. — Building Block Component for City Map
// ============================

import { Property, Store } from '@/types/game';

interface BuildingBlockProps {
  property: Property;
  store?: Store;
  onClick: () => void;
}

export default function BuildingBlock({ property, store, onClick }: BuildingBlockProps) {
  const hash = property.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const isOccupied = !!store;
  const isAvailable = property.available && !store;

  // Size based on property
  const w = 60 + (property.size / 40) * 30; // 60-80px
  const h = 80 + (property.size / 40) * 60; // 80-140px

  // Color palette per area
  const palettes: Record<string, string[]> = {
    shibuya: ['#6C63FF', '#FF6584', '#43B8A0', '#5B86E5', '#FFC75F'],
    marunouchi: ['#37474F', '#546E7A', '#607D8B', '#455A64', '#78909C'],
    shimokitazawa: ['#FF8A65', '#A1887F', '#FFB74D', '#BCAAA4', '#8D6E63'],
    asakusa: ['#D84315', '#BF360C', '#8D6E63', '#A1887F', '#795548'],
  };
  const colors = palettes[property.areaId] || palettes.shibuya;
  const mainColor = colors[hash % colors.length];

  // Number of floors (windows)
  const floors = Math.floor(h / 20);
  const cols = Math.max(2, Math.floor(w / 18));

  return (
    <div
      className="relative cursor-pointer group"
      onClick={onClick}
      style={{ width: `${w}px` }}
    >
      {/* Badge above building */}
      {isAvailable && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 tenant-badge">
          <div className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm shadow-lg leading-tight text-center whitespace-nowrap border border-red-800">
            テナント<br />募集
          </div>
          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-red-600 mx-auto" />
        </div>
      )}
      {isOccupied && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 store-marker">
          <div className="bg-matcha-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm shadow-lg leading-tight text-center whitespace-nowrap border border-matcha-800 max-w-[90px] truncate">
            🏪 {store!.name}
          </div>
          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-matcha-600 mx-auto" />
        </div>
      )}

      {/* Building */}
      <div
        className="relative mx-auto group-hover:-translate-y-1 transition-transform duration-200"
        style={{ width: `${w}px`, height: `${h}px` }}
      >
        {/* Main face */}
        <div
          className="absolute inset-0 rounded-t-sm"
          style={{ background: mainColor }}
        >
          {/* Windows grid */}
          <div
            className="absolute inset-1 grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${floors}, 1fr)`,
            }}
          >
            {Array.from({ length: floors * cols }).map((_, i) => {
              const lit = isOccupied && ((hash + i * 7) % 10 > 3);
              return (
                <div
                  key={i}
                  className="rounded-[1px]"
                  style={{
                    background: isOccupied
                      ? lit
                        ? 'rgba(255, 240, 140, 0.9)'
                        : 'rgba(120, 180, 230, 0.35)'
                      : 'rgba(120, 180, 230, 0.3)',
                  }}
                />
              );
            })}
          </div>

          {/* Entrance */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-sm"
            style={{
              width: Math.max(8, w * 0.18),
              height: Math.max(10, h * 0.1),
              background: 'rgba(0,0,0,0.3)',
            }}
          />

          {/* Roof detail */}
          <div
            className="absolute -top-1 left-1 right-1 h-1 rounded-t-sm"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          />
        </div>

        {/* Right face (3D) */}
        <div
          className="absolute top-0 -right-[5px] w-[5px]"
          style={{
            height: `${h}px`,
            background: `linear-gradient(to right, ${mainColor}cc, ${mainColor}88)`,
          }}
        />

        {/* Bottom face (3D) */}
        <div
          className="absolute -bottom-[4px] left-0 h-[4px]"
          style={{
            width: `${w}px`,
            background: `${mainColor}99`,
          }}
        />
      </div>

      {/* Shadow */}
      <div
        className="mx-auto mt-1 rounded-full opacity-20 bg-black"
        style={{ width: `${w * 0.7}px`, height: '4px' }}
      />
    </div>
  );
}

// Decorative building (non-interactive)
export function DecorativeBuilding({
  width,
  height,
  color,
  variant,
}: {
  width: number;
  height: number;
  color: string;
  variant?: 'house' | 'tower' | 'shop' | 'apartment';
}) {
  const floors = Math.floor(height / 18);
  const cols = Math.max(1, Math.floor(width / 16));

  return (
    <div style={{ width: `${width}px` }} className="relative">
      <div
        className="relative rounded-t-sm mx-auto"
        style={{ width: `${width}px`, height: `${height}px`, background: color }}
      >
        {/* Windows */}
        <div
          className="absolute inset-[2px] grid gap-[1px]"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${floors}, 1fr)`,
          }}
        >
          {Array.from({ length: floors * cols }).map((_, i) => (
            <div key={i} className="rounded-[0.5px]" style={{ background: 'rgba(100,170,230,0.25)' }} />
          ))}
        </div>

        {/* Right face */}
        <div
          className="absolute top-0 -right-[3px] w-[3px]"
          style={{ height: `${height}px`, background: `${color}aa` }}
        />
        {/* Bottom face */}
        <div
          className="absolute -bottom-[3px] left-0 h-[3px]"
          style={{ width: `${width}px`, background: `${color}88` }}
        />
      </div>
    </div>
  );
}

// Tree decoration
export function Tree({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 16 : size === 'md' ? 24 : 32;
  return (
    <div className="flex flex-col items-center" style={{ width: `${s}px` }}>
      <div
        className="rounded-full"
        style={{
          width: `${s}px`,
          height: `${s}px`,
          background: 'radial-gradient(circle at 40% 35%, #66BB6A, #2E7D32)',
          boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.2)',
        }}
      />
      <div
        className="rounded-sm"
        style={{
          width: `${Math.max(2, s / 6)}px`,
          height: `${s / 3}px`,
          background: '#5D4037',
        }}
      />
    </div>
  );
}

// Park decoration
export function Park() {
  return (
    <div className="flex items-end gap-1 px-2">
      <Tree size="sm" />
      <div className="w-8 h-3 rounded-full bg-green-400/60" />
      <Tree size="md" />
      <div className="w-6 h-2 rounded-full bg-green-300/50" />
      <Tree size="sm" />
    </div>
  );
}

// Car decoration
export function Car({ color = '#EF5350' }: { color?: string }) {
  return (
    <div className="relative" style={{ width: '20px', height: '10px' }}>
      <div
        className="absolute bottom-0 left-0 w-full h-[6px] rounded-sm"
        style={{ background: color }}
      />
      <div
        className="absolute bottom-[5px] left-[4px] rounded-t-sm"
        style={{ width: '12px', height: '5px', background: color }}
      />
      {/* Wheels */}
      <div className="absolute -bottom-[1px] left-[2px] w-[3px] h-[3px] rounded-full bg-gray-800" />
      <div className="absolute -bottom-[1px] right-[2px] w-[3px] h-[3px] rounded-full bg-gray-800" />
    </div>
  );
}
