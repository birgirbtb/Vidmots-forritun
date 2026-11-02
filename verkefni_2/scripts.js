/*
A good path is:

1. **Create the square**
   - Add a `<div>` in `index.html`.
   - Give it width, height, and a background color in `styles.css`.

2. **Listen for touch input**
   In `scripts.js`, look into Pointer Events:
   - `pointerdown`
   - `pointermove`
   - `pointerup`
   - `pointercancel`

3. **Track two fingers**
   Store each pointer’s:
   - `pointerId`
   - `clientX`
   - `clientY`

   A `Map` is useful here because each finger has a unique `pointerId`.

4. **Calculate the angle**
   When you have two fingers, calculate the angle between them:

   ```js
   Math.atan2(y2 - y1, x2 - x1)
   ```

5. **Compare old and new angles**
   On the first moment when two fingers are present, save the starting angle.

   During movement:

   ```text
   rotation change = current angle - starting angle
   ```

6. **Apply the rotation**
   Use CSS:

   ```js
   square.style.transform = `rotate(${angle}rad)`;
   ```

Important concepts to investigate:

- Why `pointerId` is needed
- Why you should store two pointer positions
- What `Math.atan2()` returns
- Why angles should usually be measured in radians
- How CSS `transform: rotate()` works

Start with just detecting and displaying the two pointer coordinates. Once that works, add angle calculation, and only then add the visual rotation.
*/ 

const square = document.getElementById("square");
let angle = 45; // hversu margar gráður kassin hreyfist

function rotateSquare(e) {
    e.preventDefault();
    square.style.transform = `rotate(${angle}deg)`;
    angle += 45
}

square.addEventListener("pointerdown", rotateSquare);

