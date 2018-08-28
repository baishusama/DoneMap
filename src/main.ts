import { scaleLinear } from 'd3-scale';
import { sayHello } from './greet';

function showHello(divId: string, name: string) {
    const el = document.getElementById(divId);
    el.innerText = sayHello(name);
}

showHello('greeting', 'TypeScript');
