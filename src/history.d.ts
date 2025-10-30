interface CapturedState {
    selector: string;
    htmls: string[];
}
interface HistoryState {
    swaps: CapturedState[];
    title: string;
}
declare const captureState: (cssSelectors: string[]) => CapturedState[];
declare const restoreState: (state: HistoryState | null) => void;
export { captureState, restoreState };
