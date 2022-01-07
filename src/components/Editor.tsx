import { fabric } from "fabric";
import {
    defaultCircleOptions,
    defaultLineOptions,
    defaultRectOptions,
    defaultTextOptions,
    FILL,
    ILineOptions,
    STROKE
} from "./defaultShapes";
import { useEffect, useState } from "react";
import * as R from "ramda";

interface Bounds {
    left: number;
    top: number;
    width: number;
    height: number;
}

function getBounds(objs: fabric.Object[]): Bounds {
    let x1 = 99999;
    let y1 = 999999;
    let x2 = 0;
    let y2 = 0;
    let width = 0;
    let height = 0;
    objs.forEach(v => {
        let rect = v.getBoundingRect();
        let tl = AbsolutePoint.getTopLeft(v);
        if (tl.x < x1) {
            x1 = tl.x;
        }
        if (tl.y < y1) {
            y1 = tl.y;
        }
        if (tl.y + rect.height > y2) {
            y2 = tl.y + rect.height;
        }

        if (tl.x + rect.width > x2) {
            x2 = tl.x + rect.width;
        }
    });

    return {
        left: x1,
        top: y1,
        height: y2 - y1,
        width: x2 - x1
    };
}

class AbsolutePoint {
    /**
     * Gets the absolute center point of the object (even when grouped)
     */
    static getCenterPoint(object: fabric.Object): fabric.Point {
        if ((object as any).group) {
            const center = (object as any).group.getCenterPoint() as fabric.Point;
            return object.getCenterPoint().add(center);
        }
        return object.getCenterPoint();
    }
    /**
     * Gets the absolute top left point of the object (even when grouped)
     */
    static getTopLeft(object: fabric.Object): fabric.Point {
        if ((object as any).group) {
            const groupped = (object as any).group;
            return new fabric.Point(
                object.left + groupped.getCenterPoint().x,
                object.top + groupped.getCenterPoint().y
            );
        }
        return new fabric.Point(object.left ?? 0, object.top ?? 0);
    }
}

export interface FabricJSEditor {
    canvas: fabric.Canvas;
    addCircle: (options: fabric.ICircleOptions) => void;
    addRectangle: (options: fabric.IRectOptions) => void;
    addLine: (options: ILineOptions) => void;
    addText: (text: string) => void;
    updateText: (text: string) => void;
    deleteAll: () => void;
    deleteSelected: () => void;
    groupItems: (objs: fabric.Object[]) => void;
    fillColor: string;
    strokeColor: string;
    setFillColor: (color: string) => void;
    setStrokeColor: (color: string) => void;
    zoomIn: () => void;
    zoomOut: () => void;
}

/**
 * Creates editor
 */
export const buildEditor = (
    canvas: fabric.Canvas,
    fillColor: string,
    strokeColor: string,
    _setFillColor: (color: string) => void,
    _setStrokeColor: (color: string) => void,
    scaleStep: number
): FabricJSEditor => {
    return {
        canvas,
        addCircle: (options: fabric.ICircleOptions) => {
            const object = new fabric.Circle({
                ...defaultCircleOptions,
                ...options
            });
            canvas.add(object);
        },
        addRectangle: (options: fabric.IRectOptions) => {
            const object = new fabric.Rect({
                ...defaultRectOptions,
                ...options
            });
            canvas.add(object);
        },
        addLine: (options: ILineOptions) => {
            const object = new fabric.Line(options.points ?? defaultLineOptions.points, {
                ...defaultLineOptions.options,
                ...options.options
            });
            canvas.add(object);
        },
        addText: (text: string) => {
            // use stroke in text fill, fill default is most of the time transparent
            const object = new fabric.Textbox(text, { ...defaultTextOptions, fill: strokeColor });
            object.set({ text: text });
            canvas.add(object);
        },
        updateText: (text: string) => {
            const objects: any[] = canvas.getActiveObjects();
            if (objects.length && objects[0].type === defaultTextOptions.type) {
                const textObject: fabric.Textbox = objects[0];
                textObject.set({ text });
                canvas.renderAll();
            }
        },
        // group the passed items.
        groupItems: (objs: fabric.Object[]) => {
            // get the bounds (left,top,width,height)
            const bounds = getBounds(objs);
            console.log(bounds);

            const g = new fabric.Group(objs, bounds);

            // first remove the originals from the canvas
            canvas.remove(...objs);
            // add back the group.
            canvas.add(g);
        },
        deleteAll: () => {
            canvas.getObjects().forEach(object => canvas.remove(object));
            canvas.discardActiveObject();
            canvas.renderAll();
        },
        deleteSelected: () => {
            canvas.getActiveObjects().forEach(object => canvas.remove(object));
            canvas.discardActiveObject();
            canvas.renderAll();
        },
        fillColor,
        strokeColor,
        setFillColor: (fill: string) => {
            _setFillColor(fill);
            canvas.getActiveObjects().forEach(object => object.set({ fill }));
            canvas.renderAll();
        },
        setStrokeColor: (stroke: string) => {
            _setStrokeColor(stroke);
            canvas.getActiveObjects().forEach(object => {
                if (object.type === defaultTextOptions.type) {
                    // use stroke in text fill
                    object.set({ fill: stroke });
                    return;
                }
                object.set({ stroke });
            });
            canvas.renderAll();
        },
        zoomIn: () => {
            const zoom = canvas.getZoom();
            canvas.setZoom(zoom / scaleStep);
        },
        zoomOut: () => {
            const zoom = canvas.getZoom();
            canvas.setZoom(zoom * scaleStep);
        }
    };
};

interface FabricJSEditorState {
    editor?: FabricJSEditor;
}

export interface FabricJSEditorHook extends FabricJSEditorState {
    selectedObjects?: fabric.Object[];
    onReady: (canvas: fabric.Canvas) => void;
}

interface FabricJSEditorHookProps {
    defaultFillColor?: string;
    defaultStrokeColor?: string;
    scaleStep?: number;
}

export const useFabricJSEditor = (props: FabricJSEditorHookProps = {}): FabricJSEditorHook => {
    const scaleStep = props.scaleStep || 0.5;
    const { defaultFillColor, defaultStrokeColor } = props;
    const [canvas, setCanvas] = useState<null | fabric.Canvas>(null);
    const [fillColor, setFillColor] = useState<string>(defaultFillColor || FILL);
    const [strokeColor, setStrokeColor] = useState<string>(defaultStrokeColor || STROKE);
    const [selectedObjects, setSelectedObject] = useState<fabric.Object[]>([]);
    useEffect(() => {
        const bindEvents = (canvas: fabric.Canvas) => {
            canvas.on("selection:cleared", () => {
                setSelectedObject([]);
            });
            canvas.on("selection:created", (e: any) => {
                setSelectedObject(e.selected);
            });
            canvas.on("selection:updated", (e: any) => {
                setSelectedObject(e.selected);
            });
        };
        if (canvas) {
            bindEvents(canvas);
        }
    }, [canvas]);

    return {
        selectedObjects,
        onReady: (canvasReady: fabric.Canvas): void => {
            console.log("Fabric canvas ready");
            setCanvas(canvasReady);
        },
        editor: canvas
            ? buildEditor(canvas, fillColor, strokeColor, setFillColor, setStrokeColor, scaleStep)
            : undefined
    };
};
