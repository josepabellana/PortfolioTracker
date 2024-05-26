import { Accessor, Component, For, Setter, createSignal, onMount } from "solid-js";
import styles from "./styles.module.css"
import ButtonsComponent from "../ButtonsComponent";
import NodeComponent from "../NodeComponent";

interface Node {
    id: string;
    numberInputs: number;
    numberOutputs: number;
    prevPosition: { get: Accessor<{ x: number; y: number }>; set: Setter<{ x: number; y: number }> };
    currPosition: { get: Accessor<{ x: number; y: number }>; set: Setter<{ x: number; y: number }> };
}

const BoardComponent: Component = () => {
    const [grabbingBoard, setGrabbingBoard] = createSignal<boolean>(false);
    const [scale, setScale] = createSignal<number>(1);
    const [clickedPosition, setClickedPosition] = createSignal<{ x: number; y: number }>({ x: -1, y: -1 });
    const [selectedNode, setSelectedNode] = createSignal<string | null>(null);

    const [nodes, setNodes] = createSignal<Node[]>([]);

    onMount(() => {
        const boardElement = document.getElementById("board");

        if (boardElement) {
            boardElement.addEventListener(
                "wheel",
                (event) => {
                    //Update scale
                    setScale(scale() + event.deltaY * - 0.005);

                    //Restrict scale
                    setScale(Math.min(Math.max(1, scale()), 2));

                    //Apply scale transform
                    boardElement.style.transform = `scale(${scale()})`;
                    boardElement.style.marginTop = `${(scale() -1) * 50}vh`;
                    boardElement.style.marginLeft = `${(scale() -1) * 50}vw`;
                },
                { passive: false }
            )
        }
    })

    function handleOnMouseDownBoard(event: any) {
        setSelectedNode(null);

        setGrabbingBoard(true);
        setClickedPosition({ x: event.x, y: event.y });
    }

    function handleOnMouseUpBoard() {
        setClickedPosition({ x: -1, y: -1 });

        setGrabbingBoard(false);
    }

    function handleOnMouseMove(event: any) {
        if (clickedPosition().x >= 0 && clickedPosition().y >= 0) {
            const deltaX = event.x - clickedPosition().x;
            const deltaY = event.y - clickedPosition().y;

            if (selectedNode() !== null) {
                const deltaX = event.x - clickedPosition().x;
                const deltaY = event.y -clickedPosition().y;

                const node = nodes().find((node) => node.id === selectedNode());
                if(node) {
                    node.currPosition.set((_) => {
                        return {
                            x: (node.prevPosition.get().x + deltaX) / scale(),
                            y: (node.prevPosition.get().y + deltaY) / scale()
                        }
                    })
                } 
            } else {
                const boardWrapperElement = document.getElementById("boardWrapper");
                if(boardWrapperElement) {
                    boardWrapperElement.scrollBy(-deltaX, -deltaY);
                    setClickedPosition({ x: event.x, y: event.y });
                }
            }

        }
    }

    function handleOnClickAdd(numberInputs: number, numberOutputs:number) {
        const randomX = Math.random() * window.innerWidth;
        const randomY = Math.random() * window.innerHeight;

        const [nodePrev, setNodePrev] = createSignal<{ x: number; y: number }>({ x: randomX, y: randomY });
        const [nodeCurr, setNodeCurr] = createSignal<{ x: number; y: number }>({ x: randomX, y: randomY });

        setNodes([
            ...nodes(),
            {
                id: `node_${Math.random().toString(36).substring(2, 8)}`,
                numberInputs: numberInputs,
                numberOutputs: numberOutputs,
                prevPosition: { get: nodePrev, set: setNodePrev },
                currPosition: { get: nodeCurr, set: setNodeCurr },
            }
        ])
    }

    function handleOnClickDelete() {
        const node = nodes().find((node) => node.id === selectedNode());

        if(!node) {
            setSelectedNode(null);
            return;
        }

        setNodes([...nodes().filter((node) => node.id !== selectedNode())]);
        setSelectedNode(null);
    }

    function handleOnMouseDownNode(id: string, event: any) {
        setSelectedNode(id);

        setClickedPosition({ x: event.x, y: event.y});

        const node = nodes().find((node) => node.id === selectedNode());
        if(node) {
            node.prevPosition.set((_) => {
                return { x: node.currPosition.get().x * scale(), y: node.currPosition.get().y * scale() }
            })
        } 
    }

    function handleOnMouseDownOutput(outputPositionX: number, outputPositionY: number, nodeId: string, outputIndex: number) {

    }

    function handleOnMouseEnterInput(inputPositionX: number, inputPositionY: number, nodeId: string, inputIndex: number) {

    }

    function handleOnMouseLeaveInput(nodeId: string, inputIndex: number) {

    }

    return <div id="boardWrapper" class={styles.wrapper}>
        <ButtonsComponent showDelete={selectedNode() !== null} onClickAdd={handleOnClickAdd} onClickDelete={handleOnClickDelete}></ButtonsComponent>
        <div 
            id="board" 
            class={grabbingBoard() ? styles.boardDragging : styles.board}
            onMouseDown={handleOnMouseDownBoard}
            onMouseUp={handleOnMouseUpBoard}
            onMouseMove={handleOnMouseMove}
        >
            <For each={nodes()}>
                {(node: Node) => (
                    <NodeComponent
                        id={node.id}
                        x={node.currPosition.get().x}
                        y={node.currPosition.get().y}
                        numberInputs={node.numberInputs}
                        numberOutputs={node.numberOutputs}
                        selected={selectedNode() === node.id}
                        onMouseDownNode={handleOnMouseDownNode}
                        onMouseDownOutput={handleOnMouseDownOutput}
                        onMouseEnterInput={handleOnMouseEnterInput}
                        onMouseLeaveInput={handleOnMouseLeaveInput}
                    />
                )}
            </For>
        </div>
    </div>
}

export default BoardComponent;