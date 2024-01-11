import React, { useEffect, useState } from "react";
import { Droppable } from "react-beautiful-dnd";


/**
 * StrictModeDroppable that will work with React.StrictMode.
 *
 * This component is used as a workaround to make the `Droppable` component from `react-beautiful-dnd`
 * compatible with React's StrictMode. It delays rendering the `Droppable` component until after the
 * initial render to avoid the issues caused by StrictMode's double render.
 *
 * @param {Object} props - The props for the StrictModeDroppable component.
 * @param {ReactNode} props.children - The children elements to be rendered within the Droppable.
 * @param {string} props.droppableId - The unique identifier for the Droppable.
 * @param {Object} [props.type] - The type of the Droppable.
 * @param {Function} [props.direction] - The direction of the Droppable.
 * @returns {ReactElement|null} The rendered StrictModeDroppable component or null if not enabled.
 * @see [react-beautiful-dnd documentation](https://github.com/atlassian/react-beautiful-dnd/blob/main/docs/api/droppable.md)
 * @see https://medium.com/@wbern/getting-react-18s-strict-mode-to-work-with-react-beautiful-dnd-47bc909348e4
 */
export const StrictModeDroppable = ({ children, ...props }) => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));

        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    if (!enabled) {
        return null;
    }

    return <Droppable {...props}>{children}</Droppable>;
};