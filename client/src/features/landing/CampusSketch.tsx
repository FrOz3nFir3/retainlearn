// A small drawing of the campus (the prototype's CampusSketch): plain SVG, light on any device, for the home page and
// the sign-in page. Buildings with lit windows around the clock tower, one of them going cold.
const S = 14;
type Point = [number, number, number?];
const iso = (x: number, y: number, z = 0): [number, number] => [(x - y) * 0.866 * S, (x + y) * 0.5 * S - z * S];
const pts = (list: Point[]) => list.map(([x, y, z]) => iso(x, y, z).join(",")).join(" ");

type BoxProps = { x: number; y: number; w: number; d: number; h: number; roof?: string; lit?: number; cold?: boolean };

function Box({ x, y, w, d, h, roof = "#4F46E5", lit = 0, cold = false }: BoxProps) {
  const wallE = cold ? "#E1E3EE" : "#FFFFFF";
  const wallS = cold ? "#D3D6E6" : "#EEF0FA";
  const windows = [];
  const cols = Math.max(1, Math.floor(w / 1.4));
  const floors = Math.max(1, Math.floor(h / 1.6));
  let n = 0;
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + 0.35 + c * 1.4;
      const wz = 0.45 + f * 1.6;
      const on = n++ < lit;
      windows.push(
        <polygon
          key={`s${f}${c}`}
          points={pts([
            [wx, y + d, wz],
            [wx + 0.7, y + d, wz],
            [wx + 0.7, y + d, wz + 0.8],
            [wx, y + d, wz + 0.8],
          ])}
          fill={on ? (cold ? "#E4DBC0" : "#FFD36A") : "#C9CDEB"}
        />,
      );
    }
  }
  return (
    <g>
      <polygon points={pts([[x + w, y, 0], [x + w, y + d, 0], [x + w, y + d, h], [x + w, y, h]])} fill={wallE} stroke="#DCE0F2" strokeWidth="0.6" />
      <polygon points={pts([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h]])} fill={wallS} stroke="#DCE0F2" strokeWidth="0.6" />
      {windows}
      <polygon points={pts([[x - 0.2, y - 0.2, h], [x + w + 0.2, y - 0.2, h], [x + w + 0.2, y + d + 0.2, h], [x - 0.2, y + d + 0.2, h]])} fill={cold ? "#8E92B6" : roof} />
      <polygon points={pts([[x + w + 0.2, y - 0.2, h], [x + w + 0.2, y + d + 0.2, h], [x + w + 0.2, y + d + 0.2, h + 0.35], [x + w + 0.2, y - 0.2, h + 0.35]])} fill={cold ? "#7A7FA6" : "#3B33C4"} />
      <polygon points={pts([[x - 0.2, y + d + 0.2, h], [x + w + 0.2, y + d + 0.2, h], [x + w + 0.2, y + d + 0.2, h + 0.35], [x - 0.2, y + d + 0.2, h + 0.35]])} fill={cold ? "#8E92B6" : "#4338CA"} />
    </g>
  );
}

function Tree({ x, y }: { x: number; y: number }) {
  const [cx, cy] = iso(x, y, 0);
  return (
    <g>
      <rect x={cx - 1.5} y={cy - 12} width="3" height="12" fill="#A3846F" />
      <ellipse cx={cx} cy={cy - 17} rx="8" ry="9.5" fill="#7CC99D" />
    </g>
  );
}

export function CampusSketch({ className = "" }: { className?: string }) {
  const ground = pts([
    [-1, -1, 0],
    [17, -1, 0],
    [17, 17, 0],
    [-1, 17, 0],
  ]);
  const [lx, ly] = iso(8, 8, 0);
  const [youX, youY] = iso(9.6, 9.6, 0);
  const [faceX, faceY] = iso(8.4, 7.8, 5.6);
  return (
    <svg viewBox="-260 -40 520 330" className={className} role="img" aria-label="Drawing of a small campus: buildings with lit windows around a clock tower">
      <polygon points={ground} fill="#F3F4FB" stroke="#DCE0F2" />
      <ellipse cx={lx} cy={ly} rx={4 * 0.866 * S * 2} ry={4 * 0.5 * S * 2} fill="#CDEBD6" />
      <Tree x={6.5} y={0.2} />
      <Tree x={3} y={10} />
      <Box x={1} y={1} w={5} d={4} h={4.8} lit={9} />
      <Box x={10} y={0.5} w={4.5} d={3.5} h={3.2} roof="#0EA5A4" lit={3} />
      <Box x={0.5} y={10.5} w={4} d={3.5} h={3.2} roof="#E8604C" cold lit={1} />
      <g>
        <polygon points={pts([[8.4, 7.2, 0], [8.4, 8.4, 0], [8.4, 8.4, 7], [8.4, 7.2, 7]])} fill="#FFFFFF" />
        <polygon points={pts([[7.2, 8.4, 0], [8.4, 8.4, 0], [8.4, 8.4, 7], [7.2, 8.4, 7]])} fill="#E4E6F6" />
        <polygon points={`${iso(7.1, 8.5, 7).join(",")} ${iso(8.5, 8.5, 7).join(",")} ${iso(7.8, 7.8, 9.4).join(",")}`} fill="#4F46E5" />
        <polygon points={`${iso(8.5, 7.1, 7).join(",")} ${iso(8.5, 8.5, 7).join(",")} ${iso(7.8, 7.8, 9.4).join(",")}`} fill="#3B33C4" />
        <circle cx={faceX} cy={faceY} r="4" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="1.2" />
        <path d={`M${iso(7.8, 7.8, 9.4).join(",")} l0,-14 l12,4 l-12,4`} fill="#F59E0B" stroke="#C9CCE0" strokeWidth="0.8" />
      </g>
      <Box x={11} y={10} w={4.5} d={4} h={4.8} roof="#9B6BDF" lit={7} />
      <Tree x={15.5} y={6.5} />
      <Tree x={7} y={15.5} />
      <circle cx={youX} cy={youY - 5} r="4" fill="#4F46E5" />
    </svg>
  );
}
