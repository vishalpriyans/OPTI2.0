// Lightweight, explainable duration predictor (TypeScript-style per spec)

export type HHMM = string

function toMin(hhmm: HHMM): number {
	const [H, M] = hhmm.split(":").map(Number)
	return H * 60 + M
}

export type ProcStats = { med: number; p25: number; p75: number; n: number }
export type DeltaStats = { med: number; n: number }

export type Aggregates = {
	proc: Record<string, ProcStats>
	procSurgeon: Record<string, Record<string, DeltaStats>>
	procEquip: Record<string, Record<string, DeltaStats>>
	procTOD: Record<string, Record<"morning" | "midday" | "late", DeltaStats>>
}

export type PredictOut = {
	predMin: number
	conf: "low" | "med" | "high"
	explain: string
	factors: Record<string, number>
}

export function slotOfDayFrom(hhmm: HHMM): "morning" | "midday" | "late" {
	const m = toMin(hhmm)
	if (m < toMin("11:00")) return "morning"
	if (m < toMin("15:00")) return "midday"
	return "late"
}

export function shrink(n: number, alpha = 10): number {
	return n / (n + alpha)
}

export function predictDuration(
	c: {
		procedureCode: string
		estMin: number
		surgeonId: string
		equipmentIds: string[]
		patientReady: HHMM
		riskFlags?: string[]
	},
	agg: Aggregates,
): PredictOut {
	const ps: ProcStats | undefined = agg.proc[c.procedureCode]
	const base = Math.max(c.estMin, ps?.med ?? c.estMin)

	// Surgeon effect
	const sStats: DeltaStats | undefined = agg.procSurgeon[c.procedureCode]?.[c.surgeonId]
	const S = sStats ? shrink(sStats.n) * sStats.med : 0

	// Equipment effect (sum)
	let E = 0
	for (const eq of c.equipmentIds) {
		const eStats: DeltaStats | undefined = agg.procEquip[c.procedureCode]?.[eq]
		if (eStats) E += shrink(eStats.n) * eStats.med
	}

	// Time-of-day effect
	const slot = slotOfDayFrom(c.patientReady)
	const tStats: DeltaStats | undefined = agg.procTOD[c.procedureCode]?.[slot]
	const T = tStats ? shrink(tStats.n) * tStats.med : 0

	// Optional risk buffer (simple uplift)
	const upperSoft = Math.max(ps?.p75 ?? c.estMin * 1.1, 1.25 * c.estMin)
	let R = 0
	if (c.riskFlags && c.riskFlags.length > 0) {
		const target = 0.25 * upperSoft // quarter of upper cap
		R = Math.max(0, target - base)
		R = Math.min(R, 20) // cap risk addition to 20 min (tunable)
	}

	const raw = base + S + E + T + R

	// clamps
	const L = 0.8 * c.estMin
	const U = Math.max(ps?.p75 ?? c.estMin * 1.1, 1.25 * c.estMin)
	const pred = Math.round(Math.min(Math.max(raw, L), U))

	// confidence
	const nProc = ps?.n ?? 0
	const nS = sStats?.n ?? 0
	const nT = tStats?.n ?? 0
	const conf: "low" | "med" | "high" =
		nProc >= 10 && (nS >= 5 || nT >= 5) ? "high" : nProc >= 3 ? "med" : "low"

	function fmtDeltaMin(x: number): string {
		const v = Math.round(x)
		return `${v >= 0 ? "+" : ""}${v}m`
	}
	const sPart = S ? `, S${fmtDeltaMin(S)}` : ""
	const ePart = E ? `, E${fmtDeltaMin(E)}` : ""
	const tPart = T ? `, T+${Math.round(T)}` : "" // keep original label unless requested
	const rPart = R ? `, risk+${Math.round(R)}` : ""
	const boundsText = `bounds ${Math.round(L)}–${Math.round(U)}`
	const explain = `Pred ${pred} (base ${Math.round(base)}${sPart}${ePart}${tPart}${rPart}; ${boundsText})`

	return { predMin: pred, conf, explain, factors: { base, S, E, T, R, L, U } }
}

// Minimal helpers to build aggregates from completed cases (medians & p25/p75)

