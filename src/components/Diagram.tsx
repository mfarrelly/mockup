import React from "react";

import { Canvas, CanvasData, CanvasEvent, CanvasFC } from "./Canvas";
import { Button, Paper } from "@material-ui/core";
import { ButtonGroup } from "@material-ui/core";
import { fabric } from "fabric";
import { append } from "ramda";

import styles from "./Diagram.module.css";
import { useFabricJSEditor } from "./Editor";

function nextEvent(type: string, currentId: any): CanvasEvent | undefined {
    if (type === "box") {
        return {
            id: `${currentId}`,
            type: "box",
            position: new fabric.Point(10, 10),
            color: "#00B2FF",
            size: 20
        };
    } else if (type === "circle") {
        return {
            id: `${currentId}`,
            type: "circle",
            position: new fabric.Point(10, 10),
            color: "#00B2FF",
            size: 20
        };
    } else if (type === "line") {
        return {
            id: `${currentId}`,
            type: "line",
            position: new fabric.Point(10, 10),
            color: "#00B2FF",
            size: 20
        };
    }
    return undefined;
}

export function Diagram() {
    const [userData, setUserData] = React.useState<CanvasData>();
    // const [currentId, setCurrentId] = React.useState<number>(1);

    const { selectedObjects, editor, onReady } = useFabricJSEditor();

    const onAdd = React.useCallback(
        (type: string) => {
            if (type == "circle") {
                editor?.addCircle({});
            } else if (type === "box") {
                editor?.addRectangle({
                    fill: "#dd0000",
                    stroke: "#FF0000"
                });
            } else if (type === "line") {
                editor?.addLine({
                    points: [250, 100, 200, 75],
                    options: {
                        left: 170,
                        top: 150,
                        stroke: "#FF0000"
                    }
                });
            }
        },
        [editor]
    );

    const join = React.useCallback(() => {
        //
        // alert(`There are ${selectedObjects?.length} items selected.`);

        if (selectedObjects && selectedObjects?.length > 0) {
            editor?.groupItems(selectedObjects);
        }
    }, [selectedObjects]);

    const isJoinable = React.useMemo(() => {
        return selectedObjects?.length === 2;
    }, [selectedObjects]);

    return (
        <Paper variant="outlined">
            {editor && (
                <ButtonGroup color="primary">
                    <Button onClick={() => alert("what")}>Thunk</Button>
                    <Button onClick={() => onAdd("box")}>Box</Button>
                    <Button onClick={() => onAdd("circle")}>Circle</Button>
                    <Button onClick={() => onAdd("line")}>Line</Button>
                    <Button onClick={() => join()} disabled={!isJoinable}>
                        Join
                    </Button>
                </ButtonGroup>
            )}
            <CanvasFC
                className={styles.tests}
                id="c"
                canvasData={userData}
                onCanvasDataChange={setUserData}
                onReady={onReady}
            />
        </Paper>
    );
}
