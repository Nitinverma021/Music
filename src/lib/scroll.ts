import { createContext, useContext } from "react";

/** The main scrolling element, so virtualized lists can follow page scroll. */
export const ScrollContext = createContext<HTMLElement | null>(null);
export const useScrollElement = () => useContext(ScrollContext);
