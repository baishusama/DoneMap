export class BaiduNaotuBaseData {
    id: string;
    text: string;
    created: number;
    note?: string;
}

export class BaiduNaotuLayoutOffset {
    x: number;
    y: number;
}

export class BaiduNaotuData extends BaiduNaotuBaseData {
    layout_mind_offset: BaiduNaotuLayoutOffset;
}

export class BaiduNaotuChildNode {
    data: BaiduNaotuData;
    children: BaiduNaotuChildNode[];
}

export class BaiduNaotuRootNode {
    data: BaiduNaotuBaseData;
    children: BaiduNaotuChildNode[];
}

export class BaiduNaotuContent {
    root: BaiduNaotuRootNode;
    template: string;
    theme: string;
    version: string;
}
