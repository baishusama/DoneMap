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

const THEME_COLOR = 'hotpink';
const OTHER_COLOR = 'yellowgreen';
const BACKGROUND_COLOR = 'lavenderblush';
const PROPORTION_X = 0.5; // 横向比例系数
const MIN_STROKE_WIDTH = 10;
// const TEXT_LINE_DISTANCE = 1;

var margin = { top: 15, right: 30, bottom: 15, left: 30 },
    width = 1200 - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;

var hierarchyData = d3
    .hierarchy(data, function(d: { children: any[] }) {
        return d.children;
    })
    // 统计叶子节点的个数到 value
    .count()
    // 设置所有节点的完成度
    .eachAfter(function(d: {
        children: any[];
        _children: any[];
        data: {
            completion: number;
        };
    }) {
        if (d.data.completion === undefined) {
            if (d.children) {
                d.data.completion =
                    d.children
                        .map((node: any) => node.data.completion)
                        .reduce((a: number, b: number) => a + b) /
                    d.children.length;
            } else if (d._children) {
                d.data.completion =
                    d._children
                        .map((node: any) => node.data.completion)
                        .reduce((a: number, b: number) => a + b) /
                    d._children.length;
            } else {
                d.data.completion = 0;
            }
        }
    });
// .sum(function(d: { count: number; completion: number }) {
//     // return d.completion;
//     return d.count;
// });
// root.x0 = height / 2;
// root.y0 = 0;
console.log('[test] hierarchyData :', _.cloneDeep(hierarchyData));

// TODO:

var tree = d3
    .tree()
    .size([height, width])
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

/**
 * 一些关键变量
 */

const maxDepth = Math.max(
    ...nodes.map((node: { depth: number }) => node.depth)
);

const minX = Math.min(...nodes.map((node: { x: number }) => node.x));
const offsetX = minX - 20; // 考虑到标签的高度

// FIXME:
function isAsciiChar(char: string) {
    return char.charCodeAt(0) <= 127;
}
const maxLabelCharNum = Math.max(
    ...nodes.map((node: { data: { name: string } }) => {
        return [...node.data.name].reduce(
            (res, cur) => res + (isAsciiChar(cur) ? 1 : 2),
            0
        );
    })
);
const CHAR_LEN = 10;
const labelW = maxLabelCharNum * CHAR_LEN; // 标签的宽度
console.log('[test] labelW :', labelW);

/**
 * ImoNote: 新建 <svg> 和 <g> 放在哪一步比较好？。。
 */

var canvas = d3
    .select('body')
    .append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .style('background-color', BACKGROUND_COLOR);

// 确定了标签的宽度，才能确定最外层 g 的横向偏移
var g = canvas
    .append('g')
    .attr(
        'transform',
        'translate(' + (margin.left + labelW) + ',' + margin.top + ')'
    );

/**
 * 绘图相关的方法
 */

// 绘制贝塞尔曲线的方法
var Bézier_curve_generator = d3
    .linkHorizontal()
    .x(function(d: any) {
        return d.y * PROPORTION_X; // ImoNote: 横向缩短，注意一下所有的 `* 2`,`/ 2`
    })
    .y(function(d: any) {
        return d.x;
    });

// 根据完成度确定透明度的方法
function getOpacityByCompletion(completion: number): number | string {
    return Math.max(completion, 0.1);
}

// 根据完成度确定设置虚线的方法
function getStrokeDashArrByCompletion(completion: number): string {
    if (completion === 0) {
        return [3, 2, 3, 2].join(' ');
    }
}

g.append('g')
    .selectAll('path')
    .data(links)
    .enter()
    .append('path')
    .attr('d', function(d: {
        source: { x: number; y: number; depth: number };
        target: { x: number; y: number };
    }) {
        // ImoNote: 因为贝塞尔曲线成了一个比例系数，所以这里要除掉一个比例系数，保证最后 x 中计算出的偏移量是 labelW * d.source.depth
        const offsetY = (labelW * d.source.depth) / PROPORTION_X;
        const source = { x: d.source.x - offsetX, y: d.source.y + offsetY };
        const target = { x: d.target.x - offsetX, y: d.target.y + offsetY };
        return Bézier_curve_generator({ source, target });
    })
    .attr('fill', 'none')
    .attr('stroke', THEME_COLOR)
    // 线条粗细：保证最深处也就是最细处为 1 + MIN_STROKE_WIDTH
    .attr('stroke-width', function(d: { target: { depth: number } }) {
        return maxDepth - d.target.depth + MIN_STROKE_WIDTH;
        // return 3;
    })
    // 完成度效果 - 透明度
    .attr('opacity', function(d: {
        target: {
            data: { completion: number };
        };
    }) {
        return getOpacityByCompletion(d.target.data.completion);
    })
    // 完成度效果 - 虚线
    .attr('stroke-dasharray', function(d: {
        target: {
            data: { completion: number };
        };
    }) {
        return getStrokeDashArrByCompletion(d.target.data.completion);
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
            `translate(${y * PROPORTION_X + labelW * depth},${x - offsetX})`
    )
    // 完成度效果 - 透明度
    .attr('opacity', function(d: { data: { completion: number } }) {
        return getOpacityByCompletion(d.data.completion);
    });

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
    .attr('stroke', OTHER_COLOR) // TODO: test to mod
    .attr('stroke-width', function(d: { depth: number }) {
        return maxDepth - d.depth + MIN_STROKE_WIDTH;
    })
    // 完成度效果 - 虚线
    .attr('stroke-dasharray', function(d: { data: { completion: number } }) {
        return getStrokeDashArrByCompletion(d.data.completion);
    });

gs.append('circle')
    .attr('r', function(d: { depth: number }) {
        return maxDepth - d.depth + MIN_STROKE_WIDTH;
    })
    .attr('fill', function(d: { children: any[] }) {
        return d.children ? 'white' : THEME_COLOR;
    })
    .attr('stroke', THEME_COLOR)
    .attr('stroke-width', 1);

// const circleSize = 7; // 6 + 1;
// const distance = 1;
// const offset = circleSize + distance;

// 文字
gs.append('text')
    .attr('x', function(d: { depth: number }) {
        // // TODO: 使用更好的计算字符串显示长度的方式
        // const charCount = d.data.name.length;
        // return offset - labelW;
        return -labelW;
    })
    .attr('y', function(d: { depth: number }) {
        const circleRadius = maxDepth - d.depth + MIN_STROKE_WIDTH;
        /**
         * ImoNote: 这里文字到下划线的距离可以用几种策略：
         * - 零距离：-circleRadius / 2
         * - 绝对距离
         * - 相对（下划线粗细）距离 [x] <- 暂时采用
         * - 相对（下划线粗细）距离 + 一定绝对距离
         * - ...
         */
        return -circleRadius;
    })
    // .attr('dy', 10)
    .text(function(d: any) {
        return d.data.name;
    });
