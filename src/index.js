import GeoTIFF from 'geotiff';
import geoTz from 'geo-tz';
import moment from "moment-timezone";
import * as MathUtil from "./common/mathutil.js";

// Make sure you have this file. See README.
const gpwTifFile = "./data/gpw-v4-population-count_2020.tif";

(async () => {
    const tiffImage = await GeoTIFF.fromFile(gpwTifFile).then(tiff => tiff.getImage());

    const width = tiffImage.getWidth();
    const height = tiffImage.getHeight();
    const [geoWest, geoSouth, geoEast, geoNorth] = tiffImage.getBoundingBox();

    const data = await tiffImage.readRasters({ pool: new GeoTIFF.Pool() });
    const [values] = data;

    const populationForTimezone = {};
    for (let y = 0, idx = 0; y < height; y++) {
        const lat = Math.floor(MathUtil.map(y, 0, height, geoNorth, geoSouth));
        for (let x = 0; x < width; x++, idx++) {
            const population = values[idx];
            if (population <= 0) {
                continue;
            }
            const lng = Math.floor(MathUtil.map(x, 0, width, geoWest, geoEast));
            const timezone = geoTz(lat, lng);
            if (timezone.length === 0) {
                continue;
            }
            populationForTimezone[timezone[0]] =
                (populationForTimezone[timezone[0]] || 0) + population;
        }
    }
    console.log(populationForTimezone);

    const populationForUtcOffset = {};
    Object.entries(populationForTimezone)
        .forEach(([timezone, population]) => {
            const utcOffset = moment.tz(timezone).utcOffset();
            populationForUtcOffset[utcOffset] =
                (populationForUtcOffset[utcOffset] || 0) + population;
        });
    console.log(populationForUtcOffset);

    const totalPopulation =
        Object.values(populationForUtcOffset).reduce((accum, c) => accum + c, 0);
    function hourOffset(utcHour, utcOffset) {
        let hour = utcHour + utcOffset;
        while (hour >= 24) hour -= 24;
        while (hour < 0) hour += 24;
        return hour;
    }
    function formatHour(hour) {
        return `${hour.toString().padStart(2)}:00`;
    }
    console.log("UTC hour", "JST hour", "Num people asleep", "% of people asleep");
    for (let utcHour = 0; utcHour < 24; utcHour++) {
        let numPopulationAsleep = 0;
        Object.entries(populationForUtcOffset)
            .forEach(([utcOffset, v]) => {
                let hourAtLongitude = hourOffset(utcHour, utcOffset / 60);
                // Crude approximation: we assume people sleep between 22:00 and 6:00.
                const isAsleep = hourAtLongitude >= 22 || hourAtLongitude < 6;
                if (isAsleep) {
                    numPopulationAsleep += v;
                }
            });
        const jstHour = hourOffset(utcHour, 9);
        console.log(formatHour(utcHour), formatHour(jstHour), numPopulationAsleep, numPopulationAsleep / totalPopulation);
    }
})();