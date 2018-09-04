// import * as _ from 'lodash';
// import * as d3 from 'd3';
// import { tree } from 'd3-hierarchy';
// import { select, selectAll } from 'd3-selection';
import { sayHello } from './greet';
import { data } from './data';

declare const d3: any;
declare const _: any;

// console.log('[test] d3 ready:', d3);
// console.log('[test] lodash ready:', _);
console.log('[test] data ready:', data);

/* text demo 1 */
function showHello(divId: string, name: string) {
    const el = document.getElementById(divId);
    el.innerText = sayHello(name);
}
showHello('greeting', 'TypeScript & D3');

/* text demo 2 */
// d3.select('body')
//     .selectAll('p')
//     .data([2, 4])
//     .enter()
//     .append('p')
//     .text(function(d: string | number) {
//         return 'I’m number ' + d + '!';
//     });

/**
 * setup svg
 */

var margin = { top: 20, right: 120, bottom: 20, left: 120 },
    width = 800 - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;

var canvas = d3
    .select('body')
    .append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .style('background-color', 'lavenderblush');

/**
 * tree demo
 * from https://blog.csdn.net/qq_34414916/article/details/80038989
 */

var g = canvas
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var hierarchyData = d3.hierarchy(data, function(d: { children: any[] }) {
    return d.children;
});
// .sum(function(d: { value: number }) {
//     return d.value;
// });
// root.x0 = height / 2;
// root.y0 = 0;
console.log('[test] hierarchyData :', _.cloneDeep(hierarchyData));

// TODO:

var tree = d3
    .tree()
    // .size([height, width])
    .size([width, height])
    .separation(function(a: any, b: any) {
        return (a.parent == b.parent ? 1 : 2) / a.depth;
    });
// console.log('[test] d3.tree :', d3.tree);
// console.log('[test] tree', tree);
// console.log('[test] keys of tree', Object.keys(tree));

var treeData = tree(hierarchyData);
console.log('[test] treeData :', _.cloneDeep(treeData));

var nodes = treeData.descendants();
var links = treeData.links();
console.log('[test] nodes :', nodes);
console.log('[test] links :', links);

var Bézier_curve_generator = d3
    .linkHorizontal()
    // ImoNote: ？？？
    .x(function(d: any) {
        return d.y;
    })
    .y(function(d: any) {
        return d.x;
    });

g.append('g')
    .selectAll('path')
    .data(links)
    .enter()
    .append('path')
    .attr('d', function(d: {
        source: { x: number; y: number };
        target: { x: number; y: number };
    }) {
        const source = { x: d.source.x, y: d.source.y };
        const target = { x: d.target.x, y: d.target.y };
        return Bézier_curve_generator({ source, target });
    })
    .attr('fill', 'none')
    .attr('stroke', 'hotpink')
    .attr('stroke-width', 1);

var gs = g
    .append('g')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr(
        'transform',
        ({ x, y }: { x: number; y: number }) => `translate(${y},${x})`
    );

//绘制节点
gs.append('circle')
    .attr('r', 6)
    .attr('fill', 'white')
    .attr('stroke', 'blue')
    .attr('stroke-width', 1);

const circleSize = 7; // 6 + 1;
const distance = 1;
const offset = circleSize + distance;

//文字
gs.append('text')
    .attr('x', function(d: any) {
        // FIXME: 使用更好的计算字符串显示长度的方式
        const charCount = d.data.name.length;
        return d.children ? -(offset + charCount * 16) : offset;
    })
    .attr('y', 5)
    // .attr('y', -5)
    // .attr('dy', 10)
    .text(function(d: any) {
        return d.data.name;
    });

/* line demo */

// var lineData = {
//     source: {
//         x: 20,
//         y: 10
//     },
//     target: {
//         x: 280,
//         y: 100
//     }
// };

// var link = d3
//     .linkHorizontal()
//     .x(function(d: any) {
//         return d.x;
//     })
//     .y(function(d: any) {
//         return d.y;
//     });

// canvas
//     .append('path')
//     .attr('d', link(lineData))
//     // ImoNote: can use either .attr or .style
//     .style('fill', 'none')
//     .style('stroke', 'black')
//     .style('stroke-width', '4px');

/* unfinished tree demo */

// d3.json('data.json').then((data: any) => {
//     console.log('[test] json, data:', data);
//     root = data;
//     root.x0 = height / 2;
//     root.y0 = 0;
//     function collapse(d: any) {
//         if (d.children) {
//             d._children = d.children;
//             d._children.forEach(collapse);
//             d.children = null;
//         }
//     }
//     root.children.forEach(collapse);
//     // function update(){}
//     // update(root);
// });
