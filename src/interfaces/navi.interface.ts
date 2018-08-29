export class NaviNode {
    id: string;
    text: string;
    children: NaviNode[];
    done?: boolean;
    link?: string;
    note?: string;
}
