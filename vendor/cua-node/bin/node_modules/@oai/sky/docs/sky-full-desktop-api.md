# Sky Full Desktop API

## API Reference

Use this as the supported `sky` full desktop API surface.

```ts
import { sky } from "@oai/sky";

const screenshots = await sky.get_screenshot();

interface FullDesktopComputerUseClient {
  get_screenshot(): Promise<Array<Screenshot>>; // Capture screenshots for the full desktop target.
  click(input: ClickInput): Promise<void>; // Click at a desktop coordinate.
  drag(input: DragInput): Promise<void>; // Drag from one desktop coordinate to another.
  move(input: MoveInput): Promise<void>; // Move the pointer to a desktop coordinate.
  press_key(input: PressKeyInput): Promise<void>; // Press a `+`-separated keyboard chord on the desktop.
  scroll(input: ScrollInput): Promise<void>; // Scroll the desktop by direction, optionally from a coordinate.
  type_text(input: TypeTextInput): Promise<void>; // Type text into the current focus on the desktop.
  target: "linux";
}

type Screenshot = {
  bytes: Uint8Array; // Raw bytes
  data_url: string; // Base64-encoded JPEG data URL
  filepath: string; // Local file path
};

type ClickInput = {
  click_count?: number; // Number of clicks to perform.
  key?: string; // Optional key chord to hold during the click, using the same format as `press_key()`.
  mouse_button?: MouseButton; // Mouse button to click.
  x: number; // X coordinate on the desktop screenshot.
  y: number; // Y coordinate on the desktop screenshot.
};

type DragInput = {
  from_x: number; // Starting X coordinate on the desktop screenshot.
  from_y: number; // Starting Y coordinate on the desktop screenshot.
  key?: string; // Optional key chord to hold during the drag, using the same format as `press_key()`.
  to_x: number; // Ending X coordinate on the desktop screenshot.
  to_y: number; // Ending Y coordinate on the desktop screenshot.
};

type MoveInput = {
  key?: string; // Optional key chord to hold while moving, using the same format as `press_key()`.
  x: number; // X coordinate on the desktop screenshot.
  y: number; // Y coordinate on the desktop screenshot.
};

type PressKeyInput = {
  key: string; // Key or `+`-separated key chord using X Window System keysym-style names, such as `a`, `space`, `Return`, `Tab`, `Control_L+a`, or `Super_L+d`; whitespace around `+` is ignored and common aliases such as `Control`, `Ctrl`, `Alt`, and `Shift` are accepted.
};

type ScrollInput = {
  direction: Direction; // Direction to scroll.
  key?: string; // Optional key chord to hold during the scroll, using the same format as `press_key()`.
  pixels?: number; // Distance to scroll in pixels.
  x?: number; // Optional X coordinate for the scroll origin.
  y?: number; // Optional Y coordinate for the scroll origin.
};

type TypeTextInput = {
  text: string; // Text to type into the current focus.
};

type MouseButton = "left" | "right" | "middle" | "l" | "r" | "m";

type Direction = "up" | "down" | "left" | "right" | "u" | "d" | "l" | "r";
```
