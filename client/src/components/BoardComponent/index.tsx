import { Component, createSignal, onMount } from "solid-js";
import styles from "./styles.module.css"

const BoardComponent: Component = () => {
    const [grabbingBoard, setGrabbingBoard] = createSignal<boolean>(false);
    const [scale, setScale] = createSignal<number>(1);
    const [clickedPosition, setClickedPosition] = createSignal<{ x: number; y: number }>({ x: -1, y: -1 });

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

            const boardWrapperElement = document.getElementById("boardWrapper");
            if(boardWrapperElement) {
                boardWrapperElement.scrollBy(-deltaX, -deltaY);
                setClickedPosition({ x: event.x, y: event.y });
            }
        }
    }

    return <div id="boardWrapper" class={styles.wrapper}>
        <div 
            id="board" 
            class={grabbingBoard() ? styles.boardDragging : styles.board}
            onMouseDown={handleOnMouseDownBoard}
            onMouseUp={handleOnMouseUpBoard}
            onMouseMove={handleOnMouseMove}
        ></div>
    </div>
}

export default BoardComponent;