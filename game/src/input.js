// Keyboard + mouse input. Movement keys, grapple on the mouse, slash on Space/J,
// confirm on Space/Enter/click, pause on P/Escape. Actions are consumed once per
// frame by main.js so a press never fires twice.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SLASH = 4;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let mouseX = 640;
  let mouseY = 360;
  let mouseDown = false;
  let mouseClicked = false;

  function onKeyDown(event) {
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM | ACTION_SLASH;
      event.preventDefault();
    }
    if (event.code === 'KeyJ') actions |= ACTION_SLASH;
    if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight' || event.code === 'ArrowUp') event.preventDefault();
  }
  function onKeyUp(event) { keys.delete(event.code); }
  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
  }
  function onMouseDown(event) {
    onMouseMove(event);
    mouseDown = true;
    mouseClicked = true;
  }
  function onMouseUp() { mouseDown = false; }
  function onBlur() { keys.clear(); mouseDown = false; }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  return {
    /** -1 left, 0 still, 1 right. */
    direction() {
      const left = keys.has('KeyA') || keys.has('ArrowLeft');
      const right = keys.has('KeyD') || keys.has('ArrowRight');
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    jumpHeld() { return keys.has('KeyW') || keys.has('ArrowUp'); },
    mouse() { return { x: mouseX, y: mouseY, down: mouseDown }; },
    takeActions() {
      const taken = actions | (mouseClicked ? ACTION_CONFIRM : 0);
      actions = 0;
      mouseClicked = false;
      return taken;
    },
  };
}
