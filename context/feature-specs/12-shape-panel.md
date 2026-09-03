Add a bottom shape panel so users can drag shapes onto the canvas and create new nodes.

Implementation
Add a floating pill-shaped toolbar at the bottom-center of the canvas.

Add draggable icon buttons for these shapes:

rectangle
diamond
circle
pill
cylinder
hexagon
When dragging a shape, include the shape name and default size in the drag payload.

Use sensible default sizes:

rectangles should be wider than tall
circles should be square
diamonds should be slightly larger so labels have room
Add dragover and drop handling to the canvas wrapper.

On drop:

read the dragged shape payload
convert the screen position to canvas coordinates using React Flow
create a new node at that position
use an empty label
use the default node color
use the dragged shape value
Generate each node ID using the shape name, timestamp, and a counter.

Add a basic renderer for the custom canvas node type so new nodes are visible.

For this unit, render every shape as a simple bordered rectangle with the label centered. Shape-specific visuals will be added later.

Check When Done
Shape drag payload includes the correct shape and size data.
Drop logic creates new canvas nodes with the expected shape data.
New nodes use the custom canvas node type.
npm run build passes without type errors.
