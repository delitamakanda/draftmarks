import { useState } from 'react';

type ReactCounterProps = {
        initialCount?: number;
};

export default function ReactCounter({ initialCount = 0 }: ReactCounterProps) {
        const [count, setCount] = useState(initialCount);

        return (
                <div className="grid gap-2 place-items-center">
                        <p className="text-lg font-semibold">This counter is a React component!</p>
                        <div className="flex items-center gap-4">
                                <button
                                        type="button"
                                        className="px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-700"
                                        onClick={() => setCount((value) => value - 1)}
                                >
                                        -
                                </button>
                                <span className="text-2xl font-bold" aria-live="polite">
                                        {count}
                                </span>
                                <button
                                        type="button"
                                        className="px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-700"
                                        onClick={() => setCount((value) => value + 1)}
                                >
                                        +
                                </button>
                        </div>
                </div>
        );
}
