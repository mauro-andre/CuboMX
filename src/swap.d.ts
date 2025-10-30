interface Swap {
    select?: string;
    target: string;
}
interface Option {
    pushUrl?: string;
    title?: string;
}
declare const swap: (html: string, swaps: Swap[], options?: Option) => void;
export { swap };
