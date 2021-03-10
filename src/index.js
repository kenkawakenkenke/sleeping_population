import GeoTIFF from 'geotiff';

const gpwTifFile = "./data/gpw-v4-population-count_2020.tif";

(async () => {
    const tiffImage = await GeoTIFF.fromFile(gpwTifFile).then(tiff => tiff.getImage());

    const width = tiffImage.getWidth();
    const height = tiffImage.getHeight();
    console.log(width, height);

    const data = await tiffImage.readRasters({ pool: new GeoTIFF.Pool() });
    const [values] = data;

    const populationForX = [];
    for (let x = 0; x < width; x++) {
        let sum = 0;
        for (let y = 0; y < height; y++) {
            const idx = y * width + x;
            const population = values[idx];
            if (population > 0) {
                sum += population;
            }
        }
        console.log(x, sum);
        populationForX.push(sum);
    }

    const totalPopulation = populationForX.reduce((accum, c) => accum + c, 0);
    function hourOffset(utcHour, utcOffset) {
        let hour = utcHour + utcOffset;
        while (hour >= 24) hour -= 24;
        while (hour < 0) hour += 24;
        return hour;
    }
    function formatHour(hour) {
        return `${hour.toString().padStart(2)}:00`;
    }
    for (let utcHour = 0; utcHour < 24; utcHour++) {
        let numPopulationAsleep = 0;
        populationForX.forEach((v, i) => {
            const longitude = i / populationForX.length * 360 - 180;
            const utcOffset = longitude * 24 / 360;
            let hourAtLongitude = hourOffset(utcHour, utcOffset);
            const isAsleep = hourAtLongitude >= 22 || hourAtLongitude < 6;
            if (isAsleep) {
                numPopulationAsleep += v;
            }
        });
        const jstHour = hourOffset(utcHour, 9);
        console.log(formatHour(utcHour), formatHour(jstHour), numPopulationAsleep, numPopulationAsleep / totalPopulation);
    }
})();