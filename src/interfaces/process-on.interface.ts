export class ProcessOnBaseNode {
    id: string;
    title: string;
}

export class ProcessOnLink {
    title: string;
    value: string;
}

export class ProcessOnChildNode extends ProcessOnBaseNode {
    parent: string;
    children: ProcessOnChildNode[];
    link?: ProcessOnLink;
}

export class ProcessOnRootNode extends ProcessOnBaseNode {
    root: boolean;
    children: ProcessOnChildNode[];
    leftChildren: ProcessOnChildNode[];
    theme?: string;
    structure?: string;
}