export type CompletedCase = {
	id: string
	procedureCode: string
	surgeonId: string
	equipmentIds: string[]
	actualStart: string // ISO
	actualEnd: string // ISO
	baseEstimateMin: number
	complications?: string[]
}

function minutesBetween(isoStart: string, isoEnd: string): number {
	const s = new Date(isoStart).getTime()
	const e = new Date(isoEnd).getTime()
	return Math.max(0, Math.round((e - s) / 60000))
}

function median(xs: number[]): number {
	if (!xs.length) return 0
	const a = xs.slice().sort((x, y) => x - y)
	const mid = Math.floor(a.length / 2)
	return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2
}

function pct(xs: number[], p: number): number {
	if (!xs.length) return 0
	const a = xs.slice().sort((x, y) => x - y)
	const idx = Math.floor((p / 100) * (a.length - 1))
	return a[idx]
}

export function buildAggregates(history: CompletedCase[]): Aggregates {
	const procDurations: Record<string, number[]> = {}
	const procEsts: Record<string, number[]> = {}
	const procSurgeonDeltas: Record<string, Record<string, number[]>> = {}
	const procEquipDeltas: Record<string, Record<string, number[]>> = {}
	const procTODDeltas: Record<string, Record<"morning" | "midday" | "late", number[]>> = {}

	for (const h of history) {
		const duration = minutesBetween(h.actualStart, h.actualEnd)
		const delta = duration - h.baseEstimateMin
		procDurations[h.procedureCode] ||= []
		procDurations[h.procedureCode].push(duration)
		procEsts[h.procedureCode] ||= []
		procEsts[h.procedureCode].push(h.baseEstimateMin)

		// surgeon deltas
		procSurgeonDeltas[h.procedureCode] ||= {}
		const s = procSurgeonDeltas[h.procedureCode]
		s[h.surgeonId] ||= []
		s[h.surgeonId].push(delta)

		// equipment deltas (each)
		procEquipDeltas[h.procedureCode] ||= {}
		const pe = procEquipDeltas[h.procedureCode]
		for (const eq of h.equipmentIds) {
			pe[eq] ||= []
			pe[eq].push(delta)
		}

		// time of day bucket deltas
		const slot = slotOfDayFrom(new Date(h.actualStart).toTimeString().slice(0, 5) as HHMM)
		procTODDeltas[h.procedureCode] ||= { morning: [], midday: [], late: [] }
		const pt = procTODDeltas[h.procedureCode]
		pt[slot].push(delta)
	}

	// finalize medians and percentiles for procedures
	const proc: Aggregates["proc"] = {}
	for (const code of Object.keys(procDurations)) {
		const durs = procDurations[code]
		proc[code] = { med: median(durs), p25: pct(durs, 25), p75: pct(durs, 75), n: durs.length }
	}

	// convert delta arrays to medians for surgeon stats
	const procSurgeon: Aggregates["procSurgeon"] = {}
	for (const code of Object.keys(procSurgeonDeltas)) {
		procSurgeon[code] = {}
		for (const sid of Object.keys(procSurgeonDeltas[code])) {
			const deltas = procSurgeonDeltas[code][sid]
			procSurgeon[code][sid] = { med: Math.round(median(deltas)), n: deltas.length }
		}
	}

	// convert delta arrays to medians for equipment stats
	const procEquip: Aggregates["procEquip"] = {}
	for (const code of Object.keys(procEquipDeltas)) {
		procEquip[code] = {}
		for (const eq of Object.keys(procEquipDeltas[code])) {
			const deltas = procEquipDeltas[code][eq]
			procEquip[code][eq] = { med: Math.round(median(deltas)), n: deltas.length }
		}
	}

	// convert delta arrays to medians for time-of-day stats
	const procTOD: Aggregates["procTOD"] = {}
	for (const code of Object.keys(procTODDeltas)) {
		procTOD[code] = { morning: { med: 0, n: 0 }, midday: { med: 0, n: 0 }, late: { med: 0, n: 0 } }
		for (const slot of ["morning", "midday", "late"] as const) {
			const deltas = procTODDeltas[code][slot]
			if (deltas.length > 0) {
				procTOD[code][slot] = { med: Math.round(median(deltas)), n: deltas.length }
			}
		}
	}

	return { proc, procSurgeon, procEquip, procTOD }
}


