import { animate } from "https://cdn.jsdelivr.net/npm/animejs@4.5.0/+esm";

const svg = document.querySelector("svg");
const pieces = [...svg.querySelectorAll('g[id^="Piece"]')];

const offsets = [
    { x: -150, y: -100 },
    { x: 150, y: -100 },
    { x: -150, y: 100 },
    { x: 150, y: 100 }
];

const SNAP_DISTANCE = 60;
const SNAP_ANGLE = 10;

const states = new Map();

function svgPoint(event) {
    const point = new DOMPoint(event.clientX, event.clientY);
    return point.matrixTransform(svg.getScreenCTM().inverse());
}

function pulseAnimation(event, loopOn, dur) {
    animate(event, {
    scale: [1, 1.05],
    duration: dur,
    ease: "inOutSine",
    alternate: true,
    loop: loopOn
    });
}

function angleBetween(first, second) {
    return Math.atan2(
        second.clientY - first.clientY,
        second.clientX - first.clientX
    ) * 180 / Math.PI;
}

function smallestAngle(angle) {
    return Math.abs(((angle + 180) % 360) - 180);
}

function updateTransform(dragTarget, state) {
    dragTarget.setAttribute(
        "transform",
        `translate(${state.x} ${state.y}) rotate(${state.rotation} ${state.centerX} ${state.centerY})`
    );
}

pieces.forEach((piece, index) => {
    const dragTarget = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    piece.parentNode.insertBefore(dragTarget, piece);
    dragTarget.appendChild(piece);

    const bounds = piece.getBBox();

    const startingRotations = [15, -30, 45, 90];

    const state = {
        x: offsets[index].x,
        y: offsets[index].y,
        startX: 0,
        startY: 0,
        dragging: false,
        pointers: new Map(),
        rotation: startingRotations[index],
        startAngle: 0,
        startRotation: 0,
        centerX: bounds.x + bounds.width / 2,
        centerY: bounds.y + bounds.height / 2
    };

    updateTransform(dragTarget, state);

    piece.style.cursor = "grab";

    pulseAnimation(piece, true, 1000);

    dragTarget.addEventListener("pointerdown", (event) => {
        event.preventDefault();

        dragTarget.setPointerCapture(event.pointerId);
        state.pointers.set(event.pointerId, event);

        pulseAnimation(piece, false, 200);

        if (state.pointers.size === 1) {
            const point = svgPoint(event);

            state.startX = point.x - state.x;
            state.startY = point.y - state.y;
            state.dragging = true;
        } else if (state.pointers.size === 2) {
            const [first, second] = state.pointers.values();

            state.startAngle = angleBetween(first, second);
            state.startRotation = state.rotation;
            state.dragging = false;
        }

        piece.style.cursor = "grabbing";
    });

    dragTarget.addEventListener("pointermove", (event) => {
        if (!state.pointers.has(event.pointerId)) return;

        event.preventDefault();
        state.pointers.set(event.pointerId, event);

        if (state.pointers.size === 2) {
            const [first, second] = state.pointers.values();
            const currentAngle = angleBetween(first, second);

            state.rotation =
                state.startRotation + currentAngle - state.startAngle;

            updateTransform(dragTarget, state);
            return;
        }

        if (!state.dragging) return;

        const point = svgPoint(event);
        state.x = point.x - state.startX;
        state.y = point.y - state.startY;

        updateTransform(dragTarget, state);
    });

    function endPointer(event) {
        state.pointers.delete(event.pointerId);

        if (dragTarget.hasPointerCapture(event.pointerId)) {
            dragTarget.releasePointerCapture(event.pointerId);
        }

        if (state.pointers.size !== 0) return;

        state.dragging = false;
        piece.style.cursor = "grab";

        const isNearTarget = Math.hypot(state.x, state.y) < SNAP_DISTANCE;
        const isCorrectlyRotated =
            smallestAngle(state.rotation) <= SNAP_ANGLE;

        if (isNearTarget && isCorrectlyRotated) {
            state.x = 0;
            state.y = 0;
            state.rotation = 0;
            updateTransform(dragTarget, state);

            animate(piece, {
                scale: 1,
                duration: 200
            });
        } else {
            pulseAnimation(piece, true, 1000);
        }
    }

    dragTarget.addEventListener("pointerup", endPointer);
    dragTarget.addEventListener("pointercancel", endPointer);
});