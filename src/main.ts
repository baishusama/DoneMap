import { donemap } from './donemap';
import { data } from './data';
console.log('[test] data ready:', data);

donemap(data, {
    WIDTH: 1200,
    HEIGHT: 700,
    TEXT_LINE_EXTRA_DISTANCE: 5
});
