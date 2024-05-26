import { Accessor, Component, For, Setter, createSignal, onMount } from "solid-js";
import styles from "./styles.module.css"
import ButtonsComponent from "../ButtonsComponent";
import NodeComponent from "../NodeComponent";
import EdgeComponent from "../EdgeComponent";

interface Node {
    id: string;
    numberInputs: number;
    numberOutputs: number;
    prevPosition: { get: Accessor<{ x: number; y: number }>; set: Setter<{ x: number; y: number }> };
    currPosition: { get: Accessor<{ x: number; y: number }>; set: Setter<{ x: number; y: number }> };
    inputEdgeIds: { get: Accessor<string[]>; set: Setter<string[]> };
    outputEdgeIds: { get: Accessor<string[]>; set: Setter<string[]> };
}

interface Edge {
    id: string;
    nodeStartId: string;
    nodeEndId: string;
    inputIndex: number;
    outputIndex: number;
    prevStartPosition: { get: Accessor<{ x: number; y: number }>; set: Setter<{ x: number; y: number }> };
    currStartPosition: { get: Accessor<{ x: number; y: number }>; set: Setter<{ x: number; y: number }> };
    prevEndPosition: { get: Accessor<{ x: number; y: number }>; set: Setter<{ x: number; y: number }> };
    currEndPosition: { get: Accessor<{ x: number; y: number }>; set: Setter<{ x: number; y: number }> };
}

