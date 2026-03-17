"use client"

import useSWR from "swr"
import { mutate as globalMutate } from "swr"
import type { CaseInput, FullSchedule, WeeklyFullSchedule } from "./types"
import { SAMPLE_SURGERIES, SAMPLE_WEEKLY_SCHEDULE } from "./sample-data"

const SURGERIES_KEY = "optiqueue/surgeries"
const SCHEDULE_KEY = "optiqueue/schedule"
const WEEKLY_SCHEDULE_KEY = "optiqueue/weekly-schedule"
const DELAYED_KEY = "optiqueue/delayed"

type ScheduleState = {
  schedule?: FullSchedule
  delayedIds: Set<string>
}

type WeeklyScheduleState = {
  weeklySchedule?: WeeklyFullSchedule
  delayedIds: Set<string>
}

export function useSurgeries() {
  const { data, mutate } = useSWR<CaseInput[]>(SURGERIES_KEY, {
    fetcher: async () => SAMPLE_SURGERIES,
    revalidateOnFocus: false,
  })
  return {
    surgeries: data || [],
    setSurgeries: (list: CaseInput[]) => mutate(list, { revalidate: false }),
    addCase: (c: CaseInput) => mutate([...(data || []), c], { revalidate: false }),
    removeCase: (id: string) =>
      mutate(
        (data || []).filter((c) => c.id !== id),
        { revalidate: false },
      ),
  }
}

export function useSchedule() {
  const sch = useSWR<FullSchedule | undefined>(SCHEDULE_KEY, {
    fetcher: async () => undefined,
    revalidateOnFocus: false,
  })
  const delayed = useSWR<Set<string>>(DELAYED_KEY, { fetcher: async () => new Set(), revalidateOnFocus: false })
  return {
    schedule: sch.data,
    setSchedule: (s?: FullSchedule) => sch.mutate(s, { revalidate: false }),
    delayedIds: delayed.data || new Set<string>(),
    setDelayedIds: (ids: Set<string>) => delayed.mutate(ids, { revalidate: false }),
  }
}

export function useWeeklySchedule() {
  const sch = useSWR<WeeklyFullSchedule | undefined>(WEEKLY_SCHEDULE_KEY, {
    fetcher: async () => SAMPLE_WEEKLY_SCHEDULE,
    revalidateOnFocus: false,
  })
  const delayed = useSWR<Set<string>>(DELAYED_KEY, { fetcher: async () => new Set(), revalidateOnFocus: false })
  return {
    weeklySchedule: sch.data,
    setWeeklySchedule: (s?: WeeklyFullSchedule) => sch.mutate(s, { revalidate: false }),
    delayedIds: delayed.data || new Set<string>(),
    setDelayedIds: (ids: Set<string>) => delayed.mutate(ids, { revalidate: false }),
  }
}

// Utility to broadcast schedule updates across components
export function setScheduleGlobal(s?: FullSchedule) {
  globalMutate(SCHEDULE_KEY, s, false)
}
export function setWeeklyScheduleGlobal(s?: WeeklyFullSchedule) {
  globalMutate(WEEKLY_SCHEDULE_KEY, s, false)
}
export function setDelayedGlobal(ids: Set<string>) {
  globalMutate(DELAYED_KEY, ids, false)
}
