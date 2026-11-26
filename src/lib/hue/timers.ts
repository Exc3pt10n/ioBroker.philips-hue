/**
 * Timer functions of the adapter. The library uses them instead of the global timers, so all timers are cleared
 * when the adapter stops.
 */
export interface Timers {
    /** Start a timer, returns a handle for clearTimeout */
    setTimeout: (callback: () => void, ms: number) => unknown;
    /** Clear a timer started via setTimeout, ignores undefined */
    clearTimeout: (timer: unknown) => void;
}