const BoardComponent: Component = () => {
    const [grabbingBoard, setGrabbingBoard] = createSignal<boolean>(false);
    const [scale, setScale] = createSignal<number>(1);
    const [clickedPosition, setClickedPosition] = createSignal<{ x: number; y: number }>({ x: -1, y: -1 });
    const [selectedNode, setSelectedNode] = createSignal<string | null>(null);
    const [selectedEdge, setSelectedEdge] = createSignal<string | null>(null);

    const [insideInput, setInsideInput] = createSignal<{
        nodeId: string;
        inputIndex: number;
        positionX: number;
        positionY: number;
    } | null>(null);
    const [newEdge, setNewEdge] = createSignal<Edge | null>(null);
    const [nodes, setNodes] = createSignal<Node[]>([]);
    const [edges, setEdges] = createSignal<Edge[]>([]);

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
        setSelectedEdge(null);

        setGrabbingBoard(true);
        setClickedPosition({ x: event.x, y: event.y });
    }

    function handleOnMouseUpBoard() {
        setClickedPosition({ x: -1, y: -1 });

        setGrabbingBoard(false);

        //If a new edge is being set and is not inside input
        if (newEdge() !== null && insideInput() === null) {
            setNewEdge(null);
        }

        //Id a new edge is being set and is inside input
        if (newEdge() !== null && insideInput() !== null) {
            const nodeStartId = newEdge()!.nodeStartId;
            const nodeEndId = insideInput()!.nodeId;

            const nodeStart = nodes().find((node) => node.id === nodeStartId);
            const nodeEnd = nodes().find((node) => node.id === nodeEndId);

            const boardWrapperElement = document.getElementById("boardWrapper");

            if (nodeStart && nodeEnd && boardWrapperElement) {
                const edgeId = `edge_${nodeStart.id}_${newEdge()?.outputIndex}_${nodeEnd.id}_${insideInput()?.inputIndex}`;

                if (nodeStart.outputEdgeIds.get().includes(edgeId) && nodeEnd.inputEdgeIds.get().includes(edgeId)) {
                    setNewEdge(null);
                    return;
                }
                
                nodeStart.outputEdgeIds.set([
                    ...nodeStart.outputEdgeIds.get(),
                    edgeId,
                ])
                nodeEnd.inputEdgeIds.set([
                    ...nodeEnd.inputEdgeIds.get(),
                    edgeId,
                ])

                newEdge()!.prevStartPosition.set((_) => {
                    return {
                        x: (newEdge()!.currStartPosition.get().x + boardWrapperElement.scrollLeft) / scale(),
                        y: (newEdge()!.currStartPosition.get().y + boardWrapperElement.scrollTop) / scale()
                    }
                })

                newEdge()!.prevEndPosition.set((_) => {
                    return {
                        x: (insideInput()!.positionX + boardWrapperElement.scrollLeft) / scale(),
                        y: (insideInput()!.positionY + boardWrapperElement.scrollTop) / scale()
                    }
                })

                newEdge()!.currEndPosition.set((_) => {
                    return {
                        x: (insideInput()!.positionX + boardWrapperElement.scrollLeft) / scale(),
                        y: (insideInput()!.positionY + boardWrapperElement.scrollTop) / scale()
                    }
                })

                //Add new edge
                setEdges([
                    ...edges(),
                    {
                        ...newEdge()!,
                        id: edgeId,
                        nodeEndId: nodeEnd.id,
                        nodeEndInputIndex: insideInput()!.inputIndex
                    }
                ])
                setNewEdge(null);
            }
        }
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
                    });

                    //Update input edges position
                    for (let i = 0; i < node.inputEdgeIds.get().length; i++) {
                        const edgeId = node.inputEdgeIds.get()[i];
                        const edge = edges().find((edge) => edge.id === edgeId);
                        if (edge) {
                            edge.currEndPosition.set((_) => {
                                return {
                                    x: (edge.prevEndPosition.get().x + deltaX) / scale(),
                                    y: (edge.prevEndPosition.get().y + deltaY) / scale(),
                                }
                            })
                        }
                    }

                    //Update output edges position
                    for (let i = 0; i < node.outputEdgeIds.get().length; i++) {
                        const edgeId = node.outputEdgeIds.get()[i];
                        const edge = edges().find((edge) => edge.id === edgeId);
                        if (edge) {
                            edge.currStartPosition.set((_) => {
                                return {
                                    x: (edge.prevStartPosition.get().x + deltaX) / scale(),
                                    y: (edge.prevStartPosition.get().y + deltaY) / scale(),
                                }
                            })
                        }
                    }
                }

            } else {
                const boardWrapperElement = document.getElementById("boardWrapper");
                if(boardWrapperElement) {
                    boardWrapperElement.scrollBy(-deltaX, -deltaY);
                    setClickedPosition({ x: event.x, y: event.y });
                }
            }
        }

        if (newEdge() !== null) {
            const boardWrapperElement = document.getElementById("boardWrapper");
            if (boardWrapperElement) {
                newEdge()?.currEndPosition.set({
                    x: (event.x + boardWrapperElement.scrollLeft) / scale(),
                    y: (event.y + boardWrapperElement.scrollTop) / scale()
                })
            }
        }
    }

    function handleOnClickAdd(numberInputs: number, numberOutputs:number) {
        const randomX = Math.random() * window.innerWidth;
        const randomY = Math.random() * window.innerHeight;

        const [nodePrev, setNodePrev] = createSignal<{ x: number; y: number }>({ x: randomX, y: randomY });
        const [nodeCurr, setNodeCurr] = createSignal<{ x: number; y: number }>({ x: randomX, y: randomY });

        const [inputEdgesIds, setInputsEdgesIds] = createSignal<string[]>([]);
        const [outputEdgesIds, setOutputsEdgesIds] = createSignal<string[]>([]);

        setNodes([
            ...nodes(),
            {
                id: `node_${Math.random().toString(36).substring(2, 8)}`,
                numberInputs: numberInputs,
                numberOutputs: numberOutputs,
                prevPosition: { get: nodePrev, set: setNodePrev },
                currPosition: { get: nodeCurr, set: setNodeCurr },
                inputEdgeIds: { get: inputEdgesIds, set: setInputsEdgesIds },
                outputEdgeIds: { get: outputEdgesIds, set: setOutputsEdgesIds },
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
        setSelectedEdge(null);
        setSelectedNode(id);

        setClickedPosition({ x: event.x, y: event.y});

        const node = nodes().find((node) => node.id === selectedNode());
        if(node) {
            node.prevPosition.set((_) => {
                return { x: node.currPosition.get().x * scale(), y: node.currPosition.get().y * scale() }
            })

            //Update input edges position
            for (let i = 0; i < node.inputEdgeIds.get().length; i++) {
                const edgeId = node.inputEdgeIds.get()[i];
                const edge = edges().find((edge) => edge.id === edgeId);
                if (edge) {
                    edge.prevEndPosition.set((_) => {
                        return {
                            x: edge.currEndPosition.get().x * scale(),
                            y: edge.currEndPosition.get().y * scale(),
                        }
                    })
                }
            }

            //Update output edges position
            for (let i = 0; i < node.outputEdgeIds.get().length; i++) {
                const edgeId = node.outputEdgeIds.get()[i];
                const edge = edges().find((edge) => edge.id === edgeId);
                if (edge) {
                    edge.prevStartPosition.set((_) => {
                        return {
                            x: edge.currStartPosition.get().x * scale(),
                            y: edge.currStartPosition.get().y * scale(),
                        }
                    })
                }
            }
        } 
    }

    function handleOnMouseDownOutput(outputPositionX: number, outputPositionY: number, nodeId: string, outputIndex: number) {
        setSelectedNode(null);
        
        const boardWrapperElement = document.getElementById("boardWrapper");

        if(boardWrapperElement) { 
            const [prevEdgeStart, setPrevEdgeStart] = createSignal<{ x: number; y: number }>({
                x: (outputPositionX + boardWrapperElement.scrollLeft) / scale(),
                y: (outputPositionY + boardWrapperElement.scrollTop) / scale()
            })
            const [currEdgeStart, setCurrEdgeStart] = createSignal<{ x: number; y: number }>({
                x: (outputPositionX + boardWrapperElement.scrollLeft) / scale(),
                y: (outputPositionY + boardWrapperElement.scrollTop) / scale()
            })
            const [prevEdgeEnd, setPrevEdgeEnd] = createSignal<{ x: number; y: number }>({
                x: (outputPositionX + boardWrapperElement.scrollLeft) / scale(),
                y: (outputPositionY + boardWrapperElement.scrollTop) / scale()
            })
            const [currEdgeend, setCurrEdgeEnd] = createSignal<{ x: number; y: number }>({
                x: (outputPositionX + boardWrapperElement.scrollLeft) / scale(),
                y: (outputPositionY + boardWrapperElement.scrollTop) / scale()
            })

            setNewEdge({
                id: "",
                nodeStartId: nodeId,
                outputIndex: outputIndex,
                nodeEndId: "",
                inputIndex: -1,
                prevStartPosition: { get: prevEdgeStart, set: setPrevEdgeStart },
                currStartPosition: { get: currEdgeStart, set: setCurrEdgeStart },
                prevEndPosition: { get: prevEdgeEnd, set: setPrevEdgeEnd },
                currEndPosition: { get: currEdgeend, set: setCurrEdgeEnd }
            })
        }
    }

    function handleOnMouseEnterInput(inputPositionX: number, inputPositionY: number, nodeId: string, inputIndex: number) {
        setInsideInput({ nodeId, inputIndex, positionX: inputPositionX, positionY: inputPositionY });
    }

    function handleOnMouseLeaveInput(nodeId: string, inputIndex: number) {
        if (insideInput()?.nodeId === nodeId && insideInput()?.inputIndex === inputIndex) setInsideInput(null);
    }

    function handleOnMouseDownEdge(edgeId: string) {
        setSelectedNode(null);

        setSelectedEdge(edgeId);
    }

    function handleOnDeleteEdge(edgeId: string) {
        const edge = edges().find((e) => e.id == edgeId);

        if (edge) {
            const nodeStart = nodes().find((n) => n.id == edge.nodeStartId);
            if (nodeStart) {
                nodeStart.outputEdgeIds.set([...nodeStart.outputEdgeIds.get().filter((edgeId) => edgeId !== edge.id)])
            }

            const nodeEnd = nodes().find((n) => n.id == edge.nodeEndId);
            if (nodeEnd) {
                nodeEnd.inputEdgeIds.set([...nodeEnd.inputEdgeIds.get().filter((edgeId) => edgeId !== edge.id)])
            }

            setEdges([...edges().filter((e) => e.id !== edge.id)]);
        }
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

            {newEdge() !== null && (
                <EdgeComponent
                    selected={false}
                    isNew={true}
                    position={{
                        x0: newEdge()!.currStartPosition.get().x,
                        y0: newEdge()!.currStartPosition.get().y,
                        x1: newEdge()!.currEndPosition.get().x,
                        y1: newEdge()!.currEndPosition.get().y,
                    }}
                    onMouseDownEdge={()=>{}}
                    onClickDelete={()=>{}}
                />
            )}

            <For each={edges()}>
                {(edge: Edge) => (
                    <EdgeComponent
                        selected={selectedEdge() === edge.id}
                        isNew={false}
                        position={{
                            x0: edge.currStartPosition.get().x,
                            y0: edge.currStartPosition.get().y,
                            x1: edge.currEndPosition.get().x,
                            y1: edge.currEndPosition.get().y,
                        }}
                        onMouseDownEdge={() => handleOnMouseDownEdge(edge.id)}
                        onClickDelete={() => handleOnDeleteEdge(edge.id)}
                    />
                )}
            </For>
        </div>
    </div>
}

export default BoardComponent;