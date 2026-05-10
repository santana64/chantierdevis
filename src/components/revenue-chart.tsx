import { formatMoney } from "@/domain/quotes";

type MonthData = {
  label: string;
  quotedCents: number;
  acceptedCents: number;
  invoicedCents: number;
};

const PAD_L = 72;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 28;
const CHART_H = 140;
const GROUP_W = 40;
const BAR_W = 11;
const MONTH_STEP = 52;

export function RevenueChart({ data }: { data: MonthData[] }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.quotedCents, d.invoicedCents)), 1);
  const totalW = PAD_L + data.length * MONTH_STEP + PAD_R;
  const totalH = CHART_H + PAD_T + PAD_B;

  function barH(val: number) {
    return Math.max(2, (val / maxVal) * CHART_H);
  }

  function barY(val: number) {
    return PAD_T + CHART_H - barH(val);
  }

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    val: maxVal * t,
    y: PAD_T + CHART_H - t * CHART_H,
  }));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width={totalW}
        height={totalH}
        className="block min-w-full"
        aria-label="Évolution mensuelle du chiffre d'affaires"
      >
        {/* Grid lines */}
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD_L}
              y1={tick.y}
              x2={totalW - PAD_R}
              y2={tick.y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 6}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {tick.val === 0 ? "0" : tick.val < 100000 ? `${Math.round(tick.val / 100)}€` : `${Math.round(tick.val / 100000)}k€`}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const x = PAD_L + i * MONTH_STEP + (MONTH_STEP - GROUP_W) / 2;
          return (
            <g key={d.label}>
              {/* Quoted bar (background, cream) */}
              <rect
                x={x}
                y={barY(d.quotedCents)}
                width={BAR_W}
                height={barH(d.quotedCents)}
                rx="2"
                fill="#f0ebe0"
                stroke="#e2d9c8"
                strokeWidth="0.5"
              >
                <title>Devisé : {formatMoney(d.quotedCents)}</title>
              </rect>

              {/* Accepted bar (orange) */}
              <rect
                x={x + BAR_W + 3}
                y={barY(d.acceptedCents)}
                width={BAR_W}
                height={barH(d.acceptedCents)}
                rx="2"
                fill="#e86218"
              >
                <title>Accepté : {formatMoney(d.acceptedCents)}</title>
              </rect>

              {/* Invoiced bar (green, thin overlay) */}
              {d.invoicedCents > 0 && (
                <rect
                  x={x + BAR_W + 3}
                  y={barY(d.invoicedCents)}
                  width={BAR_W}
                  height={barH(d.invoicedCents)}
                  rx="2"
                  fill="#16a34a"
                  opacity="0.65"
                >
                  <title>Facturé : {formatMoney(d.invoicedCents)}</title>
                </rect>
              )}

              {/* Month label */}
              <text
                x={x + GROUP_W / 2}
                y={totalH - 4}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontWeight="500"
              >
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Axis line */}
        <line
          x1={PAD_L}
          y1={PAD_T + CHART_H}
          x2={totalW - PAD_R}
          y2={PAD_T + CHART_H}
          stroke="#cbd5e1"
          strokeWidth="1"
        />
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#f0ebe0] border border-[#e2d9c8]" />
          Devisé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
          Accepté
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-600 opacity-65" />
          Facturé
        </span>
      </div>
    </div>
  );
}
