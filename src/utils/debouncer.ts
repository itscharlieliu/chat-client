type DebounceFunction = (callback: () => void) => void;

const debouncer = (delay: number): DebounceFunction => {
    let available = true;

    return (callback: () => void): void => {
        if (available) {
            callback();
            available = false;
            setTimeout(() => (available = true), delay);
        }
    };
};

export default debouncer;
