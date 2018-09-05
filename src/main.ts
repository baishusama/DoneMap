// import { sayHello } from './greet';
import { data } from './data';

declare const d3: any;
declare const _: any;

// console.log('[test] d3 ready:', d3);
// console.log('[test] lodash ready:', _);
console.log('[test] data ready:', data);

/**
 * ImoNote:TODO: 弄懂
 * - 画布的大小 & 边距大小 & 图像偏移 ?
 * - x/y 水平还是纵向 ?
 * - ...
 */

var margin = { top: 10, right: 90, bottom: 10, left: 90 },
    width = 800 - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;

var canvas = d3
    .select('body')
    .append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .style('background-color', 'lavenderblush');

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
    .x(function(d: any) {
        return d.y / 2; // ImoNote: 横向缩短，注意一下所有的 `* 2`,`/ 2`
    })
    .y(function(d: any) {
        return d.x;
    });

const maxDepth = Math.max(
    ...nodes.map((node: { depth: number }) => node.depth)
);
const minX = Math.min(...nodes.map((node: { x: number }) => node.x));
const offsetX = minX - 20; // 考虑到标签的高度
const labelW = 80; // 标签的宽度

g.append('g')
    .selectAll('path')
    .data(links)
    .enter()
    .append('path')
    .attr('d', function(d: {
        source: { x: number; y: number; depth: number };
        target: { x: number; y: number };
    }) {
        const depth = d.source.depth;
        const offsetY = labelW * depth * 2; // 和贝塞尔曲线横向缩短一半对应
        const source = { x: d.source.x - offsetX, y: d.source.y + offsetY };
        const target = { x: d.target.x - offsetX, y: d.target.y + offsetY };
        return Bézier_curve_generator({ source, target });
    })
    .attr('fill', 'none')
    .attr('stroke', 'hotpink')
    .attr('stroke-width', function(d: {
        source: { x: number; y: number; depth: number };
        target: { x: number; y: number };
    }) {
        return maxDepth - d.source.depth;
    });

var gs = g
    .append('g')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr(
        'transform',
        ({ x, y, depth }: { x: number; y: number; depth: number }) =>
            `translate(${(y + labelW * depth * 2) / 2},${x - offsetX})`
    );

// TODO: test to del
var test = [];
for (var key in gs) {
    test.push(key);
}
console.log('[test] keys of gs :', test);

// 绘制节点
gs.append('line')
    .attr('x1', -labelW)
    .attr('x2', 0)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('fill', 'none')
    .attr('stroke', 'hotpink')
    .attr('stroke-width', function(d: { x: number; y: number; depth: number }) {
        return maxDepth - d.depth + 1;
    });

gs.append('circle')
    .attr('r', 6)
    .attr('fill', 'white')
    .attr('stroke', 'blue')
    .attr('stroke-width', 1);

const circleSize = 7; // 6 + 1;
const distance = 1;
const offset = circleSize + distance;

// 文字
gs.append('text')
    .attr('x', function(d: any) {
        // // TODO: 使用更好的计算字符串显示长度的方式
        // const charCount = d.data.name.length;
        return offset - labelW;
    })
    // .attr('y', 5)
    .attr('y', -5)
    // .attr('dy', 10)
    .text(function(d: any) {
        return d.data.name;
    });
