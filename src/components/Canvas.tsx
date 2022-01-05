import React from "react";

import { fabric } from "fabric";
import * as R from "ramda";

export interface CanvasProps {
    className?: string;
    id: string;
    canvasData?: CanvasData;
    onCanvasDataChange?: (data: CanvasData) => void;
    onReady?: (canvas: fabric.Canvas) => void;
}

export type CanvasEventType = "arrow" | "line" | "box" | "circle";

export interface CanvasEvent {
    id: string;
    type: CanvasEventType;
    position: fabric.Point;
    color: string;
    size: number;
}

export interface CanvasData {
    items: CanvasEvent[];
}

interface CanvasActionEvent {
    do: (_: CanvasEvent) => void;
    addHud: (o: fabric.Object) => void;
    removeHud: (o: fabric.Object) => void;
    type: CanvasEventType;
}

interface CanvasState {
    canvas: fabric.Canvas | null;
    eventTypes: Record<CanvasEventType, CanvasActionEvent> | undefined;
    hoverItems: any[];
}

export class Canvas extends React.Component<CanvasProps, CanvasState> {
    constructor(props: CanvasProps) {
        super(props);
        this.state = {
            canvas: null,
            eventTypes: undefined,
            hoverItems: []
        };
    }

    /**
     * Adds item events, and other methods by type.
     */
    registerEventTypes() {
        const registeredEventTypes: Record<CanvasEventType, CanvasActionEvent> = {
            "box": {
                type: "box",
                do: (event: CanvasEvent) => {
                    const { position } = { ...event };
                    const rect = new fabric.Rect({
                        left: position.x,
                        top: position.y,
                        fill: event.color,
                        width: event.size,
                        height: event.size,
                        data: { id: event.id }
                    });
                    this.state.canvas?.add(rect);
                },
                addHud: o => {},
                removeHud: o => {}
            },
            "circle": {
                type: "circle",
                do: event => {
                    const { position } = { ...event };
                    const rect = new fabric.Circle({
                        left: position.x,
                        top: position.y,
                        fill: event.color,
                        radius: event.size,
                        data: { id: event.id }
                    });
                    this.state.canvas?.add(rect);
                },
                addHud: o => {},
                removeHud: o => {}
            },
            "line": {
                type: "line",
                do: event => {
                    const { position } = { ...event };
                    const line = new fabric.Line([position.x, position.y, position.x + 150, position.y], {
                        fill: event.color,
                        stroke: event.color,
                        strokeWidth: event.size,
                        data: { id: event.id }
                    });

                    // add events - events on items dont use prefix like "object:moved"
                    line.on("moved", function () {
                        console.log("line md.");
                    });

                    this.state.canvas?.add(line);
                },
                addHud: o => {},
                removeHud: o => {}
            }
        };

        this.setState({ ...this.state, eventTypes: registeredEventTypes });
    }

    /**
     * Process a CanvasEvent.
     *
     *
     */
    addEvent(item: CanvasEvent) {
        if (!this.state.canvas) {
            return;
        }

        // does the eventType exist?
        if (this.state.eventTypes?.[item.type]) {
            // call the do method to add the elements to canvas.
            this.state.eventTypes?.[item.type]?.do(item);
            // listen for selections
        }
    }

    componentDidUpdate(prevProps: CanvasProps): void {
        // console.log(`updated.`);
        if (super.componentDidUpdate) {
            super.componentDidUpdate(prevProps, this.props as any);
        }

        if (this.props.canvasData) {
            const events = R.difference(this.props.canvasData?.items ?? [], prevProps.canvasData?.items ?? []);
            // anything added will trigger an "addEvent" call.
            for (const event of events) {
                this.addEvent(event);
            }
        }

        // if (this.props.)
    }

    /**
     * Find the fabric.Object by a clicked point.
     */
    public searchObjects(e: Event): fabric.Object | null {
        const lst: fabric.Object[] = [];
        // canvas.findTarget is not typed, but more allows for pixel precision detection of objects
        const targets = this.state.canvas?.findTarget(e, true);

        if (targets) {
            // console.log(targets);
            this.setState({ ...this.state, hoverItems: [targets] });
        }
        return null;
    }

    componentDidMount() {
        const canvas = new fabric.Canvas(this.props.id);

        this.registerEventTypes();
        // console.log("mounted.");
        this.setState({ canvas: canvas });

        canvas.on("object:moved", function (e: fabric.IEvent) {
            // console.log("canvas md.", e);
        });
        canvas.on("mouse:move", (e: fabric.IEvent) => {
            // console.log("canvas mouse moved.", e);

            this.searchObjects(e.e);
        });
    }

    render() {
        const { id } = this.props;
        return <canvas id={id} width={900} height={300} />;
    }
}

export function CanvasFC({ id, className, onReady }: CanvasProps) {
    const canvasEl = React.useRef(null);
    const canvasElParent = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const canvas = new fabric.Canvas(canvasEl.current);
        const setCurrentDimensions = () => {
            canvas.setHeight(canvasElParent.current?.clientHeight || 0);
            canvas.setWidth(canvasElParent.current?.clientWidth || 0);
            canvas.renderAll();
        };
        const resizeCanvas = () => {
            setCurrentDimensions();
        };
        setCurrentDimensions();

        window.addEventListener("resize", resizeCanvas, false);

        if (onReady) {
            onReady(canvas);
        }

        return () => {
            canvas.dispose();
            window.removeEventListener("resize", resizeCanvas);
        };
    }, []);
    return (
        <div ref={canvasElParent} className={className}>
            <canvas ref={canvasEl} />
        </div>
    );
}
