import { DoneNode } from './interfaces/donemap.interface';

/**
 * ImoNote:
 * - 类似 diigo outline 的关注点分离（缩进？）
 * - 每一个编辑器都应有的状态：上一步／下一步
 * - FIXME: size or value ???
 */
export const data: DoneNode = {
    name: 'DoneMap',
    children: [
        {
            name: 'Engineering Practice',
            children: [
                {
                    name: 'Gulp',
                    children: [
                        {
                            name: 'serve dev',
                            completion: 1
                        },
                        {
                            name: 'build prod'
                        }
                    ]
                },
                {
                    name: 'NPM',
                    children: [
                        {
                            name: 'My 1st npm package',
                            completion: 1
                        }
                    ]
                },
                {
                    name: 'Webpack'
                }
            ]
        },
        {
            name: 'Visualization Basic',
            children: [
                {
                    name: 'SVG',
                    children: [
                        {
                            name: 'line',
                            completion: 1
                        },
                        {
                            name: 'circle',
                            completion: 1
                        },
                        {
                            name: 'path',
                            completion: 1
                        },
                        {
                            name: 'text',
                            completion: 1
                        },
                        {
                            name: 'else..'
                        }
                    ]
                },
                { name: 'Canvas' }
            ]
        },
        {
            name: 'Visualization 3rd Library',
            children: [
                {
                    name: 'D3.js',
                    children: [
                        { name: 'd3.hierarchy', completion: 1 },
                        { name: 'd3.tree', completion: 1 },
                        { name: 'd3.linkHorizontal', completion: 1 },
                        { name: 'd3.select', completion: 1 },
                        { name: 'd3.<else..>' }
                    ]
                }
            ]
        },
        {
            name: 'Demand',
            children: [
                {
                    name: 'Show map',
                    completion: 1
                },
                {
                    name: 'Toggle descendants'
                },
                {
                    name: 'Zoom'
                },
                {
                    name: 'Drag'
                },
                {
                    name: 'Double click to edit'
                },
                {
                    name: 'more..'
                }
            ]
        }
    ]
};
