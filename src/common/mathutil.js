
export function map(v, fromMin, fromMax, toMin = 0, toMax = 1, clamp = false) {
    if (fromMin > fromMax) {
        fromMin, fromMax = fromMax, fromMin;
        toMin, toMax = toMax, toMin;
    }

    const p = (v - fromMin) / (fromMax - fromMin);
    let mapped = toMin + p * (toMax - toMin);
    if (clamp) {
        mapped = Math.max(mapped, Math.min(toMin, toMax));
        mapped = Math.min(mapped, Math.max(toMin, toMax));
    }
    return mapped;
}