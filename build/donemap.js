(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// console.log('[test] d3 ready:', d3);
// console.log('[test] lodash ready:', _);
/**
 * ImoNote:TODO: 弄懂
 * - 画布的大小 & 边距大小 & 图像偏移 ?
 * - x/y 水平还是纵向 ?
 * - ...
 */
const DEFAULT_OPTIONS = {
    THEME_COLOR: 'hotpink',
    BACKGROUND_COLOR: 'lavenderblush',
    WIDTH: 960,
    HEIGHT: 600,
    PROPORTION_X: 0.3,
    MIN_STROKE_WIDTH: 1,
    TEXT_LINE_EXTRA_DISTANCE: 8
};
function donemap(data, options) {
    const { THEME_COLOR, BACKGROUND_COLOR, WIDTH, // SVG 宽度
    HEIGHT, // SVG 高度
    PROPORTION_X, // 横向比例系数
    MIN_STROKE_WIDTH, TEXT_LINE_EXTRA_DISTANCE } = Object.assign({}, DEFAULT_OPTIONS, options);
    var margin = { top: 20, right: 30, bottom: 20, left: 30 }, width = WIDTH - margin.right - margin.left, height = HEIGHT - margin.top - margin.bottom;
    var hierarchyData = d3
        .hierarchy(data, function (d) {
        return d.children;
    })
        // 统计叶子节点的个数到 value
        .count()
        // 设置所有节点的完成度
        .eachAfter(function (d) {
        if (d.data.completion === undefined) {
            if (d.children) {
                d.data.completion =
                    d.children
                        .map((node) => node.data.completion)
                        .reduce((a, b) => a + b) /
                        d.children.length;
            }
            else if (d._children) {
                d.data.completion =
                    d._children
                        .map((node) => node.data.completion)
                        .reduce((a, b) => a + b) /
                        d._children.length;
            }
            else {
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
        .separation(function (a, b) {
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
    const maxDepth = Math.max(...nodes.map((node) => node.depth));
    const minX = Math.min(...nodes.map((node) => node.x));
    const offsetX = minX - 20; // 考虑到标签的高度
    // FIXME:
    function isAsciiChar(char) {
        return char.charCodeAt(0) <= 127;
    }
    const maxLabelCharNum = Math.max(...nodes.map((node) => {
        return [...node.data.name].reduce((res, cur) => 
        // TODO: 调整／计算比例
        res + (isAsciiChar(cur) ? (HEIGHT / WIDTH) * 1.3 : 2), 0);
    }));
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
        .attr('transform', 'translate(' + (margin.left + labelW) + ',' + margin.top + ')');
    /**
     * 绘图相关的方法
     */
    // 绘制贝塞尔曲线的方法
    var Bézier_curve_generator = d3
        .linkHorizontal()
        .x(function (d) {
        return d.y * PROPORTION_X; // ImoNote: 横向缩短，注意一下所有的 `* 2`,`/ 2`
    })
        .y(function (d) {
        return d.x;
    });
    // 根据完成度确定透明度的方法
    function getOpacityByCompletion(completion) {
        return Math.max(completion, 0.1);
    }
    // 根据完成度确定设置虚线的方法
    function getStrokeDashArrByCompletion(completion) {
        if (completion === 0) {
            return [3, 2, 3, 2].join(' ');
        }
    }
    g.append('g')
        .selectAll('path')
        .data(links)
        .enter()
        .append('path')
        .attr('d', function (d) {
        // ImoNote: 因为贝塞尔曲线成了一个比例系数，所以这里要除掉一个比例系数，保证最后 x 中计算出的偏移量是 labelW * d.source.depth
        const offsetY = (labelW * d.source.depth) / PROPORTION_X;
        const source = { x: d.source.x - offsetX, y: d.source.y + offsetY };
        const target = { x: d.target.x - offsetX, y: d.target.y + offsetY };
        return Bézier_curve_generator({ source, target });
    })
        .attr('fill', 'none')
        .attr('stroke', THEME_COLOR)
        // 线条粗细：保证最深处也就是最细处为 1 + MIN_STROKE_WIDTH
        .attr('stroke-width', function (d) {
        return maxDepth - d.target.depth + MIN_STROKE_WIDTH;
        // return 3;
    })
        // 完成度效果 - 透明度
        .attr('opacity', function (d) {
        return getOpacityByCompletion(d.target.data.completion);
    })
        // 完成度效果 - 虚线
        .attr('stroke-dasharray', function (d) {
        return getStrokeDashArrByCompletion(d.target.data.completion);
    });
    var gs = g
        .append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('transform', ({ x, y, depth }) => `translate(${y * PROPORTION_X + labelW * depth},${x - offsetX})`)
        // 完成度效果 - 透明度
        .attr('opacity', function (d) {
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
        .attr('stroke', THEME_COLOR) // TODO: test to mod
        .attr('stroke-width', function (d) {
        return maxDepth - d.depth + MIN_STROKE_WIDTH;
    })
        // 完成度效果 - 虚线
        .attr('stroke-dasharray', function (d) {
        return getStrokeDashArrByCompletion(d.data.completion);
    });
    gs.append('circle')
        .attr('r', function (d) {
        return maxDepth - d.depth + MIN_STROKE_WIDTH;
    })
        .attr('fill', function (d) {
        return d.children ? 'white' : THEME_COLOR;
    })
        .attr('stroke', THEME_COLOR)
        .attr('stroke-width', 1);
    // 文字
    gs.append('text')
        .attr('x', function (d) {
        // // TODO: 使用更好的计算字符串显示长度的方式
        // const charCount = d.data.name.length;
        return -labelW;
    })
        .attr('y', function (d) {
        const circleRadius = maxDepth - d.depth + MIN_STROKE_WIDTH;
        /**
         * ImoNote: 这里文字到下划线的距离可以用几种策略：
         * - 零距离：-circleRadius / 2
         * - 绝对距离
         * - 相对（下划线粗细）距离 [x] <- 暂时采用
         * - 相对（下划线粗细）距离 + 一定绝对距离
         * - ...
         */
        return -circleRadius - TEXT_LINE_EXTRA_DISTANCE;
    })
        // .attr('dy', 10)
        .text(function (d) {
        return d.data.name + (d.data.completion === 1 ? ' ☑' : '');
    });
}
exports.donemap = donemap;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZG9uZW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDTUEsdUNBQXVDO0FBQ3ZDLDBDQUEwQztBQUUxQzs7Ozs7R0FLRztBQUVILE1BQU0sZUFBZSxHQUFHO0lBQ3BCLFdBQVcsRUFBRSxTQUFTO0lBQ3RCLGdCQUFnQixFQUFFLGVBQWU7SUFDakMsS0FBSyxFQUFFLEdBQUc7SUFDVixNQUFNLEVBQUUsR0FBRztJQUNYLFlBQVksRUFBRSxHQUFHO0lBQ2pCLGdCQUFnQixFQUFFLENBQUM7SUFDbkIsd0JBQXdCLEVBQUUsQ0FBQztDQUM5QixDQUFDO0FBRUYsU0FBUyxPQUFPLENBQ1osSUFBYyxFQUNkLE9BUUM7SUFFRCxNQUFNLEVBQ0YsV0FBVyxFQUNYLGdCQUFnQixFQUNoQixLQUFLLEVBQUUsU0FBUztJQUNoQixNQUFNLEVBQUUsU0FBUztJQUNqQixZQUFZLEVBQUUsU0FBUztJQUN2QixnQkFBZ0IsRUFDaEIsd0JBQXdCLEVBQzNCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRWhELElBQUksTUFBTSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUNyRCxLQUFLLEdBQUcsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksRUFDMUMsTUFBTSxHQUFHLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFFakQsSUFBSSxhQUFhLEdBQUcsRUFBRTtTQUNqQixTQUFTLENBQUMsSUFBSSxFQUFFLFVBQVMsQ0FBc0I7UUFDNUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDO0lBQ3RCLENBQUMsQ0FBQztR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SUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELENBQUMsQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUVRLDBCQUFPIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy8gaW1wb3J0IHsgc2F5SGVsbG8gfSBmcm9tICcuL2dyZWV0JztcbmltcG9ydCB7IERvbmVOb2RlIH0gZnJvbSAnLi9pbnRlcmZhY2VzL2RvbmVtYXAuaW50ZXJmYWNlJztcblxuZGVjbGFyZSBjb25zdCBkMzogYW55O1xuZGVjbGFyZSBjb25zdCBfOiBhbnk7XG5cbi8vIGNvbnNvbGUubG9nKCdbdGVzdF0gZDMgcmVhZHk6JywgZDMpO1xuLy8gY29uc29sZS5sb2coJ1t0ZXN0XSBsb2Rhc2ggcmVhZHk6JywgXyk7XG5cbi8qKlxuICogSW1vTm90ZTpUT0RPOiDlvITmh4JcbiAqIC0g55S75biD55qE5aSn5bCPICYg6L656Led5aSn5bCPICYg5Zu+5YOP5YGP56e7ID9cbiAqIC0geC95IOawtOW5s+i/mOaYr+e6teWQkSA/XG4gKiAtIC4uLlxuICovXG5cbmNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBUSEVNRV9DT0xPUjogJ2hvdHBpbmsnLFxuICAgIEJBQ0tHUk9VTkRfQ09MT1I6ICdsYXZlbmRlcmJsdXNoJyxcbiAgICBXSURUSDogOTYwLFxuICAgIEhFSUdIVDogNjAwLFxuICAgIFBST1BPUlRJT05fWDogMC4zLCAvLyDmqKrlkJHmr5Tkvovns7vmlbBcbiAgICBNSU5fU1RST0tFX1dJRFRIOiAxLFxuICAgIFRFWFRfTElORV9FWFRSQV9ESVNUQU5DRTogOFxufTtcblxuZnVuY3Rpb24gZG9uZW1hcChcbiAgICBkYXRhOiBEb25lTm9kZSxcbiAgICBvcHRpb25zPzoge1xuICAgICAgICBUSEVNRV9DT0xPUj86IHN0cmluZztcbiAgICAgICAgQkFDS0dST1VORF9DT0xPUj86IHN0cmluZztcbiAgICAgICAgV0lEVEg/OiBudW1iZXI7XG4gICAgICAgIEhFSUdIVD86IG51bWJlcjtcbiAgICAgICAgUFJPUE9SVElPTl9YPzogbnVtYmVyO1xuICAgICAgICBNSU5fU1RST0tFX1dJRFRIPzogbnVtYmVyO1xuICAgICAgICBURVhUX0xJTkVfRVhUUkFfRElTVEFOQ0U/OiBudW1iZXI7XG4gICAgfVxuKSB7XG4gICAgY29uc3Qge1xuICAgICAgICBUSEVNRV9DT0xPUixcbiAgICAgICAgQkFDS0dST1VORF9DT0xPUixcbiAgICAgICAgV0lEVEgsIC8vIFNWRyDlrr3luqZcbiAgICAgICAgSEVJR0hULCAvLyBTVkcg6auY5bqmXG4gICAgICAgIFBST1BPUlRJT05fWCwgLy8g5qiq5ZCR5q+U5L6L57O75pWwXG4gICAgICAgIE1JTl9TVFJPS0VfV0lEVEgsXG4gICAgICAgIFRFWFRfTElORV9FWFRSQV9ESVNUQU5DRVxuICAgIH0gPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX09QVElPTlMsIG9wdGlvbnMpO1xuXG4gICAgdmFyIG1hcmdpbiA9IHsgdG9wOiAyMCwgcmlnaHQ6IDMwLCBib3R0b206IDIwLCBsZWZ0OiAzMCB9LFxuICAgICAgICB3aWR0aCA9IFdJRFRIIC0gbWFyZ2luLnJpZ2h0IC0gbWFyZ2luLmxlZnQsXG4gICAgICAgIGhlaWdodCA9IEhFSUdIVCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xuXG4gICAgdmFyIGhpZXJhcmNoeURhdGEgPSBkM1xuICAgICAgICAuaGllcmFyY2h5KGRhdGEsIGZ1bmN0aW9uKGQ6IHsgY2hpbGRyZW46IGFueVtdIH0pIHtcbiAgICAgICAgICAgIHJldHVybiBkLmNoaWxkcmVuO1xuICAgICAgICB9KVxuICAgICAgICAvLyDnu5/orqHlj7blrZDoioLngrnnmoTkuKrmlbDliLAgdmFsdWVcbiAgICAgICAgLmNvdW50KClcbiAgICAgICAgLy8g6K6+572u5omA5pyJ6IqC54K555qE5a6M5oiQ5bqmXG4gICAgICAgIC5lYWNoQWZ0ZXIoZnVuY3Rpb24oZDoge1xuICAgICAgICAgICAgY2hpbGRyZW46IGFueVtdO1xuICAgICAgICAgICAgX2NoaWxkcmVuOiBhbnlbXTtcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBjb21wbGV0aW9uOiBudW1iZXI7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KSB7XG4gICAgICAgICAgICBpZiAoZC5kYXRhLmNvbXBsZXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGlmIChkLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGQuZGF0YS5jb21wbGV0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgICAgIGQuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKChub2RlOiBhbnkpID0+IG5vZGUuZGF0YS5jb21wbGV0aW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZWR1Y2UoKGE6IG51bWJlciwgYjogbnVtYmVyKSA9PiBhICsgYikgL1xuICAgICAgICAgICAgICAgICAgICAgICAgZC5jaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkLl9jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBkLmRhdGEuY29tcGxldGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICAgICBkLl9jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKG5vZGU6IGFueSkgPT4gbm9kZS5kYXRhLmNvbXBsZXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlZHVjZSgoYTogbnVtYmVyLCBiOiBudW1iZXIpID0+IGEgKyBiKSAvXG4gICAgICAgICAgICAgICAgICAgICAgICBkLl9jaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZC5kYXRhLmNvbXBsZXRpb24gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgLy8gLnN1bShmdW5jdGlvbihkOiB7IGNvdW50OiBudW1iZXI7IGNvbXBsZXRpb246IG51bWJlciB9KSB7XG4gICAgLy8gICAgIC8vIHJldHVybiBkLmNvbXBsZXRpb247XG4gICAgLy8gICAgIHJldHVybiBkLmNvdW50O1xuICAgIC8vIH0pO1xuICAgIC8vIHJvb3QueDAgPSBoZWlnaHQgLyAyO1xuICAgIC8vIHJvb3QueTAgPSAwO1xuICAgIGNvbnNvbGUubG9nKCdbdGVzdF0gaGllcmFyY2h5RGF0YSA6JywgXy5jbG9uZURlZXAoaGllcmFyY2h5RGF0YSkpO1xuXG4gICAgLy8gVE9ETzpcblxuICAgIHZhciB0cmVlID0gZDNcbiAgICAgICAgLnRyZWUoKVxuICAgICAgICAuc2l6ZShbaGVpZ2h0LCB3aWR0aF0pXG4gICAgICAgIC5zZXBhcmF0aW9uKGZ1bmN0aW9uKGE6IGFueSwgYjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gKGEucGFyZW50ID09IGIucGFyZW50ID8gMSA6IDIpIC8gYS5kZXB0aDtcbiAgICAgICAgfSk7XG4gICAgLy8gY29uc29sZS5sb2coJ1t0ZXN0XSBkMy50cmVlIDonLCBkMy50cmVlKTtcbiAgICAvLyBjb25zb2xlLmxvZygnW3Rlc3RdIHRyZWUnLCB0cmVlKTtcbiAgICAvLyBjb25zb2xlLmxvZygnW3Rlc3RdIGtleXMgb2YgdHJlZScsIE9iamVjdC5rZXlzKHRyZWUpKTtcblxuICAgIHZhciB0cmVlRGF0YSA9IHRyZWUoaGllcmFyY2h5RGF0YSk7XG4gICAgY29uc29sZS5sb2coJ1t0ZXN0XSB0cmVlRGF0YSA6JywgXy5jbG9uZURlZXAodHJlZURhdGEpKTtcblxuICAgIHZhciBub2RlcyA9IHRyZWVEYXRhLmRlc2NlbmRhbnRzKCk7XG4gICAgdmFyIGxpbmtzID0gdHJlZURhdGEubGlua3MoKTtcbiAgICBjb25zb2xlLmxvZygnW3Rlc3RdIG5vZGVzIDonLCBub2Rlcyk7XG4gICAgY29uc29sZS5sb2coJ1t0ZXN0XSBsaW5rcyA6JywgbGlua3MpO1xuXG4gICAgLyoqXG4gICAgICog5LiA5Lqb5YWz6ZSu5Y+Y6YePXG4gICAgICovXG5cbiAgICBjb25zdCBtYXhEZXB0aCA9IE1hdGgubWF4KFxuICAgICAgICAuLi5ub2Rlcy5tYXAoKG5vZGU6IHsgZGVwdGg6IG51bWJlciB9KSA9PiBub2RlLmRlcHRoKVxuICAgICk7XG5cbiAgICBjb25zdCBtaW5YID0gTWF0aC5taW4oLi4ubm9kZXMubWFwKChub2RlOiB7IHg6IG51bWJlciB9KSA9PiBub2RlLngpKTtcbiAgICBjb25zdCBvZmZzZXRYID0gbWluWCAtIDIwOyAvLyDogIPomZHliLDmoIfnrb7nmoTpq5jluqZcblxuICAgIC8vIEZJWE1FOlxuICAgIGZ1bmN0aW9uIGlzQXNjaWlDaGFyKGNoYXI6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gY2hhci5jaGFyQ29kZUF0KDApIDw9IDEyNztcbiAgICB9XG4gICAgY29uc3QgbWF4TGFiZWxDaGFyTnVtID0gTWF0aC5tYXgoXG4gICAgICAgIC4uLm5vZGVzLm1hcCgobm9kZTogeyBkYXRhOiB7IG5hbWU6IHN0cmluZyB9IH0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBbLi4ubm9kZS5kYXRhLm5hbWVdLnJlZHVjZShcbiAgICAgICAgICAgICAgICAocmVzLCBjdXIpID0+XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IOiwg+aVtO+8j+iuoeeul+avlOS+i1xuICAgICAgICAgICAgICAgICAgICByZXMgKyAoaXNBc2NpaUNoYXIoY3VyKSA/IChIRUlHSFQgLyBXSURUSCkgKiAxLjMgOiAyKSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICk7XG4gICAgY29uc3QgQ0hBUl9MRU4gPSAxMDtcbiAgICBjb25zdCBsYWJlbFcgPSBtYXhMYWJlbENoYXJOdW0gKiBDSEFSX0xFTjsgLy8g5qCH562+55qE5a695bqmXG4gICAgY29uc29sZS5sb2coJ1t0ZXN0XSBsYWJlbFcgOicsIGxhYmVsVyk7XG5cbiAgICAvKipcbiAgICAgKiBJbW9Ob3RlOiDmlrDlu7ogPHN2Zz4g5ZKMIDxnPiDmlL7lnKjlk6rkuIDmraXmr5TovoPlpb3vvJ/jgILjgIJcbiAgICAgKi9cblxuICAgIHZhciBjYW52YXMgPSBkM1xuICAgICAgICAuc2VsZWN0KCdib2R5JylcbiAgICAgICAgLmFwcGVuZCgnc3ZnJylcbiAgICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGggKyBtYXJnaW4ucmlnaHQgKyBtYXJnaW4ubGVmdClcbiAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgICAuc3R5bGUoJ2JhY2tncm91bmQtY29sb3InLCBCQUNLR1JPVU5EX0NPTE9SKTtcblxuICAgIC8vIOehruWumuS6huagh+etvueahOWuveW6pu+8jOaJjeiDveehruWumuacgOWkluWxgiBnIOeahOaoquWQkeWBj+enu1xuICAgIHZhciBnID0gY2FudmFzXG4gICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cihcbiAgICAgICAgICAgICd0cmFuc2Zvcm0nLFxuICAgICAgICAgICAgJ3RyYW5zbGF0ZSgnICsgKG1hcmdpbi5sZWZ0ICsgbGFiZWxXKSArICcsJyArIG1hcmdpbi50b3AgKyAnKSdcbiAgICAgICAgKTtcblxuICAgIC8qKlxuICAgICAqIOe7mOWbvuebuOWFs+eahOaWueazlVxuICAgICAqL1xuXG4gICAgLy8g57uY5Yi26LSd5aGe5bCU5puy57q/55qE5pa55rOVXG4gICAgdmFyIELDqXppZXJfY3VydmVfZ2VuZXJhdG9yID0gZDNcbiAgICAgICAgLmxpbmtIb3Jpem9udGFsKClcbiAgICAgICAgLngoZnVuY3Rpb24oZDogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gZC55ICogUFJPUE9SVElPTl9YOyAvLyBJbW9Ob3RlOiDmqKrlkJHnvKnnn63vvIzms6jmhI/kuIDkuIvmiYDmnInnmoQgYCogMmAsYC8gMmBcbiAgICAgICAgfSlcbiAgICAgICAgLnkoZnVuY3Rpb24oZDogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gZC54O1xuICAgICAgICB9KTtcblxuICAgIC8vIOagueaNruWujOaIkOW6puehruWumumAj+aYjuW6pueahOaWueazlVxuICAgIGZ1bmN0aW9uIGdldE9wYWNpdHlCeUNvbXBsZXRpb24oY29tcGxldGlvbjogbnVtYmVyKTogbnVtYmVyIHwgc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KGNvbXBsZXRpb24sIDAuMSk7XG4gICAgfVxuXG4gICAgLy8g5qC55o2u5a6M5oiQ5bqm56Gu5a6a6K6+572u6Jma57q/55qE5pa55rOVXG4gICAgZnVuY3Rpb24gZ2V0U3Ryb2tlRGFzaEFyckJ5Q29tcGxldGlvbihjb21wbGV0aW9uOiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgICBpZiAoY29tcGxldGlvbiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFszLCAyLCAzLCAyXS5qb2luKCcgJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnLmFwcGVuZCgnZycpXG4gICAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAuZGF0YShsaW5rcylcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdkJywgZnVuY3Rpb24oZDoge1xuICAgICAgICAgICAgc291cmNlOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyBkZXB0aDogbnVtYmVyIH07XG4gICAgICAgICAgICB0YXJnZXQ6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfTtcbiAgICAgICAgfSkge1xuICAgICAgICAgICAgLy8gSW1vTm90ZTog5Zug5Li66LSd5aGe5bCU5puy57q/5oiQ5LqG5LiA5Liq5q+U5L6L57O75pWw77yM5omA5Lul6L+Z6YeM6KaB6Zmk5o6J5LiA5Liq5q+U5L6L57O75pWw77yM5L+d6K+B5pyA5ZCOIHgg5Lit6K6h566X5Ye655qE5YGP56e76YeP5pivIGxhYmVsVyAqIGQuc291cmNlLmRlcHRoXG4gICAgICAgICAgICBjb25zdCBvZmZzZXRZID0gKGxhYmVsVyAqIGQuc291cmNlLmRlcHRoKSAvIFBST1BPUlRJT05fWDtcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IHsgeDogZC5zb3VyY2UueCAtIG9mZnNldFgsIHk6IGQuc291cmNlLnkgKyBvZmZzZXRZIH07XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSB7IHg6IGQudGFyZ2V0LnggLSBvZmZzZXRYLCB5OiBkLnRhcmdldC55ICsgb2Zmc2V0WSB9O1xuICAgICAgICAgICAgcmV0dXJuIELDqXppZXJfY3VydmVfZ2VuZXJhdG9yKHsgc291cmNlLCB0YXJnZXQgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCdmaWxsJywgJ25vbmUnKVxuICAgICAgICAuYXR0cignc3Ryb2tlJywgVEhFTUVfQ09MT1IpXG4gICAgICAgIC8vIOe6v+adoeeyl+e7hu+8muS/neivgeacgOa3seWkhOS5n+WwseaYr+acgOe7huWkhOS4uiAxICsgTUlOX1NUUk9LRV9XSURUSFxuICAgICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgZnVuY3Rpb24oZDogeyB0YXJnZXQ6IHsgZGVwdGg6IG51bWJlciB9IH0pIHtcbiAgICAgICAgICAgIHJldHVybiBtYXhEZXB0aCAtIGQudGFyZ2V0LmRlcHRoICsgTUlOX1NUUk9LRV9XSURUSDtcbiAgICAgICAgICAgIC8vIHJldHVybiAzO1xuICAgICAgICB9KVxuICAgICAgICAvLyDlrozmiJDluqbmlYjmnpwgLSDpgI/mmI7luqZcbiAgICAgICAgLmF0dHIoJ29wYWNpdHknLCBmdW5jdGlvbihkOiB7XG4gICAgICAgICAgICB0YXJnZXQ6IHtcbiAgICAgICAgICAgICAgICBkYXRhOiB7IGNvbXBsZXRpb246IG51bWJlciB9O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkge1xuICAgICAgICAgICAgcmV0dXJuIGdldE9wYWNpdHlCeUNvbXBsZXRpb24oZC50YXJnZXQuZGF0YS5jb21wbGV0aW9uKTtcbiAgICAgICAgfSlcbiAgICAgICAgLy8g5a6M5oiQ5bqm5pWI5p6cIC0g6Jma57q/XG4gICAgICAgIC5hdHRyKCdzdHJva2UtZGFzaGFycmF5JywgZnVuY3Rpb24oZDoge1xuICAgICAgICAgICAgdGFyZ2V0OiB7XG4gICAgICAgICAgICAgICAgZGF0YTogeyBjb21wbGV0aW9uOiBudW1iZXIgfTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRTdHJva2VEYXNoQXJyQnlDb21wbGV0aW9uKGQudGFyZ2V0LmRhdGEuY29tcGxldGlvbik7XG4gICAgICAgIH0pO1xuXG4gICAgdmFyIGdzID0gZ1xuICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgLnNlbGVjdEFsbCgnZycpXG4gICAgICAgIC5kYXRhKG5vZGVzKVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoXG4gICAgICAgICAgICAndHJhbnNmb3JtJyxcbiAgICAgICAgICAgICh7IHgsIHksIGRlcHRoIH06IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IGRlcHRoOiBudW1iZXIgfSkgPT5cbiAgICAgICAgICAgICAgICBgdHJhbnNsYXRlKCR7eSAqIFBST1BPUlRJT05fWCArIGxhYmVsVyAqIGRlcHRofSwke3ggLSBvZmZzZXRYfSlgXG4gICAgICAgIClcbiAgICAgICAgLy8g5a6M5oiQ5bqm5pWI5p6cIC0g6YCP5piO5bqmXG4gICAgICAgIC5hdHRyKCdvcGFjaXR5JywgZnVuY3Rpb24oZDogeyBkYXRhOiB7IGNvbXBsZXRpb246IG51bWJlciB9IH0pIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRPcGFjaXR5QnlDb21wbGV0aW9uKGQuZGF0YS5jb21wbGV0aW9uKTtcbiAgICAgICAgfSk7XG5cbiAgICAvLyBUT0RPOiB0ZXN0IHRvIGRlbFxuICAgIHZhciB0ZXN0ID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIGdzKSB7XG4gICAgICAgIHRlc3QucHVzaChrZXkpO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnW3Rlc3RdIGtleXMgb2YgZ3MgOicsIHRlc3QpO1xuXG4gICAgLy8g57uY5Yi26IqC54K5XG4gICAgZ3MuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgLmF0dHIoJ3gxJywgLWxhYmVsVylcbiAgICAgICAgLmF0dHIoJ3gyJywgMClcbiAgICAgICAgLmF0dHIoJ3kxJywgMClcbiAgICAgICAgLmF0dHIoJ3kyJywgMClcbiAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnbm9uZScpXG4gICAgICAgIC5hdHRyKCdzdHJva2UnLCBUSEVNRV9DT0xPUikgLy8gVE9ETzogdGVzdCB0byBtb2RcbiAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIGZ1bmN0aW9uKGQ6IHsgZGVwdGg6IG51bWJlciB9KSB7XG4gICAgICAgICAgICByZXR1cm4gbWF4RGVwdGggLSBkLmRlcHRoICsgTUlOX1NUUk9LRV9XSURUSDtcbiAgICAgICAgfSlcbiAgICAgICAgLy8g5a6M5oiQ5bqm5pWI5p6cIC0g6Jma57q/XG4gICAgICAgIC5hdHRyKCdzdHJva2UtZGFzaGFycmF5JywgZnVuY3Rpb24oZDoge1xuICAgICAgICAgICAgZGF0YTogeyBjb21wbGV0aW9uOiBudW1iZXIgfTtcbiAgICAgICAgfSkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFN0cm9rZURhc2hBcnJCeUNvbXBsZXRpb24oZC5kYXRhLmNvbXBsZXRpb24pO1xuICAgICAgICB9KTtcblxuICAgIGdzLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgICAgLmF0dHIoJ3InLCBmdW5jdGlvbihkOiB7IGRlcHRoOiBudW1iZXIgfSkge1xuICAgICAgICAgICAgcmV0dXJuIG1heERlcHRoIC0gZC5kZXB0aCArIE1JTl9TVFJPS0VfV0lEVEg7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCdmaWxsJywgZnVuY3Rpb24oZDogeyBjaGlsZHJlbjogYW55W10gfSkge1xuICAgICAgICAgICAgcmV0dXJuIGQuY2hpbGRyZW4gPyAnd2hpdGUnIDogVEhFTUVfQ09MT1I7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCdzdHJva2UnLCBUSEVNRV9DT0xPUilcbiAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIDEpO1xuXG4gICAgLy8g5paH5a2XXG4gICAgZ3MuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgLmF0dHIoJ3gnLCBmdW5jdGlvbihkOiB7IGRlcHRoOiBudW1iZXIgfSkge1xuICAgICAgICAgICAgLy8gLy8gVE9ETzog5L2/55So5pu05aW955qE6K6h566X5a2X56ym5Liy5pi+56S66ZW/5bqm55qE5pa55byPXG4gICAgICAgICAgICAvLyBjb25zdCBjaGFyQ291bnQgPSBkLmRhdGEubmFtZS5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gLWxhYmVsVztcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoJ3knLCBmdW5jdGlvbihkOiB7IGRlcHRoOiBudW1iZXIgfSkge1xuICAgICAgICAgICAgY29uc3QgY2lyY2xlUmFkaXVzID0gbWF4RGVwdGggLSBkLmRlcHRoICsgTUlOX1NUUk9LRV9XSURUSDtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSW1vTm90ZTog6L+Z6YeM5paH5a2X5Yiw5LiL5YiS57q/55qE6Led56a75Y+v5Lul55So5Yeg56eN562W55Wl77yaXG4gICAgICAgICAgICAgKiAtIOmbtui3neemu++8mi1jaXJjbGVSYWRpdXMgLyAyXG4gICAgICAgICAgICAgKiAtIOe7neWvuei3neemu1xuICAgICAgICAgICAgICogLSDnm7jlr7nvvIjkuIvliJLnur/nspfnu4bvvInot53nprsgW3hdIDwtIOaaguaXtumHh+eUqFxuICAgICAgICAgICAgICogLSDnm7jlr7nvvIjkuIvliJLnur/nspfnu4bvvInot53nprsgKyDkuIDlrprnu53lr7not53nprtcbiAgICAgICAgICAgICAqIC0gLi4uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJldHVybiAtY2lyY2xlUmFkaXVzIC0gVEVYVF9MSU5FX0VYVFJBX0RJU1RBTkNFO1xuICAgICAgICB9KVxuICAgICAgICAvLyAuYXR0cignZHknLCAxMClcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZDogeyBkYXRhOiB7IG5hbWU6IHN0cmluZzsgY29tcGxldGlvbjogbnVtYmVyIH0gfSkge1xuICAgICAgICAgICAgcmV0dXJuIGQuZGF0YS5uYW1lICsgKGQuZGF0YS5jb21wbGV0aW9uID09PSAxID8gJyDimJEnIDogJycpO1xuICAgICAgICB9KTtcbn1cblxuZXhwb3J0IHsgZG9uZW1hcCB9O1xuIl19