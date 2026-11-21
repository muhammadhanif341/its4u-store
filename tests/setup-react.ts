// Next.js compiles JSX itself. The test runner uses the classic JSX transform, which needs React in scope,
// so tests that render components import this file first.
import React from "react";

(globalThis as unknown as { React: typeof React }).React = React;
