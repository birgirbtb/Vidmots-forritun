import { animate } from "https://cdn.jsdelivr.net/npm/animejs@4.5.0/+esm";

const svg = document.querySelector("svg");
const pieces = [...svg.querySelectorAll('g[id^="Piece"]')];

const offsets = [
    { x: -150, y: -100 },
    { x: 150, y: -100 },
    { x: -150, y: 100 },
    { x: 150, y: 100 }
];

const states = new Map();

function svgPoint(event) {
    const point = new DOMPoint(event.clientX, event.clientY);
    return point.matrixTransform(svg.getScreenCTM().inverse());
}

function pulseAnimation(event, loopOn) {
    animate(event, {
    scale: [1, 1.05],
    duration: 1000,
    ease: "inOutSine",
    alternate: true,
    loop: loopOn
    });
}

pieces.forEach((piece, index) => {
    const dragTarget = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    piece.parentNode.insertBefore(dragTarget, piece);
    dragTarget.appendChild(piece);

    const state = {
        x: offsets[index].x,
        y: offsets[index].y,
        startX: 0,
        startY: 0,
        dragging: false
    };

    dragTarget.setAttribute(
        "transform",
        `translate(${state.x} ${state.y})`
    );

    piece.style.cursor = "grab";

    pulseAnimation(piece, true);

    piece.addEventListener("pointerdown", (event) => {
        event.preventDefault();

        pulseAnimation(piece, false)

        const point = svgPoint(event);
        state.startX = point.x - state.x;
        state.startY = point.y - state.y;
        state.dragging = true;

        piece.setPointerCapture(event.pointerId);
        piece.style.cursor = "grabbing";
    });

    piece.addEventListener("pointermove", (event) => {
        if (!state.dragging) return;

        const point = svgPoint(event);
        state.x = point.x - state.startX;
        state.y = point.y - state.startY;

        dragTarget.setAttribute(
            "transform",
            `translate(${state.x} ${state.y})`
        );
    });

    piece.addEventListener("pointerup", (event) => {
        state.dragging = false;
        piece.releasePointerCapture(event.pointerId);
        piece.style.cursor = "grab";

        if (Math.hypot(state.x, state.y) < 60) {
            state.x = 0;
            state.y = 0;

            dragTarget.setAttribute("transform", "translate(0 0)");

            animate(piece, {scale: 1});
        }   else {
            pulseAnimation(piece, true);
        }
    });
});