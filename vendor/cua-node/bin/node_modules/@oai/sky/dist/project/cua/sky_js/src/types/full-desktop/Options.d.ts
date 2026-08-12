export type LinuxOptions = {
    target: "linux";
    /** Milliseconds to wait after successful input actions so the desktop can process and repaint. Set 0 to disable. (default: 100) */
    post_action_sleep_ms?: number;
    /** Resize mouse pointer in screenshots to this size in pixels. Set 0 to disable. (default: 12) */
    mouse_size_px?: number;
};
export type Options = LinuxOptions;
